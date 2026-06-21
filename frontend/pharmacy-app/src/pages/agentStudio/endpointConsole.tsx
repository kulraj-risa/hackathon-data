import { useMemo, useState } from "react";
import { ENGINE_API_URL } from "../../api/denialEngine";

/* ──────────────────────────────────────────────────────────────────────────
 * Endpoint Validation Console — a judge-facing API playground.
 *
 * Every agent / service we built is mapped to its real, live engine endpoint.
 * Judges can read the request, hit "Send" (calls the production engine
 * directly), and inspect the status, latency, and raw JSON response — or copy
 * an equivalent curl command and validate independently. Nothing is mocked.
 * ────────────────────────────────────────────────────────────────────────── */

// ── Production links (single source of truth for the About panel) ──────────
const LINKS = {
  api: ENGINE_API_URL,
  swagger: `${ENGINE_API_URL}/docs`,
  redoc: `${ENGINE_API_URL}/redoc`,
  openapi: `${ENGINE_API_URL}/openapi.json`,
  app:
    typeof window !== "undefined"
      ? window.location.origin
      : "https://risa-denial-web-scnxtg3pqa-uc.a.run.app",
  github: "https://github.com/kulraj-risa/hackathon-data",
};

type Method = "GET" | "POST";

// A verbatim prompt that drives an agent. `system` is the system prompt sent to
// Claude; `user` is the user-message template (placeholders in {curly braces}
// are filled per-case at request time). These are copied 1:1 from the backend
// so judges can read exactly what the model is instructed to do.
interface PromptBlock {
  label?: string; // stage name, for multi-stage pipelines
  system: string;
  user?: string;
}

interface EndpointDef {
  id: string;
  agent: string; // human name of the agent/service
  method: Method;
  path: string;
  blurb: string; // what the service does
  validate: string; // what a judge should look for to confirm it's real
  body?: Record<string, unknown>; // default POST payload
}

// Strong, realistic evidence so responses are rich and meaningful.
const SUPPORTIVE = [
  "BMI 38.2 documented at last visit.",
  "Completed a 6-month supervised lifestyle and diet program without adequate weight loss.",
  "Comorbid hypertension and dyslipidemia.",
];
const CONTRADICTORY: string[] = [];

