// Client for the RISA Denial Prevention Engine (separate FastAPI service).
// This is the "predict denials before filing" brain layered on top of the
// pharmacy dashboard. It runs against precomputed de-identified data + a
// trained XGBoost model, so the dashboard never sends live PHI to it.

const ENGINE_API =
  process.env.REACT_APP_ENGINE_API ||
  "https://risa-denial-api-scnxtg3pqa-uc.a.run.app";

export type EngineDecision = "AUTO_SUBMIT" | "REVIEW" | "BLOCK";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface FilingQueueCase {
  patient: string;
  dob: string;
  member_id: string;
  cmm_id: string;
  drug: string;
  medication: string;
  medication_class: string;
  payer_name: string;
  total_questions: number;
  answered_questions: number;
  supportive_texts?: string[];
  contradictory_texts?: string[];
  // Present on the curated filing_queue: the expected/known result for this
  // previously-filed case, used to validate the simulated decision.
  expected_decision?: EngineDecision | string;
  expected_risk?: number;
}

export interface CriteriaMatchItem {
  statement: string;
  critical?: boolean;
  source?: string;
  status?: "MET" | "AT_RISK" | "UNVERIFIED" | string;
  evidence?: string;
}

export interface CriteriaMatch {
  drug?: string;
  // Newer engine shape: counts + a `criteria` list.
  criteria?: CriteriaMatchItem[];
  met?: number;
  at_risk?: number;
  unverified?: number;
  readiness_pct?: number;
  critical_unmet?: number;
  fda_indication?: string;
  matched?: number;
  total?: number;
  approval_rate?: number;
  coverage?: number;
}

