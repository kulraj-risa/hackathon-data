import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AgentMeta,
  AgentRegistry,
  AGENT_REGISTRY_FALLBACK,
  AnswerPacket,
  CriteriaIndexItem,
  FilingQueueCase,
  getAgents,
  getCriteriaIndex,
  getGroundTruth,
  GroundTruthEval,
  NecessityResult,
  PredictResult,
  GapRecoveryResult,
  answerQuestionnaire,
  fetchGapRecovery,
  predictCase,
  runNecessity,
} from "../../api/denialEngine";
import AgentFlowGraph from "./agentFlowGraph";
import EndpointConsole from "./endpointConsole";

/* ──────────────────────────────────────────────────────────────────────────
 * Agent Studio — explains the denial-prevention engine: its architecture, the
 * multi-agent orchestration, and a live runner to watch the agents reason on a
 * real case. Backed by the engine's own /api/agents, /api/criteria, /api/answer
 * and /api/predict so what you see is exactly what runs in production.
 * ────────────────────────────────────────────────────────────────────────── */

const PAYERS = [
  "Aetna Commercial",
  "Cigna",
  "UnitedHealthcare",
  "Humana",
  "BCBS Federal",
  "Fidelis Care",
];

const FALLBACK_DRUGS = [
  "Wegovy",
  "Zepbound",
  "Ozempic",
  "Mounjaro",
  "Repatha",
  "Injectafer",
  "Prolia",
  "Xgeva",
  "Lupron",
  "Gemtesa",
];

interface Preset {
  label: string;
  drug: string;
  payer: string;
  supportive: string;
  contradictory: string;
}

const PRESETS: Preset[] = [
  {
    label: "Wegovy · Aetna (strong file)",
    drug: "Wegovy",
    payer: "Aetna Commercial",
    supportive:
      "BMI 38.2 documented at last visit. Patient completed a 6-month supervised lifestyle and diet program without adequate weight loss. Comorbid hypertension and dyslipidemia. Prescribed as adjunct to reduced-calorie diet and increased physical activity.",
    contradictory: "",
  },
  {
    label: "Repatha · Cigna (gap to fix)",
    drug: "Repatha",
    payer: "Cigna",
    supportive:
      "Clinical ASCVD with prior MI. LDL-C 142 mg/dL on most recent lipid panel.",
    contradictory:
      "No documentation of maximally tolerated statin therapy; patient self-discontinued atorvastatin without recorded intolerance.",
  },
  {
    label: "Injectafer · UnitedHealthcare",
    drug: "Injectafer",
    payer: "UnitedHealthcare",
    supportive:
      "Iron-deficiency anemia with ferritin 9 ng/mL and TSAT 11%. Documented intolerance to oral ferrous sulfate (GI side effects).",
    contradictory: "",
  },
];

// The Medical Necessity (v2) staged pipeline — mirrors necessity_engine.py.
const NECESSITY_STAGES: AgentMeta[] = [
  {
    id: "db1",
    name: "DB1 · Patient Document Intelligence",
    role: "Extracts clinically relevant evidence from EMR documents.",
    order: 1,
    method: "LLM extraction",
    tech: "Claude (Haiku) over EMR docs",
    inputs: ["patient documents", "drug"],
    outputs: ["diagnosis / ICD", "labs", "trial-failure history", "supporting + missing evidence"],
    optional: false,
    reasoning:
      "Pulls only clinically relevant evidence for the requested drug — diagnosis, ICD, labs, trial/failure, contraindications — and flags missing documentation. Never infers unsupported facts.",
  },
  {
    id: "db2",
    name: "DB2 · Drug Criteria Intelligence",
    role: "Builds the coverage requirements the PA must satisfy.",
    order: 2,
    method: "KB + LLM criteria",
    tech: "Criteria KB + FDA/payer/PBM/NCCN",
    inputs: ["drug", "payer"],
    outputs: ["required evidence/labs", "step therapy", "approval + denial drivers"],
    optional: false,
    reasoning:
      "Seeds from our mined Criteria KB (authoritative) and fills gaps from FDA label, payer/PBM policy, and guideline compendia. Every requirement is source-tagged.",
  },
  {
    id: "db3",
    name: "DB3 · Historical Approval Intelligence",
    role: "Approval probability + patterns from 10k historical outcomes.",
    order: 3,
    method: "Trained model (XGBoost)",
    tech: "XGBoost + TF-IDF (AUC ~0.83)",
    inputs: ["drug", "payer", "evidence"],
    outputs: ["approval probability", "top approval/denial factors"],
    optional: false,
    reasoning:
      "The learned historical-approval intelligence: the trained model scores this case from the 10k labeled outcomes, providing the calibrated probability backbone.",
  },
  {
    id: "deciding",
    name: "Deciding Factor (Core Brain)",
    role: "Weighs DB1/DB2/DB3 into a decision + recommended path.",
    order: 4,
    method: "LLM reasoning (weighted)",
    tech: "Clinical 40% · Coverage 30% · History 20% · Docs 10%",
    inputs: ["DB1", "DB2", "DB3", "baseline scores"],
    outputs: ["4 sub-scores", "approval probability", "recommended path"],
    optional: false,
    reasoning:
      "The core brain. Determines whether the patient meets criteria and produces the four weighted sub-scores, an overall approval probability, and a recommended path (HIGH_APPROVAL / REQUIRES_REVIEW / LIKELY_DENIAL).",
  },
  {
    id: "coverage",
    name: "Evidence Coverage Validator",
    role: "Per-requirement coverage matrix (present / missing / which doc).",
    order: 5,
    method: "Coverage matrix",
    tech: "Requirement ↔ evidence mapping",
    inputs: ["DB2 requirements", "DB1 evidence"],
    outputs: ["coverage matrix", "confidence per requirement"],
    optional: false,
    reasoning:
      "Between the brain and the answering stage: for each payer requirement, states whether evidence is present, which document supports it, the confidence, and whether it is missing.",
  },
  {
    id: "reeval",
    name: "Approval-Friendly Re-Evaluation",
    role: "Compliant grey-area optimization when the case isn't a clean approval.",
    order: 6,
    method: "LLM (compliant optimizer)",
    tech: "Governed prompt — no fabrication",
    inputs: ["approval probability", "supporting + missing evidence"],
    outputs: ["enhanced justification", "substitute evidence", "remaining risks"],
    optional: true,
    reasoning:
      "Runs only when the path isn't HIGH_APPROVAL. Reframes existing evidence in payer-favorable language and finds legitimately-optional requirements — explicitly forbidden from inventing clinical facts (audit-defensible).",
  },
  {
    id: "gap",
    name: "Criteria Gap Recovery",
    role: "Recovery pathways + appeal strategy for unmet criteria.",
    order: 7,
    method: "LLM (compliant optimizer)",
    tech: "Gap → alternative pathways → appeal",
    inputs: ["unmet criteria", "DB2 approval/denial drivers"],
    outputs: ["alternative pathways", "bypass arguments", "appeal strength"],
    optional: false,
    reasoning:
      "For each criterion the chart doesn't satisfy, surfaces clinically-accepted alternative pathways (e.g. intolerance vs. ineffectiveness), contraindication/safety-based bypass, the reviewer's intent, and the strongest appeal arguments — framed as 'document if present', never fabricated.",
  },
  {
    id: "clinical",
    name: "Clinical Answering",
    role: "Answers the questionnaire in pharmacy-benefit terms.",
    order: 8,
    method: "LLM answering",
    tech: "Grounded in coverage + evidence",
    inputs: ["questions", "coverage matrix", "DB1 evidence"],
    outputs: ["per-item answer", "status", "justification + citation"],
    optional: false,
    reasoning:
      "Drafts the recommended answer for each questionnaire item, grounded strictly in the validated evidence and criteria — the answer a payer expects.",
  },
  {
    id: "final",
    name: "Final Justification",
    role: "Final prediction, confidence, risks, and next steps.",
    order: 9,
    method: "LLM decision",
    tech: "Senior-reviewer synthesis",
    inputs: ["clinical answers", "scores", "history"],
    outputs: ["APPROVE / PEND / DENY", "confidence", "justification", "next steps"],
    optional: false,
    reasoning:
      "Synthesizes everything into the final approval prediction with a confidence score, clinical justification, key risks, and the recommended next action.",
  },
];