const ENDPOINTS: EndpointDef[] = [
  {
    id: "health",
    agent: "Engine Liveness",
    method: "GET",
    path: "/",
    blurb: "Cloud Run root/liveness probe — confirms the engine is up.",
    validate:
      'Returns the live service index (service: "risa-denial-api" + the endpoint list). Proves the backend is live, not a static mock.',
  },
  {
    id: "agents",
    agent: "Agent Registry / Orchestration",
    method: "GET",
    path: "/api/agents",
    blurb: "Single source of truth for the multi-agent pipeline (each agent's role, IO, reasoning).",
    validate:
      "Returns the full agent list with llm_available + llm_model. This same payload drives the Agent Studio graph above.",
  },
  {
    id: "predict",
    agent: "Denial-Risk Model (XGBoost)",
    method: "POST",
    path: "/api/predict",
    blurb: "Scores a PA's denial risk before filing using the trained model (AUC ~0.83).",
    validate:
      "Look for denial_risk, risk_level, decision (AUTO_SUBMIT/REVIEW/BLOCK), risk_factors, and model != 'placeholder'. Change the evidence and the risk moves.",
    body: {
      drug: "Wegovy",
      payer_name: "Aetna Commercial",
      medication_class: "Brand",
      supportive_texts: SUPPORTIVE,
      contradictory_texts: CONTRADICTORY,
    },
  },
  {
    id: "necessity",
    agent: "Medical Necessity Engine (8-stage)",
    method: "POST",
    path: "/api/necessity",
    blurb:
      "DB1 evidence → DB2 criteria → DB3 model → deciding factor → coverage → clinical answering → final justification.",
    validate:
      "Returns scores, a coverage_matrix (each criterion met/missing with a source), an agent trace, and a final prediction. Watch the per-stage reasoning.",
    body: {
      drug: "Wegovy",
      payer_name: "Aetna Commercial",
      supportive_texts: SUPPORTIVE,
      contradictory_texts: CONTRADICTORY,
      engine: "default",
    },
  },
  {
    id: "answer",
    agent: "Questionnaire Answerer (agent team)",
    method: "POST",
    path: "/api/answer",
    blurb:
      "A team of specialists drafts how to answer the PA questionnaire and why — with citations.",
    validate:
      "Returns reasoning_mode (llm/rule), agents[], and questions[] with recommended_answer + justification + evidence per question.",
    body: {
      drug: "Repatha",
      payer_name: "Cigna",
      supportive_texts: ["Clinical ASCVD with prior MI.", "LDL-C 142 mg/dL on most recent panel."],
      contradictory_texts: ["No documentation of maximally tolerated statin therapy."],
    },
  },
  {
    id: "gap",
    agent: "Criteria Gap Recovery",
    method: "POST",
    path: "/api/gap-recovery",
    blurb:
      "For each unmet criterion: importance, bypassability, alternative pathways, and an appeal strategy.",
    validate:
      "Each criterion returns importance, bypassable, reviewer_intent, alternative_pathways, and appeal_strategy — recovery options, not just a denial.",
    body: {
      drug: "Repatha",
      payer_name: "Cigna",
      criteria: [
        {
          statement: "Documented trial and failure of maximally tolerated statin therapy",
          critical: true,
          status: "UNVERIFIED",
        },
      ],
    },
  },
  {
    id: "denial",
    agent: "Post-Denial Appeal Specialist",
    method: "POST",
    path: "/api/denial-recovery",
    blurb:
      "Given a denied PA: appeal viability, approval probability, root cause, required docs, and a drafted appeal letter.",
    validate:
      "Returns appeal_viability, approval_probability, root_cause, required_documents, a classification, and a submission-ready appeal_letter.",
    body: {
      drug: "Repatha",
      payer_name: "Cigna",
      denial_reason: "Step therapy not satisfied — no documented statin trial/failure.",
      supportive_texts: ["Clinical ASCVD with prior MI.", "LDL-C 142 mg/dL."],
      contradictory_texts: [],
    },
  },
  {
    id: "criteria",
    agent: "Criteria Knowledge Base (index)",
    method: "GET",
    path: "/api/criteria",
    blurb: "Per-drug index of the mined coverage Criteria KB.",
    validate: "Returns the list of drugs with criteria counts — the authoritative KB behind every decision.",
  },
  {
    id: "graph-stats",
    agent: "Knowledge Graph · DB inventory",
    method: "GET",
    path: "/api/graph/stats",
    blurb:
      "In-memory clinical knowledge graph (Neo4j/PMG-compatible): Drug→Criterion→CoveragePolicy→Payer nodes.",
    validate:
      "Returns live node/edge counts (265 nodes / 281 edges: 22 Drugs, 199 Criteria, 41 CoveragePolicies, 3 Payers), the typed schema (patient + coverage layers), and the semantic matcher thresholds. Proves the graph DB is real and loaded.",
  },
  {
    id: "graph-drug",
    agent: "Knowledge Graph · drug subgraph",
    method: "GET",
    path: "/api/graph/drug/Ozempic",
    blurb: "The Drug→Criterion→CoveragePolicy subgraph for one drug, with provenance.",
    validate:
      "Returns the drug's full criteria nodes (statement, critical flag, source, positive/negative evidence anchors) and its payer coverage-policy nodes. Swap the drug name in the path to traverse any of the 22 covered drugs.",
  },
  {
    id: "graph-match",
    agent: "Knowledge Graph · semantic match",
    method: "POST",
    path: "/api/graph/match",
    blurb:
      "The upgrade over content-word overlap: TF-IDF cosine + negation / contradiction / exclusion awareness.",
    validate:
      "Each criterion returns status (MET / AT_RISK / UNVERIFIED), a match_score, and the exact evidence line that drove it — plus readiness_pct and a continuous coverage_signal. Edit the evidence and the statuses move.",
    body: {
      drug: "Ozempic",
      supportive_texts: [
        "Patient has type 2 diabetes mellitus, HbA1c 8.4%.",
        "Tried and failed metformin for 3 months.",
      ],
      contradictory_texts: ["No documented trial of a GLP-1 alternative."],
    },
  },
  {
    id: "graph-eval",
    agent: "Knowledge Graph · accuracy eval",
    method: "GET",
    path: "/api/graph/eval",
    blurb: "Head-to-head accuracy of the graph vs. the content-overlap baseline on 10k historic PAs.",
    validate:
      "Returns measured numbers: coverage-matcher AUC 0.632 (baseline) → 0.664 (graph, +0.032), and an explainable k-NN DB3 at accuracy 0.713 / AUC 0.794 (vs opaque XGBoost ~0.84). Reproducible via tools/eval_graph_kb.py.",
  },
  {
    id: "graph-cypher",
    agent: "Knowledge Graph · Neo4j/PMG drop-in",
    method: "GET",
    path: "/api/graph/cypher",
    blurb: "The Cypher that folds this coverage subgraph onto a live PMG/Neo4j instance.",
    validate:
      "Returns schema constraints, sample upsert statements, and the single-traversal coverage query that replaces app-side matching once data lives in PMG — the production upgrade path.",
  },
  {
    id: "criteria-drug",
    agent: "Criteria KB · single drug",
    method: "GET",
    path: "/api/criteria/Wegovy",
    blurb: "Full coverage checklist for one drug (history + FDA + payer).",
    validate: "Returns the source-tagged criteria checklist for Wegovy.",
  },
  {
    id: "groundtruth",
    agent: "Closed-Loop Validation",
    method: "GET",
    path: "/api/groundtruth",
    blurb: "AI decisions vs. clinician-verified ground truth (agreement, precision/recall, κ).",
    validate:
      "Returns agreement_pct, precision/recall/f1, cohens_kappa and a confusion_matrix from human-graded criteria.",
  },
  {
    id: "triage",
    agent: "Addressable-Denial Triage",
    method: "GET",
    path: "/api/triage",
    blurb: "How denials split into addressable vs. non-addressable buckets.",
    validate: "Returns the triage distribution used to size the opportunity.",
  },
  {
    id: "insights",
    agent: "Model Insights",
    method: "GET",
    path: "/api/insights",
    blurb: "Aggregate denial-risk insights derived from the trained model + data.",
    validate: "Returns model metrics + top risk drivers powering the Analytics tab.",
  },
];