export interface PredictResult {
  case_id: string;
  drug?: string;
  payer_name: string;
  medication_class: string;
  denial_risk: number;
  risk_level: RiskLevel;
  decision?: EngineDecision;
  confidence?: number;
  decision_reason?: string;
  recommendations: string[];
  risk_factors: { factor: string; impact?: string | number }[];
  criteria_match?: CriteriaMatch | null;
  model?: string;
  model_auc?: number;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${ENGINE_API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Engine ${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}

export async function getFilingQueue(): Promise<FilingQueueCase[]> {
  const res = await fetch(`${ENGINE_API}/api/filing-queue`);
  if (!res.ok) throw new Error(`Engine filing-queue -> ${res.status}`);
  return res.json();
}

// ── Case QA Review: previously-completed PAs (real Q/A + actual answer + outcome) ──
export interface CompletedCaseQuestion {
  question: string;
  question_name?: string | null;
  options?: string[];
  actual_answer?: string | null;
  type?: string | null;
}

export interface CompletedCase {
  case_id: string;
  drug: string;
  medication_class: string;
  payer_name: string;
  actual_outcome: string; // "Approved" | "Denied"
  total_questions: number;
  answered_questions: number;
  supportive_texts: string[];
  contradictory_texts: string[];
  questions: CompletedCaseQuestion[];
}

export async function getCompletedCases(limit = 50): Promise<CompletedCase[]> {
  // The case dataset is static, so prefer the copy bundled with the app — it
  // works with no backend at all. Fall back to the live engine endpoint.
  try {
    const local = await fetch(`${process.env.PUBLIC_URL || ""}/completed_cases.json`);
    if (local.ok) {
      const all = (await local.json()) as CompletedCase[];
      if (Array.isArray(all) && all.length) return all.slice(0, Math.max(1, limit));
    }
  } catch {
    /* fall through to the API */
  }
  const res = await fetch(`${ENGINE_API}/api/completed-cases?limit=${limit}`);
  if (!res.ok) throw new Error(`Engine completed-cases -> ${res.status}`);
  return res.json();
}

export interface AnswerReviewAnswer {
  question: string;
  actual_answer?: string | null;
  bot_answer?: string | null;
  status?: string | null;
  justification?: string | null;
  citation?: string | null;
  agree: boolean | null;
}

export interface AnswerReviewResult {
  drug?: string;
  payer?: string;
  reasoning_mode?: string;
  recommended_path?: string;
  approval_probability?: number;
  necessity_predicts?: string;
  final_prediction?: string;
  final_confidence?: number;
  scores?: Record<string, number | null>;
  reasoning?: string | null;
  key_supporting_factors?: string[];
  key_risks?: string[];
  answers: AnswerReviewAnswer[];
  n_questions: number;
  n_comparable: number;
  n_agree: number;
  agreement_pct: number | null;
  actual_outcome?: string | null;
  necessity_correct?: boolean | null;
  xgb_after?: {
    denial_risk: number;
    risk_level: string;
    decision?: string | null;
    predicts?: string;
    n_resolved?: number;
    n_open_gaps?: number;
  } | null;
  xgb_delta?: number | null;
  xgb?: {
    denial_risk: number;
    risk_level: string;
    decision?: string;
    predicts: string;
    model?: string;
    model_auc?: number;
  } | null;
  xgb_correct?: boolean | null;
}

export async function reviewCaseAnswers(c: CompletedCase): Promise<AnswerReviewResult> {
  return postJson<AnswerReviewResult>("/api/answer-review", {
    drug: c.drug,
    payer_name: c.payer_name,
    medication_class: c.medication_class,
    supportive_texts: c.supportive_texts,
    contradictory_texts: c.contradictory_texts,
    questions: c.questions.map((q) => ({
      question: q.question,
      actual_answer: q.actual_answer,
      options: q.options,
    })),
    actual_outcome: c.actual_outcome,
    total_questions: c.total_questions,
    answered_questions: c.answered_questions,
  });
}

// A real, previously-filed PA case whose ACTUAL payer outcome is known. Used to
// validate the engine: run the bot, then compare its prediction to `actual_outcome`.
export interface ShowcaseCase {
  case_id: string;
  drug: string;
  medication_class: string;
  payer_name: string;
  total_questions: number;
  answered_questions: number;
  supportive_texts?: string[];
  contradictory_texts?: string[];
  actual_outcome: "Approved" | "Denied" | string; // ground truth (what the payer decided)
  predicted_risk: number; // bot denial risk %
  predicted_level?: RiskLevel | string;
  predicted_decision?: EngineDecision | string;
  predicted_label: "Approved" | "Denied" | string; // bot's predicted outcome
  correct: boolean; // did the bot's label match the actual outcome?
}

export async function getShowcase(): Promise<ShowcaseCase[]> {
  const res = await fetch(`${ENGINE_API}/api/showcase`);
  if (!res.ok) throw new Error(`Engine showcase -> ${res.status}`);
  return res.json();
}

// Adapt a showcase case to the FilingQueueCase shape the predict/answer
// endpoints expect (so we can run the bot live on a known-outcome case).
export function showcaseToFilingCase(s: ShowcaseCase): FilingQueueCase {
  return {
    patient: "Filed case",
    dob: "",
    member_id: "",
    cmm_id: s.case_id,
    drug: s.drug,
    medication: s.drug,
    medication_class: s.medication_class || "Brand",
    payer_name: s.payer_name,
    total_questions: s.total_questions,
    answered_questions: s.answered_questions,
    supportive_texts: s.supportive_texts,
    contradictory_texts: s.contradictory_texts,
  };
}

export interface AgentQuestion {
  question: string;
  source?: string;
  critical?: boolean;
  status?: "MET" | "AT_RISK" | "UNVERIFIED" | string;
  recommended_answer?: string;
  justification?: string | null;
  payer_strategy?: string | null;
  evidence?: string | null;
}

export interface AgentTraceItem {
  agent: string;
  role: string;
}

export interface AnswerPacket {
  drug?: string;
  payer?: string;
  in_kb?: boolean;
  reasoning_mode?: "llm" | "deterministic" | string;
  summary?: string | null;
  mechanism?: string;
  guidelines?: string[];
  payer_strategy?: {
    payer?: string;
    matched_policy?: string | null;
    source_url?: string | null;
    strategy?: string[];
  };
  verdict?: string;
  readiness_pct?: number;
  critical_unmet?: number;
  questions?: AgentQuestion[];
  agents?: AgentTraceItem[];
}

export async function answerQuestionnaire(c: FilingQueueCase): Promise<AnswerPacket> {
  return postJson<AnswerPacket>("/api/answer", {
    drug: c.drug,
    payer_name: c.payer_name,
    supportive_texts: c.supportive_texts ?? null,
    contradictory_texts: c.contradictory_texts ?? null,
  });
}

/* ── Agent registry (Agent Studio) ──────────────────────────────────────── */
export interface AgentMeta {
  id: string;
  name: string;
  role: string;
  order: number;
  method: string;
  tech: string;
  inputs: string[];
  outputs: string[];
  optional: boolean;
  reasoning: string;
}

export interface AgentRegistry {
  pipeline: string;
  llm_available: boolean;
  llm_model: string;
  count: number;
  agents: AgentMeta[];
}

// Mirrors the backend AGENT_REGISTRY (agents.py). Used as a resilient fallback
// so the Agent Studio renders even if the engine hasn't shipped /api/agents yet.
export const AGENT_REGISTRY_FALLBACK: AgentRegistry = {
  pipeline: "answer_questionnaire",
  llm_available: true,
  llm_model: "claude-haiku-4-5-20251001",
  count: 7,
  agents: [
    {
      id: "criteria_retrieval",
      name: "Criteria Retrieval",
      role: "Pulls the FDA + payer criteria that this PA must satisfy.",
      order: 1,
      method: "Knowledge Base lookup",
      tech: "Criteria KB (mined history + FDA + payer policies)",
      inputs: ["drug"],
      outputs: ["criteria checklist", "payer_policies", "approval_rate"],
      optional: false,
      reasoning:
        "Normalizes the drug name and pulls the full criteria checklist this PA must satisfy — every criterion tagged by source (FDA label, historical win/loss pattern, or payer medical policy) and whether it is critical.",
    },
    {
      id: "evidence_matching",
      name: "Evidence Matching",
      role: "Maps the patient's chart evidence to each criterion (met / missing / contradicted).",
      order: 2,
      method: "Heuristic NLP (content-word overlap)",
      tech: "Transparent keyword matcher (no black box)",
      inputs: ["criteria checklist", "supportive evidence", "contradictory evidence"],
      outputs: ["per-criterion status: MET / AT_RISK / UNVERIFIED", "readiness %"],
      optional: false,
      reasoning:
        "Lines the patient's chart evidence up against each criterion using shared content words. Contradiction beats support; silence is UNVERIFIED. Fully explainable — every status shows the evidence line that drove it.",
    },
    {
      id: "llm_reasoner",
      name: "LLM Clinical Reasoner",
      role: "Reads the chart against each criterion by meaning and drafts cited answers.",
      order: 3,
      method: "LLM semantic reasoning",
      tech: "Anthropic Claude (claude-haiku-4-5-20251001)",
      inputs: ["criteria", "mechanism", "guidelines", "payer policy", "chart evidence"],
      outputs: ["semantic status per criterion", "drafted answer", "citation", "reviewer summary"],
      optional: true,
      reasoning:
        "When an API key is configured, re-reads the chart against each criterion by meaning (not keywords), drafts the recommended answer with a citation, and writes a reviewer summary — grounded in the KB context so it cites our sources. Degrades gracefully to the deterministic composer if unavailable.",
    },
    {
      id: "mechanism",
      name: "Mechanism Justification",
      role: "Explains why the drug is pharmacologically appropriate for the indication.",
      order: 4,
      method: "Curated pharmacology",
      tech: "FDA label–sourced mechanism of action",
      inputs: ["drug"],
      outputs: ["mechanism-of-action justification"],
      optional: false,
      reasoning:
        "Supplies the mechanism-of-action rationale that explains why the drug is pharmacologically appropriate for the requested indication.",
    },
    {
      id: "guidelines",
      name: "Clinical Guidelines",
      role: "Cites the clinical guidelines that support medical necessity.",
      order: 5,
      method: "Curated guidelines",
      tech: "KDIGO / NCCN / ADA / ACC-AHA / AACE-TOS …",
      inputs: ["drug"],
      outputs: ["supporting clinical guidelines"],
      optional: false,
      reasoning:
        "Cites the governing clinical guidelines that back medical necessity for the indication, strengthening the justification beyond the payer's own rules.",
    },
    {
      id: "payer_strategy",
      name: "Payer Strategy",
      role: "Applies the specific payer's coverage rules and the winning filing strategy.",
      order: 6,
      method: "Rule application",
      tech: "Payer medical-policy KB (Cigna / Aetna / UHC …)",
      inputs: ["payer_policies", "payer name"],
      outputs: ["matched policy", "step-therapy / exception strategy", "covered-indication framing"],
      optional: false,
      reasoning:
        "Matches the case's payer to its specific medical policy and produces the winning filing strategy: satisfy prerequisites (or file a step-therapy exception), frame under a covered indication, and avoid non-covered language.",
    },
    {
      id: "answer_composer",
      name: "Answer Composer",
      role: "Drafts the recommended answer for each questionnaire item and the overall verdict.",
      order: 7,
      method: "Composition + decision rules",
      tech: "Readiness + critical-gap thresholds",
      inputs: ["matched criteria", "mechanism", "guidelines", "payer strategy"],
      outputs: ["per-question recommended answer", "overall verdict: AUTO_FILE / REVIEW / BLOCK"],
      optional: false,
      reasoning:
        "Assembles the per-question answer-and-why packet and rolls everything into one fileability verdict: AUTO_FILE when ready, BLOCK when a critical criterion is unmet and readiness is low, REVIEW otherwise.",
    },
  ],
};

export async function getAgents(): Promise<AgentRegistry> {
  try {
    const res = await fetch(`${ENGINE_API}/api/agents`);
    if (!res.ok) throw new Error(`Engine agents -> ${res.status}`);
    const data = (await res.json()) as AgentRegistry;
    if (!data?.agents?.length) throw new Error("empty registry");
    return data;
  } catch {
    return AGENT_REGISTRY_FALLBACK;
  }
}

export interface CriteriaIndexItem {
  drug: string;
  n_cases: number;
  approval_rate?: number | null;
  criteria_count: number;
  critical_count: number;
  sources?: Record<string, number>;
}

export async function getCriteriaIndex(): Promise<CriteriaIndexItem[]> {
  try {
    const res = await fetch(`${ENGINE_API}/api/criteria`);
    if (!res.ok) throw new Error(`Engine criteria -> ${res.status}`);
    return (await res.json()) as CriteriaIndexItem[];
  } catch {
    return [];
  }
}

/* ── Closed-loop validation (AI vs. clinician ground truth) ─────────────── */
export interface GroundTruthEval {
  source?: string;
  generated_at?: string;
  n_orders?: number;
  n_criteria_graded?: number;
  agreement_pct?: number;
  cohens_kappa?: number;
  confusion_matrix?: {
    true_positive: number;
    false_positive: number;
    true_negative: number;
    false_negative: number;
  };
  precision?: number;
  recall?: number;
  f1?: number;
  thumbs?: Record<string, number>;
  case_human_verdict?: Record<string, number>;
  per_drug_agreement?: { drug: string; criteria: number; agreement_pct: number }[];
  n_disagreements?: number;
  sample_disagreements?: {
    order_ref?: string;
    drug?: string;
    criterion_id?: string;
    ai_said?: boolean;
    human_said?: boolean;
    reason?: string;
    reviewer?: string;
  }[];
}

export async function getGroundTruth(): Promise<GroundTruthEval | null> {
  try {
    const res = await fetch(`${ENGINE_API}/api/groundtruth`);
    if (!res.ok) throw new Error(`Engine groundtruth -> ${res.status}`);
    const data = (await res.json()) as GroundTruthEval;
    return data && data.n_criteria_graded ? data : null;
  } catch {
    return null;
  }
}

/* ── Data signals & analysis (insights + triage) ────────────────────────── */
export interface InsightsBucket {
  cases: number;
  denials: number;
  denial_rate: number;
  bucket: string;
}
export interface RiskTerm {
  term: string;
  cases: number;
  denial_rate: number;
  lift: number;
}
export interface EngineInsights {
  denial_by_contradictions?: InsightsBucket[];
  denial_by_supportive?: InsightsBucket[];
  denial_by_completeness?: InsightsBucket[];
  risk_up_terms?: RiskTerm[];
  risk_down_terms?: RiskTerm[];
  base_denial_rate?: number;
  model?: {
    roc_auc?: number;
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1?: number;
    n_train?: number;
    n_test?: number;
    numeric_features?: number;
    vocab_size?: number;
    baseline_auc?: number;
  };
}

export async function getInsights(): Promise<EngineInsights | null> {
  try {
    const res = await fetch(`${ENGINE_API}/api/insights`);
    if (!res.ok) throw new Error(`Engine insights -> ${res.status}`);
    return (await res.json()) as EngineInsights;
  } catch {
    return null;
  }
}

/* ── Portfolio overview (the 10k-case training/eval cohort) ─────────────── */
export interface DenialSegment {
  medication_class: string;
  payer_name: string;
  total_cases: number;
  denials: number;
  denial_rate: number;
}
export interface EngineSummary {
  total_cases?: number;
  approved?: number;
  denied?: number;
  approval_rate_pct?: number;
  cases_with_questionnaire?: number;
  avg_questions?: number;
  top_denial_segments?: DenialSegment[];
}

export async function getSummary(): Promise<EngineSummary | null> {
  try {
    const res = await fetch(`${ENGINE_API}/api/summary`);
    if (!res.ok) throw new Error(`Engine summary -> ${res.status}`);
    return (await res.json()) as EngineSummary;
  } catch {
    return null;
  }
}

/* ── Business case / ROI (impact_calculator) ────────────────────────────── */
export interface ImpactScenario {
  label: string;
  note: string;
  denials_avoided: number;
  additional_approvals: number;
  new_approval_rate_pct: number;
  revenue_gain: number;
  rework_savings: number;
  total_annual_benefit: number;
  patient_days_saved: number;
  staff_hours_saved: number;
}
export interface EngineImpact {
  assumptions: Record<string, number>;
  denials_today: number;
  implementation_cost: number;
  year1_net_benefit: number;
  roi_multiple: number;
  scenarios: ImpactScenario[];
}

export async function getImpact(): Promise<EngineImpact | null> {
  try {
    const res = await fetch(`${ENGINE_API}/api/impact`);
    if (!res.ok) throw new Error(`Engine impact -> ${res.status}`);
    return (await res.json()) as EngineImpact;
  } catch {
    return null;
  }
}

export interface TriageSummary {
  denied?: number;
  total?: number;
  counts?: Record<string, number>;
  addressable?: number;
  addressable_pct?: number;
  note?: string;
}

export async function getTriage(): Promise<TriageSummary | null> {
  try {
    const res = await fetch(`${ENGINE_API}/api/triage`);
    if (!res.ok) throw new Error(`Engine triage -> ${res.status}`);
    return (await res.json()) as TriageSummary;
  } catch {
    return null;
  }
}

/* ── Medical Necessity Engine (v2 staged pipeline) ──────────────────────── */
export interface NecessityScores {
  clinical_match_score?: number;
  criteria_coverage_score?: number;
  historical_match_score?: number;
  documentation_score?: number;
  overall_approval_probability?: number;
  confidence_score?: number;
}

export interface CoverageMatrixItem {
  requirement?: string;
  critical?: boolean;
  present?: boolean;
  supporting_document?: string | null;
  confidence?: number;
  missing?: boolean;
}

export interface NecessityAgentTrace {
  agent: string;
  role: string;
  mode?: string;
}

export interface GapRecoveryItem {
  criterion?: string;
  importance?: string; // Critical | Major | Minor
  criterion_type?: string;
  bypass_possible?: string; // Yes | No | Sometimes
  reviewer_intent?: string;
  alternative_pathways?: string[];
  medical_necessity_arguments?: string[];
  contraindication_based_bypass?: string[];
  safety_based_bypass?: string[];
  alternative_clinical_evidence?: string[];
  appeal_strength?: string; // Strong | Moderate | Weak
  appeal_arguments?: string[];
}

export interface NecessityResult {
  drug?: string;
  payer?: string;
  reasoning_mode?: "llm" | "deterministic" | string;
  coverage_engine?: "default" | "graph_kb" | string;
  recommended_path?: "HIGH_APPROVAL" | "REQUIRES_REVIEW" | "LIKELY_DENIAL" | string;
  scores?: NecessityScores;
  final_prediction?: "APPROVE" | "PEND" | "DENY" | string;
  final_confidence?: number;
  deciding_factor?: {
    supporting_reasons?: string[];
    missing_requirements?: string[];
    contradictions?: string[];
    [k: string]: unknown;
  };
  coverage?: { coverage_matrix?: CoverageMatrixItem[] };
  approval_friendly_reeval?: {
    enhanced_justification?: string | null;
    remaining_risks?: string[];
    final_approval_confidence?: number;
    [k: string]: unknown;
  } | null;
  gap_recovery?: {
    gaps?: GapRecoveryItem[];
    n_unmet?: number;
    _mode?: string;
  } | null;
  clinical_answers?: {
    answers?: {
      question?: string;
      recommended_answer?: string;
      status?: string;
      justification?: string | null;
      citation?: string | null;
    }[];
  };
  final?: {
    approval_prediction?: string;
    confidence_score?: number;
    clinical_justification?: string | null;
    key_supporting_factors?: string[];
    key_risks?: string[];
    recommended_next_steps?: string[];
  };
  db3?: { model?: string; model_auc?: number; kb_base_rate?: number; [k: string]: unknown };
  agents?: NecessityAgentTrace[];
}

export interface NecessityRequest {
  drug?: string;
  payer_name?: string;
  supportive_texts?: string[] | null;
  contradictory_texts?: string[] | null;
  documents?: unknown[] | null;
  questions?: { question?: string }[] | null;
  engine?: "default" | "graph"; // 'graph' routes coverage match through graph_kb
}

export async function runNecessity(req: NecessityRequest): Promise<NecessityResult> {
  return postJson<NecessityResult>("/api/necessity", req);
}

export interface GapRecoveryResult {
  gaps?: GapRecoveryItem[];
  n_unmet?: number;
  _mode?: string;
}

/**
 * Criteria Gap Recovery — standalone, on-demand. Runs the LLM strategist alone
 * (no contention with the necessity pipeline's concurrent calls), so it returns
 * the rich, drug-specific analysis. Pass the coverage matrix from a prior run.
 */
export async function fetchGapRecovery(req: {
  drug?: string;
  payer_name?: string;
  coverage_matrix?: CoverageMatrixItem[];
}): Promise<GapRecoveryResult> {
  return postJson<GapRecoveryResult>("/api/gap-recovery", req);
}

/* ── Post-Denial Recovery & Appeal Specialist ───────────────────────────── */
export interface DenialRecoveryResult {
  drug?: string;
  payer?: string;
  assessment?: {
    appeal_viable?: "YES" | "NO" | "CONDITIONAL" | string;
    approval_probability?: "HIGH" | "MODERATE" | "LOW" | string;
    approval_probability_pct?: number;
    recovery_priority?: "HIGH" | "MEDIUM" | "LOW" | string;
  };
  root_cause?: string[];
  recovery_opportunities?: string[];
  required_documents?: string[];
  appeal_strategy?: string;
  appeal_letter?: string;
  classification?: { code?: number; label?: string };
  automation?: Record<string, string>;
  _mode?: "llm" | "deterministic" | string;
}

export interface DenialRecoveryRequest {
  drug?: string;
  payer_name?: string;
  denial_reason?: string | null;
  denial_letter?: string | null;
  supportive_texts?: string[] | null;
  contradictory_texts?: string[] | null;
  submitted_answers?: { question?: string; answer?: string }[] | null;
}

export async function runDenialRecovery(
  req: DenialRecoveryRequest,
): Promise<DenialRecoveryResult> {
  return postJson<DenialRecoveryResult>("/api/denial-recovery", req);
}

export async function predictCase(c: FilingQueueCase): Promise<PredictResult> {
  return postJson<PredictResult>("/api/predict", {
    medication_class: c.medication_class || "Brand",
    payer_name: c.payer_name,
    drug: c.drug,
    case_id: c.cmm_id || c.member_id || c.patient,
    total_questions: c.total_questions ?? 10,
    answered_questions: c.answered_questions ?? 10,
    supportive_facts: c.supportive_texts?.length ?? 8,
    contradictory_facts: c.contradictory_texts?.length ?? 4,
    supportive_texts: c.supportive_texts ?? null,
    contradictory_texts: c.contradictory_texts ?? null,
  });
}

export const ENGINE_API_URL = ENGINE_API;