/* ── small presentational helpers ───────────────────────────────────────── */
const METHOD_COLOR: Record<string, { bg: string; color: string }> = {
  "LLM semantic reasoning": { bg: "#EFE7FF", color: "#5B21B6" },
  "Heuristic NLP (content-word overlap)": { bg: "#E6F0FF", color: "#1D4ED8" },
  "Knowledge Base lookup": { bg: "#E6F3F0", color: "#005D49" },
  "Curated pharmacology": { bg: "#FFF3E0", color: "#C24400" },
  "Curated guidelines": { bg: "#FFF3E0", color: "#C24400" },
  "Rule application": { bg: "#FCE7F3", color: "#9D174D" },
  "Composition + decision rules": { bg: "#E8EAF0", color: "#374151" },
  "LLM extraction": { bg: "#EFE7FF", color: "#5B21B6" },
  "KB + LLM criteria": { bg: "#E6F3F0", color: "#005D49" },
  "Trained model (XGBoost)": { bg: "#E6F0FF", color: "#1D4ED8" },
  "LLM reasoning (weighted)": { bg: "#EFE7FF", color: "#5B21B6" },
  "Coverage matrix": { bg: "#FFF3E0", color: "#C24400" },
  "LLM (compliant optimizer)": { bg: "#FCE7F3", color: "#9D174D" },
  "LLM answering": { bg: "#EFE7FF", color: "#5B21B6" },
  "LLM decision": { bg: "#E8EAF0", color: "#374151" },
};

const methodStyle = (m: string) =>
  METHOD_COLOR[m] ?? { bg: "#F5F5F5", color: "#374151" };

const statusStyle = (status: string) => {
  const s = (status ?? "UNVERIFIED").toUpperCase();
  if (s === "MET") return { bg: "#E6F3F0", color: "#005D49" };
  if (s === "AT_RISK") return { bg: "#FFE8E8", color: "#CC0300" };
  return { bg: "#F5F5F5", color: "#6B7280" };
};

const verdictStyle = (v?: string) => {
  const u = (v ?? "").toUpperCase();
  if (u.includes("AUTO")) return { bg: "#E6F3F0", color: "#005D49", label: "AUTO-FILE" };
  if (u.includes("BLOCK")) return { bg: "#FFE8E8", color: "#CC0300", label: "BLOCK" };
  return { bg: "#FFF3E0", color: "#C24400", label: "REVIEW" };
};

const pathStyle = (p?: string) => {
  const u = (p ?? "").toUpperCase();
  if (u === "HIGH_APPROVAL")
    return { bg: "#E6F3F0", color: "#005D49", label: "HIGH APPROVAL" };
  if (u === "LIKELY_DENIAL")
    return { bg: "#FFE8E8", color: "#CC0300", label: "LIKELY DENIAL" };
  return { bg: "#FFF3E0", color: "#C24400", label: "REQUIRES REVIEW" };
};

const predictionStyle = (p?: string) => {
  const u = (p ?? "").toUpperCase();
  if (u === "APPROVE") return { bg: "#E6F3F0", color: "#005D49", label: "APPROVE" };
  if (u === "DENY") return { bg: "#FFE8E8", color: "#CC0300", label: "DENY" };
  return { bg: "#FFF3E0", color: "#C24400", label: "PEND" };
};

const ScoreBar = ({ label, value }: { label: string; value?: number }) => {
  const v = Math.max(0, Math.min(100, Math.round(value ?? 0)));
  const color = v >= 67 ? "#005D49" : v >= 40 ? "#C24400" : "#CC0300";
  return (
    <div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-primaryGray-6">{label}</span>
        <span className="font-semibold text-primaryGray-1">{v}%</span>
      </div>
      <div
        className="mt-1 h-2 w-full overflow-hidden rounded-full"
        style={{ backgroundColor: "#E5E7EB" }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${v}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
};

const Chip = ({
  children,
  bg = "#F5F5F5",
  color = "#374151",
}: {
  children: React.ReactNode;
  bg?: string;
  color?: string;
}) => (
  <span
    className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
    style={{ backgroundColor: bg, color }}
  >
    {children}
  </span>
);

const SectionTitle = ({
  eyebrow,
  title,
  desc,
}: {
  eyebrow: string;
  title: string;
  desc?: string;
}) => (
  <div className="mb-4">
    <div className="text-[11px] font-bold uppercase tracking-wider text-primaryGray-6">
      {eyebrow}
    </div>
    <div className="text-lg font-semibold text-primaryGray-1">{title}</div>
    {desc && <div className="mt-0.5 text-small text-primaryGray-6">{desc}</div>}
  </div>
);

/* ── architecture map ───────────────────────────────────────────────────── */
const ArchLayer = ({
  label,
  items,
  accent,
}: {
  label: string;
  items: { title: string; sub?: string }[];
  accent: string;
}) => (
  <div className="relative">
    <div className="mb-2 flex items-center gap-2">
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: accent }}
      />
      <span className="text-[11px] font-bold uppercase tracking-wider text-primaryGray-6">
        {label}
      </span>
    </div>
    <div className="flex flex-wrap gap-2">
      {items.map((it, i) => (
        <div
          key={i}
          className="flex-1 rounded-lg border bg-white px-3 py-2"
          style={{ borderColor: accent + "55", minWidth: 140 }}
        >
          <div className="text-small font-semibold text-primaryGray-1">
            {it.title}
          </div>
          {it.sub && (
            <div className="mt-0.5 text-[11px] text-primaryGray-6">{it.sub}</div>
          )}
        </div>
      ))}
    </div>
  </div>
);