// ── The real prompts, copied verbatim from the backend agents ──────────────
// (src/denial_engine/agents/*.py). Keyed by endpoint id. {curly} tokens are
// the per-case placeholders the engine fills before calling Claude.
const PROMPTS: Record<string, PromptBlock[]> = {
  answer: [
    {
      label: "LLM Clinical Reasoner",
      system:
        "You are a senior pharmacy prior-authorization reviewer. You decide, for each " +
        "coverage criterion, whether the patient's chart evidence MEETS it, CONTRADICTS " +
        "it (AT_RISK), or is silent (UNVERIFIED). Be strict and payer-minded: only mark " +
        "MET when the evidence clearly supports it. Ground every judgment in the provided " +
        "criteria, mechanism, guidelines, and payer policy. Never invent clinical facts " +
        "that are not in the evidence.",
      user: `DRUG: {drug}
PAYER: {payer}
MECHANISM: {mechanism}
GUIDELINES: {guidelines}
PAYER POLICY ({matched_policy}): {strategy}

COVERAGE CRITERIA (answer each by index):
{i}. [{source}/critical] {criterion statement}   ← one line per criterion

SUPPORTIVE CHART EVIDENCE:
- {supportive evidence lines}

CONTRADICTORY / MISSING EVIDENCE:
- {contradictory / missing evidence lines}

Return JSON of the form:
{"verdict":"AUTO_FILE|REVIEW|BLOCK","readiness_pct":0-100,
 "summary":"<=60 word reviewer note",
 "questions":[{"index":int,"status":"MET|AT_RISK|UNVERIFIED",
   "recommended_answer":"how to answer this item",
   "justification":"clinical+payer reason",
   "citation":"the supporting evidence line, or 'no chart evidence'"}]}`,
    },
  ],
  denial: [
    {
      label: "Post-Denial Appeal Specialist",
      system:
        "You are an Expert Prior Authorization Denial Recovery and Insurance Appeal Specialist " +
        "with deep expertise in Medicare Part D, commercial PBMs (OptumRx, Express Scripts, " +
        "Caremark, Prime Therapeutics, Humana), Medicaid formularies, FDA labeling, NCCN/ASCO/" +
        "AHFS/DRUGDEX and payer-specific coverage criteria, oncology and specialty PAs, formulary " +
        "exceptions, medical-necessity appeals, step-therapy overrides, quantity-limit exceptions, " +
        "and continuation-of-therapy appeals. Your objective is to determine whether a denied PA " +
        "can realistically be overturned and identify the highest-yield recovery opportunities. " +
        "STRICT RULES: focus only on approval-relevant factors; be concise and actionable; never " +
        "assert the patient has a condition — frame evidence as 'document if present'; distinguish " +
        "clearly between recoverable and non-recoverable denials; if a denial is a plan exclusion, " +
        "say so; always recommend the highest-probability pathway; always provide a recovery " +
        "classification, approval probability, and appeal viability.",
      user: `DRUG: {drug}    PAYER/PBM: {payer}
DENIAL REASON (as stated): {denial_reason}
DENIAL LETTER EXCERPT: {denial_letter[:1500]}
{SUBMITTED PA ANSWERS, if any}

SUPPORTIVE CHART EVIDENCE:
- {supportive lines}

CONTRADICTORY EVIDENCE / GAPS (likely denial drivers):
- {contradictory lines}

Perform the full denial-recovery analysis and output JSON of EXACTLY this form
(no prose outside JSON). Keep bullets concise and action-oriented. The
appeal_letter must be a complete, submission-ready letter that addresses the
denial reason, cites medical necessity / FDA label / NCCN-ASCO when applicable,
explains why formulary alternatives are inappropriate, emphasizes patient safety
and the risk of delayed treatment, and requests reconsideration and approval.
classification.code is an integer 1-9 (1=QUICK WIN, 2=STEP THERAPY OVERRIDE,
3=FORMULARY EXCEPTION, 4=MEDICAL NECESSITY APPEAL, 5=CONTINUATION OF THERAPY,
6=QUANTITY LIMIT EXCEPTION, 7=CODING/ADMINISTRATIVE CORRECTION, 8=PLAN EXCLUSION,
9=NON-RECOVERABLE).

{"assessment":{"appeal_viable":"YES|NO|CONDITIONAL","approval_probability":"HIGH|MODERATE|LOW","approval_probability_pct":0,"recovery_priority":"HIGH|MEDIUM|LOW"},
 "root_cause":[],"recovery_opportunities":[],"required_documents":[],
 "appeal_strategy":"","appeal_letter":"","classification":{"code":4,"label":""},
 "automation":{...}}`,
    },
  ],
  gap: [
    {
      label: "Criteria Gap & Recovery Strategist",
      system:
        "You are a Prior Authorization Criteria Gap & Recovery strategist with deep payer " +
        "medical-policy and clinical expertise. For each coverage criterion the patient " +
        "does NOT clearly meet, you analyze how to still legitimately secure approval. " +
        "You know step-therapy exceptions, contraindications, drug-drug and drug-disease " +
        "interactions, intolerance vs. ineffectiveness distinctions, safety arguments, " +
        "medical-necessity arguments, and appeal strategy. STRICT RULES: (1) Never assert " +
        "the patient HAS any condition or finding — frame every pathway as evidence to " +
        "'document if present/applicable'. (2) Be specific and clinically accurate; cite " +
        "the reviewer's underlying intent. (3) Distinguish non-bypassable hard requirements " +
        "(usually deny) from potentially-bypassable and frequently-appealed criteria.",
      user: `DRUG: {drug}    PAYER: {payer}
{approval drivers / denial drivers / step therapy from DB2}

UNMET / AT-RISK COVERAGE CRITERIA (analyze each):
{i}. [{source}/critical] (status={status}) {criterion statement}

For EACH criterion above, perform a criteria gap & recovery analysis. Identify
importance (Critical/Major/Minor), criterion_type (one of: Hard Requirement,
Step Therapy Requirement, Clinical Threshold, Documentation Requirement,
Medical Necessity Requirement, Utilization Management Requirement),
whether it can be bypassed (Yes/No/Sometimes), the reviewer's intent, all
clinically-accepted alternative pathways, medical-necessity arguments,
contraindication-based and safety-based bypass options, alternative clinical
evidence that satisfies the reviewer's intent, appeal_strength
(Strong/Moderate/Weak), and the strongest evidence-based appeal_arguments.
Frame pathways as evidence to document if present — never assert the patient has
a condition. Output JSON of EXACTLY this form:
{"gaps":[{"criterion":"","importance":"","criterion_type":"","bypass_possible":"",
 "reviewer_intent":"","alternative_pathways":[],"medical_necessity_arguments":[],
 "contraindication_based_bypass":[],"safety_based_bypass":[],
 "alternative_clinical_evidence":[],"appeal_strength":"","appeal_arguments":[]}]}`,
    },
  ],
  necessity: [
    {
      label: "Stage 1 · DB1 — Patient Evidence Extraction",
      system:
        "You are a Prior Authorization Clinical Evidence Extraction Engine. You " +
        "analyze patient documents and extract ONLY clinically relevant evidence for " +
        "the requested medication. Never infer unsupported facts. Every finding must " +
        "trace to a source document.",
      user: `Requested Drug: {drug}

Patient Documents:
{document text}

Extract relevant evidence (diagnosis, ICD codes, medication history, trial/failure
history, contraindications, allergies, labs, imaging, pathology, genetic testing,
weight/BMI, vitals, regimens, provider assessments). Categorize each as Strong
Supporting / Supporting / Neutral / Missing / Contradictory. For each finding give
evidence, source document, date, and a confidence 0-100. Detect missing
documentation that may affect PA approval.

Output JSON: {"diagnosis":[],"icd_codes":[],"current_medications":[], ... "confidence":0}`,
    },
    {
      label: "Stage 2 · DB2 — Drug Criteria Intelligence",
      system:
        "You are a Pharmacy Benefit Clinical Criteria Engine. You produce the coverage " +
        "requirements a PA must satisfy, grounded in FDA labels, payer/PBM policy, and " +
        "guideline compendia (NCCN/AHFS/DRUGDEX). Tag every requirement with its source.",
    },
    {
      label: "Stage 3 · DB3 — Outcome Prediction",
      system:
        "You are a Prior Authorization Outcome Prediction Engine. You analyze historical " +
        "PA outcomes to surface approval/denial patterns and a probability of approval.",
    },
    {
      label: "Stage 4 · Deciding Factor",
      system:
        "You are a Senior Clinical Prior Authorization Reviewer. You weigh patient " +
        "evidence (DB1) against drug criteria (DB2) and historical outcomes (DB3) and " +
        "decide whether the patient meets criteria. Be strict and payer-minded. " +
        "Scoring weights: Clinical Match 40%, Criteria Coverage 30%, Historical 20%, " +
        "Documentation 10%.",
    },
    {
      label: "Stage 5 · Coverage Validator",
      system:
        "You are an Evidence Coverage Validator. For each payer requirement you state " +
        "whether the patient's evidence is present, which document supports it, your " +
        "confidence, and whether it is missing. You return a coverage matrix only.",
    },
    {
      label: "Stage 6 · Approval Optimization",
      system:
        "You are an Approval Optimization Agent for prior authorizations. You re-evaluate " +
        "a case from an approval perspective. STRICT RULES: (1) You may NOT invent, " +
        "assume, or fabricate any clinical fact, lab value, diagnosis, or trial/failure " +
        "that is not in the provided evidence. (2) You MAY reframe existing evidence in " +
        "payer-favorable, medically-accurate language. (3) You MAY identify requirements " +
        "that are genuinely optional, satisfiable by substitute evidence, or not " +
        "applicable to this indication, and say so with the rationale. (4) For true gaps, " +
        "you state exactly what documentation the provider must supply — you never paper " +
        "over them. This keeps optimization compliant and audit-defensible.",
    },
    {
      label: "Stage 7 · Clinical Answering",
      system:
        "You are a Clinical Prior Authorization Answering Agent operating under the " +
        "pharmacy benefit. You answer each questionnaire item the way a payer expects, " +
        "grounded strictly in the provided evidence and criteria. For each item give the " +
        "recommended answer, a clinical+payer justification, and the supporting citation.",
    },
    {
      label: "Stage 8 · Final Justification",
      system:
        "You are a Senior Prior Authorization Clinical Decision Engine. You produce the " +
        "final approval prediction, confidence, clinical justification, risks, missing " +
        "documentation, and the recommended next action.",
    },
  ],
};