const Connector = () => (
  <div className="my-1.5 flex justify-center text-primaryGray-9">
    <svg width="16" height="18" viewBox="0 0 16 18" fill="none">
      <path
        d="M8 0v13M3 9l5 5 5-5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

const AgentStudio = () => {
  const [registry, setRegistry] = useState<AgentRegistry>(
    AGENT_REGISTRY_FALLBACK,
  );
  const [criteriaIndex, setCriteriaIndex] = useState<CriteriaIndexItem[]>([]);
  const [groundTruth, setGroundTruth] = useState<GroundTruthEval | null>(null);

  const [drug, setDrug] = useState(PRESETS[0].drug);
  const [payer, setPayer] = useState(PRESETS[0].payer);
  const [supportive, setSupportive] = useState(PRESETS[0].supportive);
  const [contradictory, setContradictory] = useState(PRESETS[0].contradictory);

  const [mode, setMode] = useState<"necessity" | "answer">("necessity");
  const [view, setView] = useState<"graph" | "list">("graph");
  const [engine, setEngine] = useState<"default" | "graph">("graph");
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [activeIdx, setActiveIdx] = useState(-1);
  const [packet, setPacket] = useState<AnswerPacket | null>(null);
  const [necessity, setNecessity] = useState<NecessityResult | null>(null);
  const [prediction, setPrediction] = useState<PredictResult | null>(null);
  const [gapLlm, setGapLlm] = useState<GapRecoveryResult | null>(null);
  const [gapLoading, setGapLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    getAgents().then(setRegistry);
    getCriteriaIndex().then(setCriteriaIndex);
    getGroundTruth().then(setGroundTruth);
  }, []);

  const answerSteps = useMemo(
    () => [...registry.agents].sort((a, b) => a.order - b.order),
    [registry],
  );
  const steps = mode === "necessity" ? NECESSITY_STAGES : answerSteps;

  // Prefer the standalone LLM gap-recovery (richer) over the instant
  // deterministic result embedded in the necessity run.
  const gapData = gapLlm ?? necessity?.gap_recovery ?? null;

  const drugOptions = useMemo(() => {
    const fromKb = criteriaIndex.map((c) => c.drug).filter(Boolean);
    return fromKb.length ? fromKb : FALLBACK_DRUGS;
  }, [criteriaIndex]);

  // KB-backed headline numbers
  const kbStats = useMemo(() => {
    if (!criteriaIndex.length)
      return { drugs: 0, criteria: 0, cases: 0, approval: null as number | null };
    const drugs = criteriaIndex.length;
    const criteria = criteriaIndex.reduce(
      (s, c) => s + (c.criteria_count || 0),
      0,
    );
    const cases = criteriaIndex.reduce((s, c) => s + (c.n_cases || 0), 0);
    const rates = criteriaIndex
      .map((c) => c.approval_rate)
      .filter((r): r is number => typeof r === "number");
    const approval = rates.length
      ? Math.round((rates.reduce((s, r) => s + r, 0) / rates.length) * 100) / 100
      : null;
    return { drugs, criteria, cases, approval };
  }, [criteriaIndex]);

  const applyPreset = (p: Preset) => {
    setDrug(p.drug);
    setPayer(p.payer);
    setSupportive(p.supportive);
    setContradictory(p.contradictory);
    setPhase("idle");
    setPacket(null);
    setNecessity(null);
    setPrediction(null);
    setGapLlm(null);
    setActiveIdx(-1);
  };

  const toLines = (t: string): string[] | undefined => {
    const lines = t
      .replace(/\.\s+/g, ".\n")
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
    return lines.length ? lines : undefined;
  };

  const runOrchestration = useCallback(async () => {
    if (!drug) return;
    setErr(null);
    setPacket(null);
    setNecessity(null);
    setPrediction(null);
    setGapLlm(null);
    setPhase("running");
    setActiveIdx(0);

    const sup = toLines(supportive);
    const con = toLines(contradictory);
    const caseObj: FilingQueueCase = {
      patient: "Studio case",
      dob: "",
      member_id: "",
      cmm_id: "studio",
      drug,
      medication: drug,
      medication_class: "Brand",
      payer_name: payer,
      total_questions: 10,
      answered_questions: 10,
      supportive_texts: sup,
      contradictory_texts: con,
    };

    // Necessity (v2) is an 8-stage chain (~40s); answer pipeline ~6s. Slow the
    // animation for necessity so stages light up across the actual runtime.
    const stepCount = steps.length || 7;
    const tick = mode === "necessity" ? 3800 : 650;
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      if (i >= stepCount - 1) {
        setActiveIdx(stepCount - 1);
        clearInterval(timer);
      } else {
        setActiveIdx(i);
      }
    }, tick);

    try {
      if (mode === "necessity") {
        const [pred, nec] = await Promise.all([
          predictCase(caseObj),
          runNecessity({
            drug,
            payer_name: payer,
            supportive_texts: sup ?? null,
            contradictory_texts: con ?? null,
            engine,
          }),
        ]);
        setPrediction(pred);
        setNecessity(nec);
        // Lazily upgrade the gap-recovery section to the full LLM strategist.
        // It runs alone (no pipeline contention), so it reliably returns the
        // rich, drug-specific analysis. The deterministic in-pipeline result
        // shows instantly; this overwrites it when ready.
        const matrix = nec.coverage?.coverage_matrix ?? [];
        if (matrix.some((m) => m.missing || !m.present)) {
          setGapLoading(true);
          fetchGapRecovery({
            drug,
            payer_name: payer,
            coverage_matrix: matrix,
          })
            .then((g) => {
              if (g?.gaps?.length) setGapLlm(g);
            })
            .catch(() => undefined)
            .finally(() => setGapLoading(false));
        }
      } else {
        const [pred, pkt] = await Promise.all([
          predictCase(caseObj),
          answerQuestionnaire(caseObj),
        ]);
        setPrediction(pred);
        setPacket(pkt);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Orchestration failed");
    } finally {
      clearInterval(timer);
      setActiveIdx(stepCount);
      setPhase("done");
    }
  }, [drug, payer, supportive, contradictory, steps.length, mode, engine]);

  const counts = useMemo(() => {
    const qs = packet?.questions ?? [];
    const met = qs.filter((q) => (q.status ?? "").toUpperCase() === "MET").length;
    const atRisk = qs.filter(
      (q) => (q.status ?? "").toUpperCase() === "AT_RISK",
    ).length;
    const unverified = qs.length - met - atRisk;
    return { total: qs.length, met, atRisk, unverified };
  }, [packet]);

  // live one-line output rendered under each agent during/after a run
  const agentOutput = (a: AgentMeta): string | null => {
    if (!packet) return null;
    switch (a.id) {
      case "criteria_retrieval":
        return packet.in_kb
          ? `${counts.total} criteria pulled from KB${
              prediction?.criteria_match?.approval_rate != null
                ? ` · base approval ${Math.round(
                    (prediction.criteria_match.approval_rate as number) * 100,
                  )}%`
                : ""
            }`
          : "Drug not in KB — generic checklist";
      case "evidence_matching":
        return `${counts.met} met · ${counts.atRisk} at-risk · ${counts.unverified} unverified · readiness ${Math.round(
          packet.readiness_pct ?? 0,
        )}%`;
      case "llm_reasoner":
        return packet.reasoning_mode === "llm"
          ? `Claude re-read by meaning${packet.summary ? ` — “${packet.summary.slice(0, 90)}${packet.summary.length > 90 ? "…" : ""}”` : ""}`
          : "No key configured — fell back to deterministic composer";
      case "mechanism":
        return packet.mechanism ? packet.mechanism.slice(0, 110) + "…" : null;
      case "guidelines":
        return (packet.guidelines ?? []).length
          ? `${packet.guidelines!.length} guideline(s): ${packet.guidelines![0].slice(0, 70)}…`
          : "No curated guideline on file";
      case "payer_strategy":
        return packet.payer_strategy?.matched_policy
          ? `Matched ${packet.payer_strategy.matched_policy} · ${(packet.payer_strategy.strategy ?? []).length} strategy step(s)`
          : "No payer policy matched";
      case "answer_composer":
        return `Verdict ${verdictStyle(packet.verdict).label} · ${packet.critical_unmet ?? 0} critical gap(s)`;
      default:
        return null;
    }
  };

  const v = verdictStyle(packet?.verdict);

  return (
    <div className="h-full overflow-y-auto bg-primaryGray-16 px-6 py-5">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold text-primaryGray-1">
            Agent Studio
          </h1>
          <Chip bg="#EFE7FF" color="#5B21B6">
            Denial Prevention Engine
          </Chip>
          <Chip
            bg={registry.llm_available ? "#E6F3F0" : "#F5F5F5"}
            color={registry.llm_available ? "#005D49" : "#6B7280"}
          >
            {registry.llm_available
              ? `LLM live · ${registry.llm_model}`
              : "LLM offline · deterministic"}
          </Chip>
        </div>
        <p className="mt-1 max-w-3xl text-small text-primaryGray-6">
          The reasoning layer that sits on top of the pharmacy worklist: it mines
          coverage criteria from history + FDA labels + payer policies, scores
          denial risk before filing, and runs a team of specialist agents to draft
          how to answer the PA questionnaire and why. Everything below is wired to
          the live engine — what you see is what runs.
        </p>

        {/* KB-backed headline metrics */}
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
          {[
            { k: kbStats.drugs || "—", l: "Drugs in KB" },
            { k: kbStats.criteria || "—", l: "Mined criteria" },
            {
              k: kbStats.cases ? kbStats.cases.toLocaleString() : "—",
              l: "Historical PAs",
            },
            { k: registry.count, l: "Agents in pipeline" },
            { k: "~0.83", l: "Model AUC (XGBoost)" },
          ].map((m, i) => (
            <div
              key={i}
              className="rounded-lg border border-primaryGray-14 bg-white px-4 py-3"
            >
              <div className="text-xl font-semibold text-primaryGray-1">
                {m.k}
              </div>
              <div className="text-[11px] text-primaryGray-6">{m.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* For judges: live endpoint validation console */}
      <EndpointConsole />

      {/* Closed-loop validation: AI vs. clinician-verified ground truth */}
      {groundTruth && (
        <div className="mb-5 rounded-xl border border-[#CDE7DF] bg-[#F3FAF7] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#005D49]">
                Closed loop · validated against clinician ground truth
              </div>
              <div className="mt-0.5 text-lg font-semibold text-primaryGray-1">
                {groundTruth.agreement_pct}% agreement with expert reviewers
              </div>
              <div className="mt-0.5 text-[12px] text-primaryGray-6">
                {groundTruth.n_criteria_graded?.toLocaleString()} coverage
                criteria human-graded across {groundTruth.n_orders} real PAs —
                every AI decision checked by a clinician, disagreements fed back
                as training signal.
              </div>
            </div>
            <span className="rounded-full bg-[#005D49] px-3 py-1 text-[11px] font-bold text-white">
              κ {groundTruth.cohens_kappa}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {[
              { k: `${groundTruth.agreement_pct}%`, l: "Agreement" },
              {
                k: groundTruth.precision != null ? groundTruth.precision.toFixed(3) : "—",
                l: "Precision",
              },
              {
                k: groundTruth.recall != null ? groundTruth.recall.toFixed(3) : "—",
                l: "Recall",
              },
              {
                k: groundTruth.f1 != null ? groundTruth.f1.toFixed(3) : "—",
                l: "F1",
              },
              {
                k: groundTruth.confusion_matrix
                  ? (
                      groundTruth.confusion_matrix.false_positive +
                      groundTruth.confusion_matrix.false_negative
                    ).toString()
                  : "—",
                l: "Disagreements",
              },
              {
                k: groundTruth.thumbs?.up?.toLocaleString() ?? "—",
                l: "Clinician 👍",
              },
              {
                k: groundTruth.thumbs?.down?.toString() ?? "—",
                l: "Clinician 👎",
              },
            ].map((m, i) => (
              <div
                key={i}
                className="rounded-lg border border-[#CDE7DF] bg-white px-3 py-2 text-center"
              >
                <div className="text-base font-semibold text-primaryGray-1">
                  {m.k}
                </div>
                <div className="text-[10px] text-primaryGray-6">{m.l}</div>
              </div>
            ))}
          </div>

          {(groundTruth.per_drug_agreement?.length ?? 0) > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {groundTruth.per_drug_agreement!.slice(0, 8).map((d) => (
                <span
                  key={d.drug}
                  className="rounded-full border border-[#CDE7DF] bg-white px-2.5 py-1 text-[11px] text-primaryGray-1"
                  title={`${d.criteria} criteria graded`}
                >
                  {d.drug.length > 22 ? d.drug.slice(0, 21) + "…" : d.drug}{" "}
                  <span className="font-semibold text-[#005D49]">
                    {d.agreement_pct}%
                  </span>
                </span>
              ))}
            </div>
          )}
          <div className="mt-3 text-[11px] italic text-primaryGray-6">
            Source: {groundTruth.source}. PHI-safe snapshot — decisions and
            counts only.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Architecture map */}
        <div className="rounded-xl border border-primaryGray-14 bg-white p-5 xl:col-span-1">
          <SectionTitle
            eyebrow="System"
            title="Architecture"
            desc="How a case flows from raw data to a filed PA."
          />
          <ArchLayer
            label="1 · Data sources"
            accent="#1D4ED8"
            items={[
              { title: "Historical PAs", sub: "win/loss patterns" },
              { title: "FDA labels", sub: "indications + MoA" },
              { title: "Payer policies", sub: "Cigna · Aetna · UHC" },
            ]}
          />
          <Connector />
          <ArchLayer
            label="2 · Knowledge & model"
            accent="#005D49"
            items={[
              { title: "Criteria KB", sub: "per-drug checklist" },
              { title: "XGBoost + TF-IDF", sub: "denial-risk model" },
            ]}
          />
          <Connector />
          <ArchLayer
            label="3 · Multi-agent orchestrator"
            accent="#5B21B6"
            items={[{ title: `${registry.count} specialist agents`, sub: "criteria → evidence → reasoning → answer" }]}
          />
          <Connector />
          <ArchLayer
            label="4 · Decisions"
            accent="#C24400"
            items={[
              { title: "Denial risk", sub: "AUTO-FILE / REVIEW / BLOCK" },
              { title: "Drafted answers", sub: "answer + why + citation" },
            ]}
          />
          <Connector />
          <ArchLayer
            label="5 · Pharmacy workflow"
            accent="#9D174D"
            items={[
              { title: "Worklist / Requests", sub: "risk-ranked queue" },
              { title: "Questionnaire", sub: "pre-drafted answers" },
              { title: "Send to Plan · SFTP", sub: "touchless filing" },
            ]}
          />
          <div className="mt-4 rounded-lg bg-primaryGray-16 px-3 py-2 text-[11px] leading-relaxed text-primaryGray-6">
            The engine never touches live PHI: it scores on precomputed,
            de-identified features and a baked-in Criteria KB, then hands the
            recommendation back to the filing UI.
          </div>
        </div>

        {/* Live orchestration runner */}
        <div className="rounded-xl border border-primaryGray-14 bg-white p-5 xl:col-span-2">
          <SectionTitle
            eyebrow="Try it"
            title="Live orchestration runner"
            desc="Pick a case, run the agents, and watch them reason end-to-end."
          />

          {/* pipeline toggle */}
          <div className="mb-3 inline-flex rounded-lg border border-primaryGray-14 bg-primaryGray-16 p-0.5">
            {[
              { id: "necessity" as const, label: "Medical Necessity (v2)" },
              { id: "answer" as const, label: "Questionnaire Answerer" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setMode(t.id);
                  setPhase("idle");
                  setActiveIdx(-1);
                  setPacket(null);
                  setNecessity(null);
                  setGapLlm(null);
                }}
                className={`rounded-md px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                  mode === t.id
                    ? "bg-white text-primaryGray-1 shadow-sm"
                    : "text-primaryGray-6"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <p className="mb-3 text-[12px] text-primaryGray-6">
            {mode === "necessity"
              ? "9-stage approval pipeline: DB1·DB2·DB3 → Deciding Factor → Coverage Validator → grey-area Re-Eval → Criteria Gap Recovery → Clinical Answering → Final Justification. ~40s with full LLM reasoning."
              : "The questionnaire answerer: criteria → evidence → reasoning → drafted answers. ~6s."}
          </p>

          {/* coverage-matcher engine toggle (necessity only) */}
          {mode === "necessity" && (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold text-primaryGray-6">
                Coverage matcher
              </span>
              <div className="inline-flex rounded-lg border border-primaryGray-14 bg-primaryGray-16 p-0.5">
                {[
                  { id: "graph" as const, label: "Knowledge Graph" },
                  { id: "default" as const, label: "Heuristic (overlap)" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setEngine(t.id);
                      setPhase("idle");
                      setActiveIdx(-1);
                      setNecessity(null);
                      setGapLlm(null);
                    }}
                    className={`rounded-md px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                      engine === t.id
                        ? "bg-white text-primaryGray-1 shadow-sm"
                        : "text-primaryGray-6"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-primaryGray-6">
                {engine === "graph"
                  ? "PMG-compatible graph: semantic + negation/exclusion-aware match (+0.05 AUC vs overlap)."
                  : "Content-word overlap heuristic (legacy baseline)."}
              </span>
            </div>
          )}

          {/* presets */}
          <div className="mb-3 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => applyPreset(p)}
                className="rounded-full border border-primaryGray-14 bg-white px-3 py-1 text-[11px] font-semibold text-primaryGray-1 transition-colors hover:bg-primaryGray-16"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* inputs */}
          <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="block">
              <span className="text-[11px] font-semibold text-primaryGray-6">
                Drug
              </span>
              <select
                value={drug}
                onChange={(e) => setDrug(e.target.value)}
                className="mt-1 w-full rounded-md border border-primaryGray-14 bg-white px-3 py-2 text-small text-primaryGray-1"
              >
                {drugOptions.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-[11px] font-semibold text-primaryGray-6">
                Payer
              </span>
              <select
                value={payer}
                onChange={(e) => setPayer(e.target.value)}
                className="mt-1 w-full rounded-md border border-primaryGray-14 bg-white px-3 py-2 text-small text-primaryGray-1"
              >
                {PAYERS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="block">
              <span className="text-[11px] font-semibold text-primaryGray-6">
                Supportive chart evidence
              </span>
              <textarea
                value={supportive}
                onChange={(e) => setSupportive(e.target.value)}
                rows={4}
                className="mt-1 w-full resize-none rounded-md border border-primaryGray-14 bg-white px-3 py-2 text-small text-primaryGray-1"
                placeholder="One finding per line…"
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-semibold text-primaryGray-6">
                Contradictory / missing evidence
              </span>
              <textarea
                value={contradictory}
                onChange={(e) => setContradictory(e.target.value)}
                rows={4}
                className="mt-1 w-full resize-none rounded-md border border-primaryGray-14 bg-white px-3 py-2 text-small text-primaryGray-1"
                placeholder="Optional…"
              />
            </label>
          </div>

          <div className="mb-4 flex items-center gap-3">
            <button
              onClick={runOrchestration}
              disabled={phase === "running"}
              className="rounded-md bg-primaryGray-1 px-5 py-2.5 text-small font-semibold text-white shadow-sm transition-opacity disabled:opacity-50"
            >
              {phase === "running" ? "Running agents…" : "Run orchestration"}
            </button>
            {phase === "done" && prediction && (
              <div className="flex flex-wrap items-center gap-2 text-small">
                <span className="text-primaryGray-6">Denial risk</span>
                <span
                  className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                  style={statusStyle(
                    (prediction.denial_risk ?? 0) >= 60
                      ? "AT_RISK"
                      : (prediction.denial_risk ?? 0) >= 30
                        ? "REVIEW"
                        : "MET",
                  )}
                >
                  {Math.round(prediction.denial_risk ?? 0)}%
                </span>
                {mode === "answer" && (
                  <span
                    className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                    style={{ backgroundColor: v.bg, color: v.color }}
                  >
                    {v.label}
                  </span>
                )}
                {mode === "necessity" && necessity && (
                  <>
                    <span
                      className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                      style={pathStyle(necessity.recommended_path)}
                    >
                      {pathStyle(necessity.recommended_path).label}
                    </span>
                    <span
                      className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                      style={predictionStyle(necessity.final_prediction)}
                    >
                      {predictionStyle(necessity.final_prediction).label}
                    </span>
                    {necessity.coverage_engine && (
                      <span
                        className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                        style={
                          necessity.coverage_engine === "graph_kb"
                            ? { backgroundColor: "#E6F0FF", color: "#1D4ED8" }
                            : { backgroundColor: "#F1F1F1", color: "#666" }
                        }
                      >
                        {necessity.coverage_engine === "graph_kb"
                          ? "Graph KB match"
                          : "Heuristic match"}
                      </span>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {err && (
            <div className="mb-3 rounded-md border border-[#FFB3B0] bg-[#FFE8E8] px-3 py-2 text-small text-[#CC0300]">
              {err}
            </div>
          )}

          {/* view toggle: interconnection diagram vs. step list */}
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primaryGray-6">
              {view === "graph" ? "Orchestration graph" : "Pipeline trace"}
            </span>
            <div className="inline-flex rounded-lg border border-primaryGray-14 bg-primaryGray-16 p-0.5">
              {[
                { id: "graph" as const, label: "Flow graph" },
                { id: "list" as const, label: "Step list" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setView(t.id)}
                  className={`rounded-md px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                    view === t.id
                      ? "bg-white text-primaryGray-1 shadow-sm"
                      : "text-primaryGray-6"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* interconnection diagram */}
          {view === "graph" && (
            <div className="rounded-lg border border-primaryGray-14 bg-white p-3">
              <AgentFlowGraph
                mode={mode}
                steps={steps}
                activeIdx={activeIdx}
                phase={phase}
                llmAvailable={registry.llm_available}
                methodStyle={methodStyle}
              />
            </div>
          )}

          {/* pipeline trace */}
          {view === "list" && (
          <div className="space-y-2">
            {steps.map((a, idx) => {
              const m = methodStyle(a.method);
              const isActive = phase === "running" && idx === activeIdx;
              const isDone =
                phase === "done" ||
                (phase === "running" && idx < activeIdx);
              const dim =
                a.optional && !registry.llm_available
                  ? "opacity-50"
                  : phase === "idle"
                    ? ""
                    : isActive || isDone
                      ? ""
                      : "opacity-60";
              const out = agentOutput(a);
              return (
                <div
                  key={a.id}
                  className={`rounded-lg border bg-white px-4 py-3 transition-all ${dim}`}
                  style={{
                    borderColor: isActive ? m.color : "#E5E7EB",
                    boxShadow: isActive ? `0 0 0 2px ${m.color}33` : "none",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                      style={{ backgroundColor: m.bg, color: m.color }}
                    >
                      {isDone ? "✓" : a.order}
                    </span>
                    <span className="text-small font-semibold text-primaryGray-1">
                      {a.name}
                    </span>
                    <Chip bg={m.bg} color={m.color}>
                      {a.method}
                    </Chip>
                    {a.optional && (
                      <Chip bg="#F5F5F5" color="#6B7280">
                        optional
                      </Chip>
                    )}
                    {isActive && (
                      <span className="ml-auto flex items-center gap-1 text-[11px] text-primaryGray-6">
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-primaryGray-14 border-t-primaryGray-1" />
                        reasoning…
                      </span>
                    )}
                  </div>
                  <div className="mt-1 pl-9 text-[12px] leading-relaxed text-primaryGray-6">
                    {a.reasoning}
                  </div>
                  {out && isDone && (
                    <div
                      className="mt-2 ml-9 rounded-md px-3 py-2 text-[12px] leading-relaxed"
                      style={{ backgroundColor: m.bg + "66", color: "#1F2937" }}
                    >
                      <span className="font-semibold">Output · </span>
                      {out}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          )}

          {/* Medical Necessity (v2) result */}
          {phase === "done" && mode === "necessity" && necessity && (
            <div className="mt-5">
              <SectionTitle eyebrow="Result" title="Medical necessity decision" />

              {/* scorecard */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-primaryGray-14 bg-white p-4 md:col-span-2">
                  <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-primaryGray-6">
                    Weighted sub-scores
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <ScoreBar
                      label="Clinical match · 40%"
                      value={necessity.scores?.clinical_match_score}
                    />
                    <ScoreBar
                      label="Criteria coverage · 30%"
                      value={necessity.scores?.criteria_coverage_score}
                    />
                    <ScoreBar
                      label="Historical (model) · 20%"
                      value={necessity.scores?.historical_match_score}
                    />
                    <ScoreBar
                      label="Documentation · 10%"
                      value={necessity.scores?.documentation_score}
                    />
                  </div>
                  {necessity.db3?.model && (
                    <div className="mt-3 text-[11px] text-primaryGray-6">
                      Historical backbone: {necessity.db3.model}
                      {necessity.db3.model_auc
                        ? ` · AUC ${necessity.db3.model_auc}`
                        : ""}
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-center rounded-lg border border-primaryGray-14 bg-white p-4 text-center">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-primaryGray-6">
                    Approval probability
                  </div>
                  <div className="text-4xl font-semibold text-primaryGray-1">
                    {Math.round(
                      necessity.scores?.overall_approval_probability ?? 0,
                    )}
                    %
                  </div>
                  <div className="mt-1 text-[11px] text-primaryGray-6">
                    Confidence{" "}
                    {Math.round(necessity.scores?.confidence_score ?? 0)}%
                  </div>
                  <div className="mt-2 flex justify-center gap-2">
                    <span
                      className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                      style={pathStyle(necessity.recommended_path)}
                    >
                      {pathStyle(necessity.recommended_path).label}
                    </span>
                    <span
                      className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                      style={predictionStyle(necessity.final_prediction)}
                    >
                      {predictionStyle(necessity.final_prediction).label}
                    </span>
                  </div>
                </div>
              </div>

              {/* final justification */}
              {necessity.final?.clinical_justification && (
                <div className="mt-4 rounded-lg border border-[#D8C8FF] bg-[#F8F4FF] px-4 py-3 text-small leading-relaxed text-[#3A1F73]">
                  {necessity.final.clinical_justification}
                </div>
              )}

              {/* coverage matrix */}
              {(necessity.coverage?.coverage_matrix?.length ?? 0) > 0 && (
                <div className="mt-4">
                  <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-primaryGray-6">
                    Evidence coverage matrix
                  </div>
                  <div className="overflow-hidden rounded-lg border border-primaryGray-14">
                    {necessity.coverage!.coverage_matrix!.slice(0, 12).map((c, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 border-b border-primaryGray-14 bg-white px-3 py-2 last:border-b-0"
                      >
                        <span
                          className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                          style={{
                            backgroundColor: c.present ? "#005D49" : "#CC0300",
                          }}
                        >
                          {c.present ? "✓" : "×"}
                        </span>
                        <div className="flex-1">
                          <div className="text-[12px] text-primaryGray-1">
                            {c.requirement}
                            {c.critical && (
                              <span className="ml-2 text-[10px] font-bold uppercase text-[#CC0300]">
                                critical
                              </span>
                            )}
                          </div>
                          {c.supporting_document && (
                            <div className="text-[11px] italic text-primaryGray-6">
                              “{c.supporting_document}”
                            </div>
                          )}
                        </div>
                        <span className="shrink-0 text-[11px] text-primaryGray-6">
                          {Math.round(c.confidence ?? 0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* grey-area re-eval */}
              {necessity.approval_friendly_reeval?.enhanced_justification && (
                <div className="mt-4 rounded-lg border border-[#FBCFE8] bg-[#FDF2F8] px-4 py-3">
                  <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-[#9D174D]">
                    Approval-friendly re-evaluation (compliant)
                  </div>
                  <div className="text-small leading-relaxed text-primaryGray-1">
                    {necessity.approval_friendly_reeval.enhanced_justification}
                  </div>
                </div>
              )}

              {/* Criteria Gap Recovery Framework */}
              {(gapData?.gaps?.length ?? 0) > 0 && (
                <div className="mt-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#9D174D]">
                      Criteria gap recovery
                    </span>
                    <Chip bg="#FCE7F3" color="#9D174D">
                      {gapData!.gaps!.length} unmet criteria · recovery pathways
                    </Chip>
                    {gapData?._mode && (
                      <Chip
                        bg={gapData._mode === "llm" ? "#EFE7FF" : "#F1F1F1"}
                        color={gapData._mode === "llm" ? "#5B21B6" : "#666"}
                      >
                        {gapData._mode === "llm" ? "LLM strategist" : "KB strategist"}
                      </Chip>
                    )}
                    {gapLoading && (
                      <span className="text-[11px] italic text-primaryGray-6">
                        upgrading to LLM strategist…
                      </span>
                    )}
                  </div>
                  <p className="mb-2 text-[12px] text-primaryGray-6">
                    For every criterion the chart doesn&apos;t yet satisfy: how to
                    still win approval — alternative pathways, bypass arguments, and
                    the strongest appeal.
                  </p>
                  <div className="space-y-3">
                    {gapData!.gaps!.map((g, i) => {
                      const imp = (g.importance ?? "").toLowerCase();
                      const impColor = imp.includes("critical")
                        ? { bg: "#FFE8E8", color: "#CC0300" }
                        : imp.includes("major")
                          ? { bg: "#FFF3E0", color: "#C24400" }
                          : { bg: "#F5F5F5", color: "#6B7280" };
                      const byp = (g.bypass_possible ?? "").toLowerCase();
                      const bypColor =
                        byp === "yes"
                          ? { bg: "#E6F3F0", color: "#005D49" }
                          : byp === "no"
                            ? { bg: "#FFE8E8", color: "#CC0300" }
                            : { bg: "#FFF3E0", color: "#C24400" };
                      const appeal = (g.appeal_strength ?? "").toLowerCase();
                      const appealColor = appeal.includes("strong")
                        ? { bg: "#E6F3F0", color: "#005D49" }
                        : appeal.includes("weak")
                          ? { bg: "#FFE8E8", color: "#CC0300" }
                          : { bg: "#FFF3E0", color: "#C24400" };
                      const List = ({
                        title,
                        items,
                        color,
                      }: {
                        title: string;
                        items?: string[];
                        color: string;
                      }) =>
                        (items?.length ?? 0) > 0 ? (
                          <div className="mt-2">
                            <div
                              className="text-[10px] font-bold uppercase tracking-wider"
                              style={{ color }}
                            >
                              {title}
                            </div>
                            <ul className="mt-0.5 list-disc space-y-0.5 pl-4 text-[12px] text-primaryGray-1">
                              {items!.map((it, j) => (
                                <li key={j}>{it}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null;
                      return (
                        <div
                          key={i}
                          className="rounded-lg border border-[#FBCFE8] bg-white p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="text-small font-semibold text-primaryGray-1">
                              {g.criterion}
                            </div>
                          </div>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {g.importance && (
                              <Chip bg={impColor.bg} color={impColor.color}>
                                {g.importance}
                              </Chip>
                            )}
                            {g.criterion_type && (
                              <Chip bg="#E8EAF0" color="#374151">
                                {g.criterion_type}
                              </Chip>
                            )}
                            {g.bypass_possible && (
                              <Chip bg={bypColor.bg} color={bypColor.color}>
                                Bypass: {g.bypass_possible}
                              </Chip>
                            )}
                            {g.appeal_strength && (
                              <Chip bg={appealColor.bg} color={appealColor.color}>
                                Appeal: {g.appeal_strength}
                              </Chip>
                            )}
                          </div>
                          {g.reviewer_intent && (
                            <div className="mt-2 text-[12px] italic leading-relaxed text-primaryGray-6">
                              Reviewer intent: {g.reviewer_intent}
                            </div>
                          )}
                          <div className="grid grid-cols-1 gap-x-6 md:grid-cols-2">
                            <div>
                              <List
                                title="Alternative pathways"
                                items={g.alternative_pathways}
                                color="#9D174D"
                              />
                              <List
                                title="Medical-necessity arguments"
                                items={g.medical_necessity_arguments}
                                color="#1D4ED8"
                              />
                              <List
                                title="Alternative clinical evidence"
                                items={g.alternative_clinical_evidence}
                                color="#005D49"
                              />
                            </div>
                            <div>
                              <List
                                title="Contraindication-based bypass"
                                items={g.contraindication_based_bypass}
                                color="#C24400"
                              />
                              <List
                                title="Safety-based bypass"
                                items={g.safety_based_bypass}
                                color="#C24400"
                              />
                              <List
                                title="Appeal arguments"
                                items={g.appeal_arguments}
                                color="#5B21B6"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* risks + next steps */}
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                {(necessity.final?.key_risks?.length ?? 0) > 0 && (
                  <div className="rounded-lg border border-primaryGray-14 bg-white p-4">
                    <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-primaryGray-6">
                      Key risks
                    </div>
                    <ul className="list-disc space-y-1 pl-4 text-[12px] text-primaryGray-1">
                      {necessity.final!.key_risks!.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {(necessity.final?.recommended_next_steps?.length ?? 0) > 0 && (
                  <div className="rounded-lg border border-primaryGray-14 bg-white p-4">
                    <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-primaryGray-6">
                      Recommended next steps
                    </div>
                    <ul className="list-disc space-y-1 pl-4 text-[12px] text-primaryGray-1">
                      {necessity.final!.recommended_next_steps!.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* clinical answers */}
              {(necessity.clinical_answers?.answers?.length ?? 0) > 0 && (
                <div className="mt-4">
                  <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-primaryGray-6">
                    Drafted questionnaire answers (pharmacy benefit)
                  </div>
                  <div className="space-y-2">
                    {necessity.clinical_answers!.answers!.slice(0, 12).map((q, i) => {
                      const st = statusStyle(q.status ?? "UNVERIFIED");
                      return (
                        <div
                          key={i}
                          className="rounded-lg border border-primaryGray-14 bg-white px-4 py-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="text-small font-medium text-primaryGray-1">
                              {q.question}
                            </div>
                            <span
                              className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                              style={{ backgroundColor: st.bg, color: st.color }}
                            >
                              {(q.status ?? "UNVERIFIED").replace("_", " ")}
                            </span>
                          </div>
                          {q.recommended_answer && (
                            <div className="mt-1.5 text-small text-primaryGray-1">
                              <span className="font-semibold">Answer: </span>
                              {q.recommended_answer}
                            </div>
                          )}
                          {q.justification && (
                            <div className="mt-1 text-small leading-relaxed text-primaryGray-6">
                              {q.justification}
                            </div>
                          )}
                          {q.citation && (
                            <div className="mt-1 text-[12px] italic text-primaryGray-6">
                              “{q.citation}”
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* drafted answers */}
          {phase === "done" && mode === "answer" && (packet?.questions?.length ?? 0) > 0 && (
            <div className="mt-5">
              <SectionTitle
                eyebrow="Result"
                title="Drafted questionnaire answers"
              />
              <div className="space-y-2">
                {packet!.questions!.map((q, i) => {
                  const st = statusStyle(q.status ?? "UNVERIFIED");
                  return (
                    <div
                      key={i}
                      className="rounded-lg border border-primaryGray-14 bg-white px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-small font-medium text-primaryGray-1">
                          {q.question}
                          {q.critical && (
                            <span className="ml-2 text-[10px] font-bold uppercase text-[#CC0300]">
                              critical
                            </span>
                          )}
                        </div>
                        <span
                          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                          style={{ backgroundColor: st.bg, color: st.color }}
                        >
                          {(q.status ?? "UNVERIFIED").replace("_", " ")}
                        </span>
                      </div>
                      {q.recommended_answer && (
                        <div className="mt-1.5 text-small text-primaryGray-1">
                          <span className="font-semibold">Answer: </span>
                          {q.recommended_answer}
                        </div>
                      )}
                      {q.justification && (
                        <div className="mt-1 text-small leading-relaxed text-primaryGray-6">
                          {q.justification}
                        </div>
                      )}
                      {q.evidence && (
                        <div className="mt-1 text-[12px] italic text-primaryGray-6">
                          “{q.evidence}”
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Agent roster */}
      <div className="mt-5 rounded-xl border border-primaryGray-14 bg-white p-5">
        <SectionTitle
          eyebrow="Pipeline"
          title={mode === "necessity" ? "The medical-necessity agents" : "The agent team"}
          desc={
            mode === "necessity"
              ? "Each stage has one job. Order reflects the live pipeline in necessity_engine.py."
              : "Each specialist has one job. Order reflects the live orchestration in agents.py."
          }
        />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {steps.map((a) => {
            const m = methodStyle(a.method);
            return (
              <div
                key={a.id}
                className="flex flex-col rounded-lg border border-primaryGray-14 bg-white p-4"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold"
                    style={{ backgroundColor: m.bg, color: m.color }}
                  >
                    {a.order}
                  </span>
                  <span className="text-small font-semibold text-primaryGray-1">
                    {a.name}
                  </span>
                  {a.optional && (
                    <Chip bg="#F5F5F5" color="#6B7280">
                      optional
                    </Chip>
                  )}
                </div>
                <Chip bg={m.bg} color={m.color}>
                  {a.method}
                </Chip>
                <div className="mt-2 text-[12px] leading-relaxed text-primaryGray-6">
                  {a.reasoning}
                </div>
                <div className="mt-3 border-t border-primaryGray-14 pt-2 text-[11px] text-primaryGray-6">
                  <div>
                    <span className="font-semibold text-primaryGray-1">In:</span>{" "}
                    {a.inputs.join(", ")}
                  </div>
                  <div className="mt-0.5">
                    <span className="font-semibold text-primaryGray-1">
                      Out:
                    </span>{" "}
                    {a.outputs.join(", ")}
                  </div>
                  <div className="mt-0.5">
                    <span className="font-semibold text-primaryGray-1">
                      Tech:
                    </span>{" "}
                    {a.tech}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 rounded-lg bg-primaryGray-16 px-3 py-2 text-[11px] leading-relaxed text-primaryGray-6">
          Roadmap: this roster is served from <code>/api/agents</code> so the
          pipeline becomes configurable — toggle the LLM reasoner, reorder steps,
          or swap a payer-strategy source — without shipping new UI.
        </div>
      </div>
    </div>
  );
};

export default AgentStudio;