const methodTone: Record<Method, string> = {
  GET: "bg-[#EAF2FF] text-[#0056D6]",
  POST: "bg-[#EFE7FF] text-[#5B21B6]",
};

interface RunState {
  loading: boolean;
  status?: number;
  ms?: number;
  body?: string;
  error?: string;
}

const EndpointCard = ({ ep }: { ep: EndpointDef }) => {
  const [bodyText, setBodyText] = useState(
    ep.body ? JSON.stringify(ep.body, null, 2) : "",
  );
  const [run, setRun] = useState<RunState>({ loading: false });
  const [copied, setCopied] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  const prompts = PROMPTS[ep.id];
  const url = `${ENGINE_API_URL}${ep.path}`;

  const send = async () => {
    setRun({ loading: true });
    const t0 = performance.now();
    try {
      const init: RequestInit =
        ep.method === "POST"
          ? {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: bodyText || "{}",
            }
          : { method: "GET" };
      const res = await fetch(url, init);
      const text = await res.text();
      let pretty = text;
      try {
        pretty = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        /* leave as text */
      }
      setRun({
        loading: false,
        status: res.status,
        ms: Math.round(performance.now() - t0),
        body: pretty,
      });
    } catch (e: any) {
      setRun({
        loading: false,
        ms: Math.round(performance.now() - t0),
        error: e?.message || "Request failed (network / CORS).",
      });
    }
  };

  const copyCurl = () => {
    const curl =
      ep.method === "POST"
        ? `curl -s -X POST '${url}' \\\n  -H 'Content-Type: application/json' \\\n  -d '${(bodyText || "{}").replace(/\n\s*/g, " ")}'`
        : `curl -s '${url}'`;
    navigator.clipboard?.writeText(curl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const ok = run.status != null && run.status >= 200 && run.status < 300;

  return (
    <div className="rounded-xl border border-primaryGray-14 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`rounded px-2 py-0.5 text-[10px] font-bold ${methodTone[ep.method]}`}
          >
            {ep.method}
          </span>
          <span className="text-small font-semibold text-primaryGray-1">
            {ep.agent}
          </span>
        </div>
        <code className="truncate text-[11px] text-primaryGray-7" title={url}>
          {ep.path}
        </code>
      </div>

      <p className="mt-2 text-[12px] leading-relaxed text-primaryGray-6">
        {ep.blurb}
      </p>

      <div className="mt-2 rounded-md border border-[#CDE7DF] bg-[#F3FAF7] px-3 py-2 text-[11px] leading-relaxed text-[#005D49]">
        <span className="font-bold">What to validate: </span>
        {ep.validate}
      </div>

      {ep.method === "POST" && (
        <div className="mt-3">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-primaryGray-9">
            Request body (editable)
          </div>
          <textarea
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            spellCheck={false}
            rows={Math.min(10, bodyText.split("\n").length + 1)}
            className="w-full rounded-md border border-primaryGray-14 bg-primaryGray-17 p-2 font-mono text-[11px] text-primaryGray-2 focus:border-primaryGray-9 focus:outline-none"
          />
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={send}
          disabled={run.loading}
          className="rounded-md bg-primaryGray-1 px-4 py-1.5 text-x-tiny font-bold text-white hover:bg-black disabled:opacity-50"
        >
          {run.loading ? "Sending…" : "Send"}
        </button>
        <button
          onClick={copyCurl}
          className="rounded-md border border-primaryGray-14 bg-white px-3 py-1.5 text-x-tiny font-bold text-primaryGray-3 hover:bg-primaryGray-16"
        >
          {copied ? "Copied ✓" : "Copy curl"}
        </button>
        {prompts && (
          <button
            onClick={() => setShowPrompt((v) => !v)}
            className={`rounded-md border px-3 py-1.5 text-x-tiny font-bold ${
              showPrompt
                ? "border-[#c9b6f0] bg-[#EFE7FF] text-[#5B21B6]"
                : "border-primaryGray-14 bg-white text-[#5B21B6] hover:bg-[#F5F0FF]"
            }`}
          >
            {showPrompt ? "Hide prompt" : prompts.length > 1 ? `View prompts (${prompts.length})` : "View prompt"}
          </button>
        )}
        {run.status != null && (
          <span
            className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
              ok ? "bg-[#E6F3F0] text-[#005D49]" : "bg-[#FFE8E8] text-[#CC0300]"
            }`}
          >
            {run.status} {ok ? "OK" : "ERR"}
          </span>
        )}
        {run.ms != null && (
          <span className="text-[11px] text-primaryGray-8">{run.ms} ms</span>
        )}
      </div>

      {prompts && showPrompt && (
        <div className="mt-3 rounded-md border border-[#E2D6FA] bg-[#FBF9FF] p-3">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-[#5B21B6]">
            Live agent prompt{prompts.length > 1 ? "s" : ""} · verbatim from the backend
          </div>
          <p className="mb-2 text-[11px] leading-relaxed text-primaryGray-6">
            Exactly what is sent to Claude. <code>{"{curly}"}</code> tokens are filled per-case at
            request time.
          </p>
          <div className="space-y-3">
            {prompts.map((p, i) => (
              <div key={i}>
                {p.label && (
                  <div className="mb-1 text-[11px] font-bold text-primaryGray-2">{p.label}</div>
                )}
                <div className="mb-0.5 text-[9px] font-bold uppercase tracking-wide text-primaryGray-8">
                  System prompt
                </div>
                <pre className="mb-2 max-h-56 overflow-auto whitespace-pre-wrap rounded-md border border-primaryGray-14 bg-white p-2.5 text-[11px] leading-relaxed text-primaryGray-2">
                  {p.system}
                </pre>
                {p.user && (
                  <>
                    <div className="mb-0.5 text-[9px] font-bold uppercase tracking-wide text-primaryGray-8">
                      User-message template
                    </div>
                    <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-md border border-primaryGray-14 bg-white p-2.5 font-mono text-[11px] leading-relaxed text-primaryGray-2">
                      {p.user}
                    </pre>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {(run.body || run.error) && (
        <div className="mt-2">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-primaryGray-9">
            Response
          </div>
          {run.error ? (
            <div className="rounded-md border border-tertiaryRed-8 bg-tertiaryRed-11 px-3 py-2 text-[11px] text-tertiaryRed-2">
              {run.error}
            </div>
          ) : (
            <pre className="max-h-72 overflow-auto rounded-md border border-primaryGray-14 bg-primaryGray-17 p-3 text-[11px] leading-relaxed text-primaryGray-2">
              {run.body}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

// A presentable external-link button with an icon dot + caption.
const LinkButton = ({
  href,
  label,
  caption,
  tone = "default",
}: {
  href: string;
  label: string;
  caption: string;
  tone?: "default" | "primary" | "dark";
}) => {
  const tones: Record<string, string> = {
    default:
      "border-primaryGray-14 bg-white text-primaryGray-2 hover:border-primaryGray-9",
    primary:
      "border-[#c9b6f0] bg-[#F5F0FF] text-[#5B21B6] hover:border-[#5B21B6]",
    dark: "border-primaryGray-1 bg-primaryGray-1 text-white hover:bg-black",
  };
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`group flex min-w-[160px] flex-1 items-start gap-2 rounded-lg border px-3 py-2 transition-colors ${tones[tone]}`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-1 text-[12px] font-bold">
          {label}
          <span className="opacity-60 transition-transform group-hover:translate-x-0.5">
            ↗
          </span>
        </div>
        <div
          className={`truncate text-[10px] ${tone === "dark" ? "text-white/70" : "text-primaryGray-7"}`}
        >
          {caption}
        </div>
      </div>
    </a>
  );
};

// "About" panel: production links + a plain-English explanation of the API so
// a judge can orient in ~15 seconds before touching a single endpoint.
const AboutPanel = () => {
  const [copied, setCopied] = useState(false);
  const copyBase = () => {
    navigator.clipboard?.writeText(LINKS.api);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="mb-5 rounded-xl border border-[#D8C8FF] bg-gradient-to-br from-[#FBF9FF] to-white p-5">
      <div className="text-[11px] font-bold uppercase tracking-wider text-[#5B21B6]">
        About · RISA Denial Prevention Engine
      </div>
      <h2 className="mt-0.5 text-lg font-semibold text-primaryGray-1">
        One live FastAPI service. {ENDPOINTS.length} real endpoints. Zero mocks.
      </h2>
      <p className="mt-1 max-w-4xl text-[12px] leading-relaxed text-primaryGray-6">
        The engine is a single FastAPI app on Cloud Run that powers every agent
        in this studio. It is <b>stateless and PHI-safe</b> — it reasons over a
        precomputed, de-identified Criteria KB + a trained XGBoost model and
        returns JSON, so the pharmacy UI never ships live PHI to it.{" "}
        <b>GET</b> routes expose knowledge &amp; analytics (criteria KB, the
        clinical knowledge graph, ground-truth eval); <b>POST</b> routes run the
        live LLM + model agents (denial prediction, 9-stage medical necessity,
        questionnaire answering, gap recovery, appeal drafting). Every route is
        documented by an auto-generated OpenAPI spec — open Swagger below and
        try them outside this app.
      </p>

      {/* Production links */}
      <div className="mt-4 flex flex-wrap gap-2">
        <LinkButton
          href={LINKS.swagger}
          label="Swagger / OpenAPI"
          caption="Interactive API docs (try-it-out)"
          tone="primary"
        />
        <LinkButton
          href={LINKS.redoc}
          label="ReDoc"
          caption="Readable API reference"
        />
        <LinkButton
          href={LINKS.openapi}
          label="OpenAPI JSON"
          caption="Machine-readable spec"
        />
        <LinkButton
          href={LINKS.api}
          label="Live engine root"
          caption="Service index + endpoint list"
        />
        <LinkButton
          href={LINKS.github}
          label="Source on GitHub"
          caption="kulraj-risa/hackathon-data"
          tone="dark"
        />
      </div>

      {/* Base URL with copy */}
      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md border border-primaryGray-14 bg-white px-3 py-2">
        <span className="text-[10px] font-bold uppercase tracking-wide text-primaryGray-9">
          Base URL
        </span>
        <code className="flex-1 break-all text-[11px] text-primaryGray-2">
          {LINKS.api}
        </code>
        <button
          onClick={copyBase}
          className="rounded-md border border-primaryGray-14 bg-white px-2.5 py-1 text-[10px] font-bold text-primaryGray-3 hover:bg-primaryGray-16"
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>

      {/* Quick API facts */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { k: `${ENDPOINTS.length}`, l: "Documented endpoints" },
          {
            k: `${ENDPOINTS.filter((e) => e.method === "GET").length} / ${ENDPOINTS.filter((e) => e.method === "POST").length}`,
            l: "GET / POST",
          },
          { k: "JSON", l: "Request + response" },
          { k: "CORS-open", l: "Validate from anywhere" },
        ].map((m, i) => (
          <div
            key={i}
            className="rounded-lg border border-primaryGray-14 bg-white px-3 py-2"
          >
            <div className="text-base font-semibold text-primaryGray-1">
              {m.k}
            </div>
            <div className="text-[10px] text-primaryGray-6">{m.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const EndpointConsole = () => {
  const [filter, setFilter] = useState<"all" | Method>("all");
  const list = useMemo(
    () => ENDPOINTS.filter((e) => filter === "all" || e.method === filter),
    [filter],
  );

  return (
    <div className="mb-6 rounded-xl border border-primaryGray-14 bg-primaryGray-16 p-5">
      <AboutPanel />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#5B21B6]">
            For judges · validate every agent live
          </div>
          <h2 className="mt-0.5 text-lg font-semibold text-primaryGray-1">
            Endpoint Validation Console
          </h2>
          <p className="mt-1 max-w-3xl text-[12px] text-primaryGray-6">
            Each agent / service below is wired to its real engine endpoint. Hit{" "}
            <b>Send</b> to call the live API, inspect the status, latency and raw
            JSON, or <b>Copy curl</b> to validate independently from a terminal. For
            the LLM agents, <b>View prompt</b> shows the verbatim system + user
            prompt sent to Claude. Nothing here is mocked.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={LINKS.swagger}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-[#c9b6f0] bg-[#F5F0FF] px-3 py-1.5 text-x-tiny font-bold text-[#5B21B6] hover:border-[#5B21B6]"
          >
            Swagger ↗
          </a>
          <a
            href={LINKS.github}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-primaryGray-14 bg-white px-3 py-1.5 text-x-tiny font-bold text-primaryGray-3 hover:bg-white/70"
          >
            GitHub ↗
          </a>
        </div>
      </div>

      <div className="mt-3 inline-flex overflow-hidden rounded-lg border border-primaryGray-14 bg-white">
        {(["all", "GET", "POST"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-x-tiny font-bold uppercase tracking-wide transition-colors ${
              filter === f
                ? "bg-primaryGray-1 text-white"
                : "text-primaryGray-7 hover:bg-primaryGray-16"
            }`}
          >
            {f === "all" ? "All" : f}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
        {list.map((ep) => (
          <EndpointCard key={ep.id} ep={ep} />
        ))}
      </div>
    </div>
  );
};

export default EndpointConsole;
