"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/* ----------------------------------------------------------------- types */
type Segment = {
  medication_class: string | null;
  payer_name: string | null;
  total_cases: number;
  denials: number;
  denial_rate: number;
};

type Summary = {
  total_cases?: number;
  approval_rate_pct?: number;
  cases_with_questionnaire?: number;
  avg_questions?: number;
  top_denial_segments?: Segment[];
};

type Bucket = { bucket: string; cases: number; denials: number; denial_rate: number };
type Term = { term: string; cases: number; denial_rate: number; lift: number };
type ModelCard = {
  roc_auc: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  n_train: number;
  n_test: number;
  numeric_features: number;
  vocab_size: number;
  baseline_auc: number;
};
type Insights = {
  model?: ModelCard;
  base_denial_rate?: number;
  denial_by_contradictions?: Bucket[];
  denial_by_supportive?: Bucket[];
  denial_by_completeness?: Bucket[];
  risk_up_terms?: Term[];
  risk_down_terms?: Term[];
};

type RiskFactor = { factor: string; impact: number };
type Decision = "AUTO_SUBMIT" | "REVIEW" | "BLOCK";

type CriterionStatus = "MET" | "AT_RISK" | "UNVERIFIED";
type Criterion = {
  statement: string;
  critical: boolean;
  source?: string;
  status: CriterionStatus;
  evidence?: string;
};
type CriteriaMatch = {
  drug: string;
  approval_rate?: number;
  readiness_pct: number;
  met: number;
  at_risk: number;
  unverified: number;
  total: number;
  critical_unmet: number;
  fda_indication?: string;
  criteria: Criterion[];
  note?: string;
};

type PredictResult = {
  denial_risk: number;
  risk_level: "HIGH" | "MEDIUM" | "LOW";
  decision?: Decision;
  decision_reason?: string;
  confidence?: number;
  recommendations: string[];
  risk_factors?: RiskFactor[];
  criteria_match?: CriteriaMatch | null;
  drug?: string | null;
  record_id?: string;
  model?: string;
  model_auc?: number;
};

type Triage = {
  denied: number;
  total: number;
  counts: Record<string, number>;
  addressable: number;
  addressable_pct: number;
  note?: string;
};
type DrugIndex = {
  drug: string;
  n_cases: number;
  approval_rate?: number;
  criteria_count: number;
  critical_count: number;
  sources: Record<string, boolean>;
};
type DrugDetail = {
  drug: string;
  n_cases: number;
  approval_rate?: number;
  criteria: Criterion[];
  criteria_count: number;
  critical_count: number;
  sources: Record<string, boolean>;
  fda?: { generic_name?: string; route?: string; indications?: string; dosing?: string } | null;
  winning_evidence_examples?: string[];
  common_denial_gaps?: string[];
};

const STATUS_META: Record<CriterionStatus, { label: string; color: string; icon: string }> = {
  MET: { label: "Met", color: "#005d49", icon: "✓" },
  AT_RISK: { label: "At risk", color: "#cc0300", icon: "✕" },
  UNVERIFIED: { label: "Unverified", color: "#7a7a7a", icon: "?" },
};

const DECISION_META: Record<Decision, { label: string; color: string; icon: string }> = {
  AUTO_SUBMIT: { label: "Touchless · auto-submit", color: "#005d49", icon: "✓" },
  REVIEW: { label: "Route to human review", color: "#c24400", icon: "◐" },
  BLOCK: { label: "Block · fix before submit", color: "#cc0300", icon: "✕" },
};

type Scenario = {
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
};
type Impact = {
  assumptions: Record<string, number>;
  denials_today: number;
  implementation_cost: number;
  year1_net_benefit: number;
  roi_multiple: number;
  scenarios: Scenario[];
};

type BatchRow = {
  case_id: string;
  medication_class: string;
  payer_name: string;
  denial_risk: number;
  risk_level: "HIGH" | "MEDIUM" | "LOW";
  decision: Decision;
  top_factor: string | null;
};
type BatchResult = {
  count: number;
  avg_risk: number;
  distribution: Record<string, number>;
  routing: Record<Decision, number>;
  touchless_rate: number;
  needs_human: number;
  flagged: number;
  preventable_denials: number;
  results: BatchRow[];
};

type ShowcaseCase = {
  case_id: string;
  drug: string;
  medication_class: string;
  payer_name: string;
  total_questions: number;
  answered_questions: number;
  supportive_texts: string[];
  contradictory_texts: string[];
  actual_outcome: "Approved" | "Denied";
  predicted_risk: number;
  predicted_level: "HIGH" | "MEDIUM" | "LOW";
  predicted_decision: Decision;
  predicted_label: "Approved" | "Denied";
  correct: boolean;
};

type FilingPatient = {
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
  supportive_texts: string[];
  contradictory_texts: string[];
  expected_decision: Decision;
  expected_risk: number;
};

type AuditRow = Record<string, unknown>;

const TABS = ["Overview", "Filing", "Showcase", "Risk Insights", "Triage", "Predict", "Criteria", "Batch", "Impact", "Patterns", "Audit"] as const;
type Tab = (typeof TABS)[number];

const C = {
  blue: "#0056d6",
  green: "#008f32",
  amber: "#c24400",
  red: "#cc0300",
  muted: "#5c5c5c",
  border: "#e6e6e6",
  panel: "#ffffff",
  panel2: "#ffffff",
};
const RISK_COLORS: Record<string, string> = { HIGH: C.red, MEDIUM: C.amber, LOW: C.green };

const fmt = (n: number | undefined) => (n ?? 0).toLocaleString();

async function getJSON<T>(url: string): Promise<T> {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return r.json();
}

const tooltipStyle = {
  background: C.panel2,
  border: `1px solid ${C.border}`,
  borderRadius: 10,
  color: "#0f0f0f",
  fontSize: 12,
};

/* ----------------------------------------------------------------- shell */
export default function Page() {
  const [tab, setTab] = useState<Tab>("Overview");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [stats, setStats] = useState<Segment[]>([]);

  useEffect(() => {
    getJSON<Summary>("/api/summary").then(setSummary).catch(() => setSummary({}));
    getJSON<Insights>("/api/insights").then(setInsights).catch(() => setInsights({}));
    getJSON<Segment[]>("/api/denial-stats").then(setStats).catch(() => setStats([]));
  }, []);

  const auc = insights?.model?.roc_auc;

  return (
    <div className="mx-auto max-w-6xl px-5 pb-20 sm:px-6">
      {/* header */}
      <header className="pt-9 pb-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#008f32] to-[#1db954] text-lg shadow-lg shadow-[#008f32]/20">
                ⚕
              </span>
              <h1 className="bg-gradient-to-r from-[#0f0f0f] to-[#4d4d4d] bg-clip-text text-2xl font-bold text-transparent">
                RISA Denial Prevention Engine
              </h1>
            </div>
            <p className="mt-1.5 text-sm text-[#5c5c5c]">
              Catch pharmacy prior-auth denials <em className="not-italic text-[#1f1f1f]">before</em> submission
              — turn the evidence RISA already extracts into a go / no-go signal.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-[#84ebb5] bg-[#eefcf4] px-3 py-1.5 text-xs font-semibold text-[#00521d]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#1db954]" />
              Model live{auc ? ` · AUC ${auc}` : ""}
            </span>
          </div>
        </div>
      </header>

      {/* tabs */}
      <nav className="sticky top-0 z-10 -mx-5 flex flex-wrap gap-2 border-b border-[#e6e6e6] bg-[#f7f9fa]/85 px-5 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
              tab === t
                ? "border-[#008f32] bg-[#eefcf4] text-[#00521d] shadow-sm shadow-[#008f32]/15"
                : "border-[#e6e6e6] bg-[#ffffff] text-[#5c5c5c] hover:border-[#008f32] hover:text-[#0f0f0f]"
            }`}
          >
            {t}
          </button>
        ))}
      </nav>

      <main key={tab} className="animate-fade-up pt-6">
        {tab === "Overview" && <Overview summary={summary} insights={insights} />}
        {tab === "Filing" && <FilingTab />}
        {tab === "Showcase" && <ShowcaseTab />}
        {tab === "Risk Insights" && <RiskInsights insights={insights} />}
        {tab === "Triage" && <TriageTab />}
        {tab === "Predict" && <Predict />}
        {tab === "Criteria" && <CriteriaTab />}
        {tab === "Batch" && <Batch />}
        {tab === "Impact" && <ImpactTab />}
        {tab === "Patterns" && <Patterns stats={stats} />}
        {tab === "Audit" && <Audit />}
      </main>

      <footer className="mt-14 border-t border-[#e6e6e6] pt-5 text-xs text-[#7a7a7a]">
        RISA Hackathon 2026 · trained on 10,000 de-identified PA cases · XGBoost + TF-IDF
        evidence model · Next.js + FastAPI on Cloud Run (rapids-platform)
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------- primitives */
function Panel({
  title,
  subtitle,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`mb-5 rounded-xl border border-[#e6e6e6] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] ${className}`}
    >
      {title && <h2 className="text-base font-semibold text-[#0f0f0f]">{title}</h2>}
      {subtitle && <p className="mt-1 mb-3 text-sm text-[#5c5c5c]">{subtitle}</p>}
      {!subtitle && title && <div className="mb-3" />}
      {children}
    </section>
  );
}

function Stat({ label, value, accent, hint }: { label: string; value: string; accent: string; hint?: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-[#e6e6e6] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="absolute inset-y-0 left-0 w-1" style={{ background: accent }} />
      <div className="pl-1.5">
        <div className="text-xs font-medium text-[#5c5c5c]">{label}</div>
        <div className="mt-1.5 text-2xl font-bold tracking-tight" style={{ color: accent }}>
          {value}
        </div>
        {hint && <div className="mt-0.5 text-[11px] text-[#7a7a7a]">{hint}</div>}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- overview */
function Overview({ summary, insights }: { summary: Summary | null; insights: Insights | null }) {
  if (summary === null) return <Loading />;
  const m = insights?.model;
  const empty = !Object.keys(summary).length;

  const cards: [string, string, string, string?][] = [
    ["Cases analyzed", empty ? "—" : fmt(summary.total_cases), C.blue],
    ["Approval rate", empty ? "—" : `${summary.approval_rate_pct ?? 0}%`, C.green],
    ["Model AUC", m ? `${m.roc_auc}` : "—", C.amber, m ? `up from ${m.baseline_auc} baseline` : undefined],
    ["With questionnaire", empty ? "—" : fmt(summary.cases_with_questionnaire), "#661aff"],
  ];

  return (
    <>
      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(([label, value, accent, hint]) => (
          <Stat key={label} label={label} value={value} accent={accent} hint={hint} />
        ))}
      </div>

      {m && (
        <Panel title="Model performance" subtitle="Held-out test set (2,000 cases the model never saw during training)">
          <div className="grid gap-5 md:grid-cols-[1.1fr_1fr]">
            <div>
              <AucBar baseline={m.baseline_auc} current={m.roc_auc} />
              <p className="mt-3 text-sm text-[#5c5c5c]">
                Adding the <strong className="text-[#1f1f1f]">evidence-text channel</strong> (the supportive /
                contradictory facts RISA already produces) lifted ROC-AUC from{" "}
                <span className="text-[#c24400]">{m.baseline_auc}</span> →{" "}
                <span className="font-semibold text-[#008f32]">{m.roc_auc}</span> — the facts are by far the dominant signal.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 self-start">
              <Metric label="Precision" value={m.precision} />
              <Metric label="Recall" value={m.recall} />
              <Metric label="F1 score" value={m.f1} />
              <Metric label="Accuracy" value={m.accuracy} />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-[#5c5c5c]">
            <Chip>{fmt(m.n_train)} train / {fmt(m.n_test)} test</Chip>
            <Chip>{m.numeric_features} numeric features</Chip>
            <Chip>{fmt(m.vocab_size)}-term evidence vocabulary</Chip>
            <Chip>XGBoost + TF-IDF</Chip>
          </div>
        </Panel>
      )}

      <Panel title="How it works" subtitle="From RISA's evidence extraction to a pre-submission risk score">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["1 · Evidence", "Each PA questionnaire is evaluated criterion-by-criterion into supportive and contradictory facts (RISA's Stage-3 output).", C.blue],
            ["2 · Score", "An XGBoost + TF-IDF model reads those facts and returns a denial-risk % with a HIGH / MEDIUM / LOW band.", C.amber],
            ["3 · Fix", "Contradictions are mapped to real failure modes (step-therapy, dosing, missing docs…) with concrete fixes before you submit.", C.green],
          ].map(([h, body, accent]) => (
            <div key={h} className="rounded-xl border border-[#e6e6e6] bg-[#f7f9f5] p-4">
              <div className="text-sm font-semibold" style={{ color: accent }}>{h}</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[#4d4d4d]">{body}</p>
            </div>
          ))}
        </div>
      </Panel>

      {!!summary.top_denial_segments?.length && (
        <Panel title="Highest-risk segments" subtitle="Drug class × payer combinations with the most denials">
          <SegmentTable rows={summary.top_denial_segments} />
        </Panel>
      )}

      {empty && (
        <Panel>
          <p className="text-[#5c5c5c]">
            No app data found. Run <code className="text-[#1f1f1f]">python build_app_data.py</code> and{" "}
            <code className="text-[#1f1f1f]">python build_insights.py</code> locally.
          </p>
        </Panel>
      )}
    </>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[#e6e6e6] bg-[#ffffff] p-3 text-center">
      <div className="text-2xl font-bold text-[#0f0f0f]">{(value * 100).toFixed(0)}%</div>
      <div className="text-[11px] text-[#5c5c5c]">{label}</div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-[#e6e6e6] bg-[#f7f9f5] px-2.5 py-1">{children}</span>
  );
}

function AucBar({ baseline, current }: { baseline: number; current: number }) {
  const row = (label: string, v: number, color: string) => (
    <div className="mb-2.5">
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-[#5c5c5c]">{label}</span>
        <span className="font-semibold" style={{ color }}>{v.toFixed(3)}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#ededed]">
        <div className="h-full rounded-full" style={{ width: `${v * 100}%`, background: color }} />
      </div>
    </div>
  );
  return (
    <div>
      {row("Numeric-only (baseline)", baseline, "#c24400")}
      {row("+ Evidence text (deployed)", current, C.green)}
    </div>
  );
}

/* ---------------------------------------------------------- risk insights */
function RiskInsights({ insights }: { insights: Insights | null }) {
  if (insights === null) return <Loading />;
  if (!insights.denial_by_contradictions?.length)
    return (
      <Panel>
        <p className="text-[#5c5c5c]">
          No insights yet. Run <code className="text-[#1f1f1f]">python build_insights.py</code> locally.
        </p>
      </Panel>
    );

  const base = insights.base_denial_rate ?? 40;

  return (
    <>
      <Panel
        title="Contradictory facts are the denial signal"
        subtitle={`As contradictions pile up, denial rate climbs well past the ${base}% baseline — the model's #1 driver.`}
      >
        <BucketChart data={insights.denial_by_contradictions} base={base} color={C.red} />
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Supportive facts lower risk" subtitle="More cited support → fewer denials">
          <BucketChart data={insights.denial_by_supportive ?? []} base={base} color={C.green} small />
        </Panel>
        <Panel title="Incomplete questionnaires get denied" subtitle="Denial rate by % of questions answered">
          <BucketChart data={insights.denial_by_completeness ?? []} base={base} color={C.amber} small />
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Evidence phrases that raise denial risk" subtitle="Real terms from the model, with denial rate when present">
          <TermList terms={insights.risk_up_terms ?? []} color={C.red} base={base} />
        </Panel>
        <Panel title="Phrases that signal approval" subtitle="When these appear, denials are rare">
          <TermList terms={insights.risk_down_terms ?? []} color={C.green} base={base} />
        </Panel>
      </div>
    </>
  );
}

function BucketChart({ data, base, color, small }: { data: Bucket[]; base: number; color: string; small?: boolean }) {
  return (
    <div style={{ width: "100%", height: small ? 240 : 300 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 18, right: 12, left: -8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e6e6e6" vertical={false} />
          <XAxis dataKey="bucket" stroke={C.muted} tick={{ fontSize: 12 }} tickLine={false} />
          <YAxis stroke={C.muted} tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ fill: "rgba(0,0,0,0.04)" }}
            formatter={(value, _name, item) => {
              const b = item?.payload as Bucket | undefined;
              return [`${value}%  ·  ${fmt(b?.cases)} cases`, "Denial rate"];
            }}
          />
          <Bar dataKey="denial_rate" radius={[6, 6, 0, 0]} maxBarSize={64}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.denial_rate >= base ? color : "#c7c7c7"} />
            ))}
            <LabelList dataKey="denial_rate" position="top" formatter={(v) => `${v}%`} fill="#1f1f1f" fontSize={11} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function TermList({ terms, color, base }: { terms: Term[]; color: string; base: number }) {
  if (!terms.length) return <p className="text-[#5c5c5c]">No terms.</p>;
  const max = Math.max(...terms.map((t) => t.denial_rate), 100);
  return (
    <div className="space-y-2.5">
      {terms.map((t) => (
        <div key={t.term} className="flex items-center gap-3">
          <code className="w-40 shrink-0 truncate text-[13px] text-[#1f1f1f]" title={t.term}>
            {t.term}
          </code>
          <div className="relative h-6 flex-1 overflow-hidden rounded-md bg-[#ededed]">
            <div className="h-full rounded-md opacity-80" style={{ width: `${(t.denial_rate / max) * 100}%`, background: color }} />
            <span className="absolute inset-y-0 right-2 flex items-center text-[11px] font-semibold text-white">
              {t.denial_rate}%
            </span>
          </div>
          <span className="w-20 shrink-0 text-right text-[11px] text-[#7a7a7a]">{fmt(t.cases)} cases</span>
        </div>
      ))}
      <p className="pt-1 text-[11px] text-[#7a7a7a]">Baseline denial rate: {base}%</p>
    </div>
  );
}

/* ----------------------------------------------------------------- predict */
type Form = {
  medClass: string;
  payer: string;
  drug: string;
  totalQ: number;
  answeredQ: number;
  supText: string;
  conText: string;
};

const PRESETS: Record<string, Form> = {
  "Clean case (Zepbound)": {
    medClass: "Brand",
    payer: "Aetna Commercial",
    drug: "Zepbound",
    totalQ: 8,
    answeredQ: 8,
    supText: [
      "Diagnosis matches the FDA-approved indication for Zepbound.",
      "Patient is on a reduced-calorie diet and increased physical activity program.",
      "Completed 3 months of therapy at a stable maintenance dose.",
    ].join("\n"),
    conText: "",
  },
  "Conflicted case (Zepbound)": {
    medClass: "Brand",
    payer: "Fidelis Care",
    drug: "Zepbound",
    totalQ: 10,
    answeredQ: 8,
    supText: "Diagnosis matches the approved indication.",
    conText: [
      "Requested dose exceeds the FDA label maximum maintenance dose.",
      "No documentation of a reduced-calorie diet or physical activity program.",
      "Required baseline labs not found in the record.",
    ].join("\n"),
  },
  "No questionnaire": {
    medClass: "Unknown",
    payer: "Aetna Commercial",
    drug: "",
    totalQ: 0,
    answeredQ: 0,
    supText: "",
    conText: "",
  },
};

const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);

function Predict() {
  const [form, setForm] = useState<Form>(PRESETS["Conflicted case (Zepbound)"]);
  const [result, setResult] = useState<PredictResult | null>(null);
  const [loading, setLoading] = useState(false);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const supFacts = lines(form.supText);
  const conFacts = lines(form.conText);

  const analyze = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          case_id: "demo",
          medication_class: form.medClass,
          payer_name: form.payer,
          drug: form.drug || null,
          total_questions: form.totalQ,
          answered_questions: form.answeredQ,
          supportive_facts: supFacts.length,
          contradictory_facts: conFacts.length,
          supportive_texts: supFacts,
          contradictory_texts: conFacts,
        }),
      });
      setResult(await r.json());
    } finally {
      setLoading(false);
    }
  }, [form, supFacts, conFacts]);

  const num = (k: "totalQ" | "answeredQ", label: string) => (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-[#5c5c5c]">{label}</span>
      <input
        type="number"
        min={0}
        value={form[k]}
        onChange={(e) => set(k, Number(e.target.value))}
        className="w-full rounded-xl border border-[#e6e6e6] bg-[#ffffff] px-3 py-2.5 text-sm outline-none focus:border-[#008f32]"
      />
    </label>
  );

  const facts = (k: "supText" | "conText", label: string, accent: string, hint: string) => (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-2 text-xs font-medium text-[#5c5c5c]">
        <span className="h-2 w-2 rounded-full" style={{ background: accent }} />
        {label}
      </span>
      <textarea
        rows={5}
        value={form[k]}
        placeholder={hint}
        onChange={(e) => set(k, e.target.value)}
        className="w-full resize-y rounded-xl border border-[#e6e6e6] bg-[#ffffff] px-3 py-2.5 text-[13px] leading-relaxed outline-none focus:border-[#008f32]"
      />
    </label>
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
      <Panel title="Single-case denial risk" subtitle="One evidence fact per line — the facts drive the score (test AUC ≈ 0.83).">
        <div className="mb-4 flex flex-wrap gap-2">
          {Object.keys(PRESETS).map((name) => (
            <button
              key={name}
              onClick={() => { setForm(PRESETS[name]); setResult(null); }}
              className="rounded-lg border border-[#e6e6e6] bg-[#f7f9f5] px-3 py-1.5 text-xs text-[#4d4d4d] transition hover:border-[#008f32] hover:text-[#0f0f0f]"
            >
              {name}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-[#5c5c5c]">Drug class</span>
            <input
              value={form.medClass}
              onChange={(e) => set("medClass", e.target.value)}
              className="w-full rounded-xl border border-[#e6e6e6] bg-[#ffffff] px-3 py-2.5 text-sm outline-none focus:border-[#008f32]"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-[#5c5c5c]">Payer</span>
            <input
              value={form.payer}
              onChange={(e) => set("payer", e.target.value)}
              className="w-full rounded-xl border border-[#e6e6e6] bg-[#ffffff] px-3 py-2.5 text-sm outline-none focus:border-[#008f32]"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-xs font-medium text-[#5c5c5c]">
              Drug <span className="text-[#7a7a7a]">(brand — unlocks the per-drug criteria checklist)</span>
            </span>
            <input
              value={form.drug}
              placeholder="e.g. Zepbound, Injectafer, Venofer…"
              onChange={(e) => set("drug", e.target.value)}
              className="w-full rounded-xl border border-[#e6e6e6] bg-[#ffffff] px-3 py-2.5 text-sm outline-none focus:border-[#008f32]"
            />
          </label>
          {num("totalQ", "Total questions")}
          {num("answeredQ", "Answered questions")}
          {facts("supText", `Supportive facts (${supFacts.length})`, C.green, "One supporting fact per line…")}
          {facts("conText", `Contradictory facts (${conFacts.length})`, C.red, "One contradictory finding per line…")}
        </div>

        <button
          onClick={analyze}
          disabled={loading}
          className="mt-4 w-full rounded-xl bg-gradient-to-r from-[#008f32] to-[#1db954] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60 sm:w-auto"
        >
          {loading ? "Analyzing…" : "Analyze case"}
        </button>
      </Panel>

      <Panel title="Result">
        {!result ? (
          <div className="flex h-64 flex-col items-center justify-center text-center text-sm text-[#7a7a7a]">
            <span className="mb-2 text-3xl opacity-40">◔</span>
            Enter a case and hit <span className="mx-1 text-[#4d4d4d]">Analyze</span> to score it.
          </div>
        ) : (
          <div className="animate-fade-up">
            <Gauge value={result.denial_risk} level={result.risk_level} />
            {result.decision && (
              <DecisionBanner decision={result.decision} reason={result.decision_reason} />
            )}
            {result.criteria_match && <CriteriaMatchPanel match={result.criteria_match} />}
            {!!result.risk_factors?.length && (
              <div className="mt-5">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#5c5c5c]">
                  Top risk factors (SHAP)
                </div>
                <RiskFactors factors={result.risk_factors} />
              </div>
            )}
            <div className="mt-4 space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-[#5c5c5c]">
                Recommended fixes
              </div>
              {result.recommendations.map((r, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-[#e6e6e6] bg-[#f7f9f5] px-3 py-2.5 text-[13px] leading-relaxed text-[#1f1f1f]"
                >
                  {r}
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-[#7a7a7a]">
              {result.model}
              {result.model_auc ? ` · test AUC ${result.model_auc}` : ""} · logged{" "}
              {(result.record_id ?? "").slice(0, 8)}…
            </p>
          </div>
        )}
      </Panel>
    </div>
  );
}

function Gauge({ value, level }: { value: number; level: string }) {
  const color = RISK_COLORS[level] ?? C.amber;
  const R = 64;
  const C2 = 2 * Math.PI * R;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-44 w-44">
        <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
          <circle cx="80" cy="80" r={R} fill="none" stroke="#ededed" strokeWidth="14" />
          <circle
            cx="80"
            cy="80"
            r={R}
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={C2}
            strokeDashoffset={C2 * (1 - pct / 100)}
            style={{ transition: "stroke-dashoffset 0.7s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-extrabold text-[#0f0f0f]">{value}%</span>
          <span className="text-[11px] uppercase tracking-wider text-[#5c5c5c]">denial risk</span>
        </div>
      </div>
      <span
        className="mt-2 rounded-full px-4 py-1 text-xs font-bold"
        style={{ color, background: `${color}22`, border: `1px solid ${color}55` }}
      >
        {level} RISK
      </span>
    </div>
  );
}

function DecisionBanner({ decision, reason }: { decision: Decision; reason?: string }) {
  const m = DECISION_META[decision];
  return (
    <div
      className="mt-4 rounded-xl border px-4 py-3"
      style={{ borderColor: `${m.color}55`, background: `${m.color}14` }}
    >
      <div className="flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-full text-sm font-bold" style={{ background: `${m.color}26`, color: m.color }}>
          {m.icon}
        </span>
        <span className="text-sm font-bold uppercase tracking-wide" style={{ color: m.color }}>
          {m.label}
        </span>
      </div>
      {reason && <p className="mt-1.5 text-[12px] leading-relaxed text-[#4d4d4d]">{reason}</p>}
    </div>
  );
}

function RiskFactors({ factors }: { factors: RiskFactor[] }) {
  const max = Math.max(...factors.map((f) => f.impact), 0.001);
  return (
    <div className="space-y-2">
      {factors.map((f, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="flex-1 truncate text-[13px] text-[#1f1f1f]" title={f.factor}>
            {f.factor}
          </span>
          <div className="relative h-2.5 w-28 shrink-0 overflow-hidden rounded-full bg-[#ededed]">
            <div
              className="h-full rounded-full"
              style={{ width: `${(f.impact / max) * 100}%`, background: C.red }}
            />
          </div>
          <span className="w-12 shrink-0 text-right text-[11px] font-semibold text-[#c24400]">
            +{f.impact.toFixed(2)}
          </span>
        </div>
      ))}
      <p className="pt-1 text-[11px] text-[#7a7a7a]">
        Log-odds contribution pushing this case toward denial.
      </p>
    </div>
  );
}

/* ----------------------------------------------------- criteria match (predict) */
function CriteriaMatchPanel({ match }: { match: CriteriaMatch }) {
  const ready = match.readiness_pct;
  const readyColor = ready >= 80 ? C.green : ready >= 50 ? C.amber : C.red;
  return (
    <div className="mt-5 rounded-xl border border-[#e6e6e6] bg-[#f7f9f5] p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wide text-[#5c5c5c]">
          Criteria readiness · {match.drug}
        </div>
        {match.approval_rate != null && (
          <span className="text-[11px] text-[#7a7a7a]">
            historical approval {Math.round(match.approval_rate * 100)}%
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center gap-3">
        <div className="text-2xl font-bold" style={{ color: readyColor }}>{ready}%</div>
        <div className="flex-1">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#ededed]">
            <div className="h-full rounded-full" style={{ width: `${ready}%`, background: readyColor }} />
          </div>
          <div className="mt-1 flex gap-3 text-[11px] text-[#5c5c5c]">
            <span style={{ color: C.green }}>{match.met} met</span>
            <span style={{ color: C.red }}>{match.at_risk} at risk</span>
            <span>{match.unverified} unverified</span>
            {match.critical_unmet > 0 && (
              <span className="font-semibold" style={{ color: C.red }}>
                · {match.critical_unmet} critical unmet
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        {match.criteria.map((c, i) => {
          const sm = STATUS_META[c.status];
          return (
            <div key={i} className="rounded-lg border border-[#ededed] bg-[#ffffff] px-3 py-2">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold" style={{ background: `${sm.color}26`, color: sm.color }}>
                  {sm.icon}
                </span>
                <div className="flex-1">
                  <div className="text-[13px] leading-snug text-[#1f1f1f]">
                    {c.critical && <span className="mr-1 text-[10px] font-bold text-[#c24400]">CRITICAL</span>}
                    {c.statement}
                  </div>
                  {c.evidence && (
                    <div className="mt-0.5 text-[11px] italic text-[#6b6b6b]">“{c.evidence}”</div>
                  )}
                </div>
                <span className="shrink-0 text-[10px] font-semibold uppercase" style={{ color: sm.color }}>{sm.label}</span>
              </div>
            </div>
          );
        })}
      </div>
      {match.note && <p className="mt-2 text-[10px] text-[#7a7a7a]">{match.note}</p>}
    </div>
  );
}

/* -------------------------------------------------------------- filing tab */
type FilingPhase = "queued" | "processing" | "done";
type FilingRow = FilingPatient & { phase: FilingPhase; result?: PredictResult; decision?: Decision };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function FilingTab() {
  const [rows, setRows] = useState<FilingRow[] | null>(null);
  const [running, setRunning] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sel, setSel] = useState<string | null>(null);

  useEffect(() => {
    getJSON<FilingPatient[]>("/api/filing-queue")
      .then((q) => setRows(q.map((p) => ({ ...p, phase: "queued" }))))
      .catch(() => setRows([]));
  }, []);

  const score = useCallback(async (p: FilingPatient): Promise<PredictResult> => {
    const r = await fetch("/api/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        case_id: p.cmm_id,
        medication_class: p.medication_class,
        payer_name: p.payer_name,
        drug: p.drug,
        total_questions: p.total_questions,
        answered_questions: p.answered_questions,
        supportive_facts: p.supportive_texts.length,
        contradictory_facts: p.contradictory_texts.length,
        supportive_texts: p.supportive_texts,
        contradictory_texts: p.contradictory_texts,
      }),
    });
    return r.json();
  }, []);

  const run = useCallback(async () => {
    if (!rows) return;
    setRunning(true);
    setSel(null);
    setRows((rs) => rs!.map((r) => ({ ...r, phase: "queued", result: undefined, decision: undefined })));
    for (const p of rows) {
      setActiveId(p.member_id);
      setRows((rs) => rs!.map((r) => (r.member_id === p.member_id ? { ...r, phase: "processing" } : r)));
      await sleep(650);
      const result = await score(p);
      const decision = (result.decision ?? "REVIEW") as Decision;
      setRows((rs) => rs!.map((r) => (r.member_id === p.member_id ? { ...r, phase: "done", result, decision } : r)));
      await sleep(250);
    }
    setActiveId(null);
    setRunning(false);
  }, [rows, score]);

  const reset = useCallback(() => {
    setRows((rs) => rs?.map((r) => ({ ...r, phase: "queued", result: undefined, decision: undefined })) ?? null);
    setSel(null);
    setActiveId(null);
  }, []);

  if (rows === null) return <Loading />;
  if (!rows.length)
    return <Panel><p className="text-[#5c5c5c]">No filing queue — run <code className="text-[#1f1f1f]">python build_filing_queue.py</code>.</p></Panel>;

  const done = rows.filter((r) => r.phase === "done");
  const filed = done.filter((r) => r.decision === "AUTO_SUBMIT").length;
  const review = done.filter((r) => r.decision === "REVIEW").length;
  const blocked = done.filter((r) => r.decision === "BLOCK").length;
  const touchlessRate = done.length ? Math.round((filed / done.length) * 100) : 0;
  const selRow = rows.find((r) => r.member_id === sel) ?? null;

  return (
    <>
      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Filed touchless" value={fmt(filed)} accent={C.green} hint={`${touchlessRate}% · no human`} />
        <Stat label="Routed to filer" value={fmt(review)} accent={C.amber} hint="needs a check" />
        <Stat label="Blocked" value={fmt(blocked)} accent={C.red} hint="fix before submit" />
        <Stat label="Human touches saved" value={fmt(filed)} accent={C.blue} hint={`of ${rows.length} PAs`} />
      </div>

      <Panel
        title="PA filing worklist"
        subtitle="Dummy patients (synthetic identities, real evidence). Run the engine to file the safe ones automatically."
      >
        <div className="mb-3 flex items-center gap-3">
          <button
            onClick={run}
            disabled={running}
            className="rounded-xl bg-gradient-to-r from-[#008f32] to-[#1db954] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {running ? "Filing…" : "▶ Run touchless filing"}
          </button>
          <button
            onClick={reset}
            disabled={running}
            className="rounded-xl border border-[#e6e6e6] bg-[#f7f9f5] px-3 py-2.5 text-xs text-[#4d4d4d] hover:text-[#0f0f0f] disabled:opacity-60"
          >
            Reset queue
          </button>
          {running && <span className="text-[12px] text-[#5c5c5c]">processing the queue one PA at a time…</span>}
        </div>

        <div className="scroll-thin overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-[#7a7a7a]">
                {["Patient", "DOB", "Medication", "Insurance", "CoverMyMeds ID", "Engine decision"].map((h) => (
                  <th key={h} className="border-b border-[#e6e6e6] px-3 py-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.member_id}
                  onClick={() => r.phase === "done" && setSel(r.member_id)}
                  className={`transition ${r.member_id === activeId ? "bg-[#eefcf4]" : "hover:bg-[#f7f9f5]"} ${r.phase === "done" ? "cursor-pointer" : ""} ${sel === r.member_id ? "ring-1 ring-[#008f32]" : ""}`}
                >
                  <td className="border-b border-[#ededed] px-3 py-2.5">
                    <div className="font-medium text-[#1f1f1f]">{r.patient}</div>
                    <div className="text-[11px] text-[#7a7a7a]">{r.member_id}</div>
                  </td>
                  <td className="border-b border-[#ededed] px-3 py-2.5 text-[#4d4d4d]">{r.dob}</td>
                  <td className="border-b border-[#ededed] px-3 py-2.5">
                    <div className="text-[#1f1f1f]">{r.drug}</div>
                    <div className="max-w-[160px] truncate text-[11px] text-[#7a7a7a]" title={r.medication}>{r.medication}</div>
                  </td>
                  <td className="border-b border-[#ededed] px-3 py-2.5 text-[#4d4d4d]">{r.payer_name}</td>
                  <td className="border-b border-[#ededed] px-3 py-2.5 font-mono text-[12px] text-[#5c5c5c]">{r.cmm_id}</td>
                  <td className="border-b border-[#ededed] px-3 py-2.5">
                    <FilingStatus row={r} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-[#7a7a7a]">
          Touchless rule: low risk + complete questionnaire + zero contradictions → auto-file. Everything
          else is routed to a human. Click a filed row to see why.
        </p>
      </Panel>

      {selRow?.result && (
        <Panel title={`${selRow.patient} · ${selRow.drug}`} subtitle={`${selRow.payer_name} · ${selRow.cmm_id}`}>
          <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
            <div>
              <Gauge value={selRow.result.denial_risk} level={selRow.result.risk_level} />
              {selRow.result.decision && <DecisionBanner decision={selRow.result.decision} reason={selRow.result.decision_reason} />}
            </div>
            <div>
              {selRow.result.criteria_match && <CriteriaMatchPanel match={selRow.result.criteria_match} />}
              <div className="mt-4 space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-[#5c5c5c]">Recommended fixes</div>
                {selRow.result.recommendations.map((r, i) => (
                  <div key={i} className="rounded-lg border border-[#e6e6e6] bg-[#f7f9f5] px-3 py-2.5 text-[13px] leading-relaxed text-[#1f1f1f]">{r}</div>
                ))}
              </div>
            </div>
          </div>
        </Panel>
      )}
    </>
  );
}

function FilingStatus({ row }: { row: FilingRow }) {
  if (row.phase === "queued")
    return <span className="text-[12px] text-[#7a7a7a]">Queued</span>;
  if (row.phase === "processing")
    return (
      <span className="flex items-center gap-2 text-[12px] text-[#5c5c5c]">
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#008f32] border-t-transparent" />
        Scoring evidence…
      </span>
    );
  const d = row.decision ?? "REVIEW";
  const m = DECISION_META[d];
  const verb = d === "AUTO_SUBMIT" ? "Filed · touchless" : d === "REVIEW" ? "Routed to filer" : "Blocked";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold"
      style={{ color: m.color, background: `${m.color}1f` }}>
      <span>{m.icon}</span>
      {verb}
      {row.result && <span className="opacity-70">· {row.result.denial_risk}%</span>}
    </span>
  );
}

/* ------------------------------------------------------------- showcase tab */
function OutcomeBadge({ label, kind }: { label: string; kind: "Approved" | "Denied" }) {
  const color = kind === "Approved" ? C.green : C.red;
  return (
    <span className="rounded-md px-2 py-0.5 text-[11px] font-bold" style={{ color, background: `${color}1f` }}>
      {label}
    </span>
  );
}

function ShowcaseTab() {
  const [cases, setCases] = useState<ShowcaseCase[] | null>(null);
  const [sel, setSel] = useState<ShowcaseCase | null>(null);
  const [result, setResult] = useState<PredictResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getJSON<ShowcaseCase[]>("/api/showcase").then(setCases).catch(() => setCases([]));
  }, []);

  const run = useCallback(async (c: ShowcaseCase) => {
    setSel(c);
    setResult(null);
    setLoading(true);
    try {
      const r = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          case_id: c.case_id,
          medication_class: c.medication_class,
          payer_name: c.payer_name,
          drug: c.drug,
          total_questions: c.total_questions,
          answered_questions: c.answered_questions,
          supportive_facts: c.supportive_texts.length,
          contradictory_facts: c.contradictory_texts.length,
          supportive_texts: c.supportive_texts,
          contradictory_texts: c.contradictory_texts,
        }),
      });
      setResult(await r.json());
    } finally {
      setLoading(false);
    }
  }, []);

  if (cases === null) return <Loading />;
  if (!cases.length)
    return <Panel><p className="text-[#5c5c5c]">No showcase cases — run <code className="text-[#1f1f1f]">python build_showcase.py</code>.</p></Panel>;

  const correct = cases.filter((c) => c.correct).length;

  return (
    <>
      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Real cases" value={fmt(cases.length)} accent={C.blue} hint="from training data" />
        <Stat label="Model matched outcome" value={`${correct}/${cases.length}`} accent={C.green} hint="predicted vs. actual" />
        <Stat label="Auto-submit" value={fmt(cases.filter((c) => c.predicted_decision === "AUTO_SUBMIT").length)} accent={C.green} hint="touchless" />
        <Stat label="Blocked" value={fmt(cases.filter((c) => c.predicted_decision === "BLOCK").length)} accent={C.red} hint="caught before submit" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <Panel title="Real PA cases" subtitle="Click a case to score it live — the model never saw the outcome.">
          <div className="space-y-2">
            {cases.map((c) => {
              const active = sel?.case_id === c.case_id && sel?.drug === c.drug;
              return (
                <button
                  key={`${c.drug}-${c.case_id}`}
                  onClick={() => run(c)}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left transition ${
                    active ? "border-[#008f32] bg-[#eefcf4]" : "border-[#e6e6e6] bg-[#f7f9f5] hover:border-[#d6d6d6]"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#0f0f0f]">{c.drug}</span>
                      <span className="truncate text-[11px] text-[#7a7a7a]">{c.payer_name}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#5c5c5c]">
                      <span style={{ color: C.green }}>{c.supportive_texts.length} support</span>
                      ·
                      <span style={{ color: C.red }}>{c.contradictory_texts.length} contradiction</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wide text-[#7a7a7a]">actual</div>
                      <OutcomeBadge label={c.actual_outcome} kind={c.actual_outcome} />
                    </div>
                    <span className="text-base font-bold" style={{ color: RISK_COLORS[c.predicted_level] }}>{c.predicted_risk}%</span>
                    <span title={c.correct ? "Model matched the real outcome" : "Model disagreed"} className="text-sm">
                      {c.correct ? "✅" : "⚠️"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel title="Live scoring">
          {!sel ? (
            <div className="flex h-64 flex-col items-center justify-center text-center text-sm text-[#7a7a7a]">
              <span className="mb-2 text-3xl opacity-40">▶</span>
              Pick a real case on the left to run it through the engine.
            </div>
          ) : loading ? (
            <Loading />
          ) : result ? (
            <div className="animate-fade-up">
              <div className="mb-3 flex items-center justify-between rounded-lg border border-[#e6e6e6] bg-[#f7f9f5] px-3 py-2 text-[12px]">
                <span className="text-[#5c5c5c]">Actual historical outcome</span>
                <OutcomeBadge label={sel.actual_outcome} kind={sel.actual_outcome} />
              </div>
              <Gauge value={result.denial_risk} level={result.risk_level} />
              {result.decision && <DecisionBanner decision={result.decision} reason={result.decision_reason} />}
              <div className="mt-3 rounded-lg border px-3 py-2 text-center text-[12px]"
                style={{ borderColor: sel.correct ? `${C.green}55` : `${C.amber}55`, background: sel.correct ? `${C.green}12` : `${C.amber}12` }}>
                {sel.correct
                  ? `✅ Model agrees with the real outcome (${sel.actual_outcome.toLowerCase()}).`
                  : `⚠️ Model disagreed with the real outcome (${sel.actual_outcome.toLowerCase()}).`}
              </div>
              {result.criteria_match && <CriteriaMatchPanel match={result.criteria_match} />}
              {!!result.risk_factors?.length && (
                <div className="mt-5">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#5c5c5c]">Top risk factors (SHAP)</div>
                  <RiskFactors factors={result.risk_factors} />
                </div>
              )}
              <div className="mt-4 space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-[#5c5c5c]">Recommended fixes</div>
                {result.recommendations.map((r, i) => (
                  <div key={i} className="rounded-lg border border-[#e6e6e6] bg-[#f7f9f5] px-3 py-2.5 text-[13px] leading-relaxed text-[#1f1f1f]">{r}</div>
                ))}
              </div>
            </div>
          ) : null}
        </Panel>
      </div>
    </>
  );
}

/* --------------------------------------------------------------- triage tab */
const TRIAGE_META: Record<string, { label: string; color: string; tag: string }> = {
  MEDICAL_NECESSITY: { label: "Medical necessity", color: C.amber, tag: "addressable" },
  STEP_THERAPY: { label: "Step therapy", color: C.amber, tag: "addressable" },
  NOT_COVERED: { label: "Not covered", color: C.red, tag: "not addressable" },
  OTHER: { label: "Unclear", color: C.muted, tag: "unclear" },
  NO_EVIDENCE: { label: "No reason captured", color: "#661aff", tag: "data gap" },
};

function TriageTab() {
  const [t, setT] = useState<Triage | null>(null);
  useEffect(() => {
    getJSON<Triage>("/api/triage").then(setT).catch(() => setT(null));
  }, []);
  if (t === null) return <Loading />;
  if (!t.counts) return <Panel><p className="text-[#5c5c5c]">No triage data — run <code className="text-[#1f1f1f]">python denial_triage.py</code>.</p></Panel>;

  const order = ["MEDICAL_NECESSITY", "STEP_THERAPY", "NOT_COVERED", "OTHER", "NO_EVIDENCE"];
  const denied = t.denied || 1;
  const noEvidence = t.counts["NO_EVIDENCE"] ?? 0;

  return (
    <>
      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Denials analyzed" value={fmt(t.denied)} accent={C.red} hint={`of ${fmt(t.total)} cases`} />
        <Stat label="Addressable" value={`${t.addressable_pct}%`} accent={C.green} hint={`${fmt(t.addressable)} winnable`} />
        <Stat label="No reason captured" value={`${Math.round((noEvidence / denied) * 100)}%`} accent="#661aff" hint={`${fmt(noEvidence)} denials`} />
        <Stat label="Pts of denial rate winnable" value={`~${Math.round((t.total ? t.denied / t.total : 0) * t.addressable_pct)}`} accent={C.amber} hint="with better evidence" />
      </div>

      <Panel title="Where the denials come from" subtitle="Inferred from RISA's contradictory-fact text (no explicit denial-reason field exists).">
        <div className="space-y-2.5">
          {order.filter((k) => t.counts[k] != null).map((k) => {
            const meta = TRIAGE_META[k] ?? { label: k, color: C.muted, tag: "" };
            const n = t.counts[k];
            const pct = Math.round((n / denied) * 100);
            return (
              <div key={k} className="flex items-center gap-3">
                <span className="w-40 shrink-0 text-[13px] text-[#1f1f1f]">{meta.label}</span>
                <div className="relative h-6 flex-1 overflow-hidden rounded-md bg-[#ededed]">
                  <div className="h-full rounded-md opacity-80" style={{ width: `${pct}%`, background: meta.color }} />
                  <span className="absolute inset-y-0 left-2 flex items-center text-[11px] font-semibold text-white">{pct}%</span>
                </div>
                <span className="w-28 shrink-0 text-right text-[11px] text-[#7a7a7a]">{fmt(n)} · {meta.tag}</span>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title="What this means" subtitle="The opportunity, sized from real data">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-[#84ebb5]/40 bg-[#eefcf4]/40 p-4">
            <div className="text-sm font-semibold text-[#00521d]">≈{t.addressable_pct}% of denials are addressable</div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[#4d4d4d]">
              Medical-necessity and step-therapy denials can be won back with better clinical evidence
              and documented prior trials — exactly what the per-drug criteria checklist targets.
            </p>
          </div>
          <div className="rounded-xl border border-[#661aff]/40 bg-[#f6e5ff]/40 p-4">
            <div className="text-sm font-semibold text-[#661aff]">{Math.round((noEvidence / denied) * 100)}% have no captured reason</div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[#4d4d4d]">
              These denials carry no extracted contradictory evidence — RISA's pipeline didn&apos;t record
              <em className="not-italic text-[#1f1f1f]"> why</em>. A real data-quality gap to close.
            </p>
          </div>
        </div>
      </Panel>
    </>
  );
}

/* ------------------------------------------------------------- criteria tab */
function CriteriaTab() {
  const [drugs, setDrugs] = useState<DrugIndex[] | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [detail, setDetail] = useState<DrugDetail | null>(null);

  useEffect(() => {
    getJSON<DrugIndex[]>("/api/criteria").then((d) => {
      setDrugs(d);
      if (d.length) setSel(d[0].drug);
    }).catch(() => setDrugs([]));
  }, []);

  useEffect(() => {
    if (sel) getJSON<DrugDetail>(`/api/criteria/${encodeURIComponent(sel)}`).then(setDetail).catch(() => setDetail(null));
  }, [sel]);

  if (drugs === null) return <Loading />;
  if (!drugs.length)
    return <Panel><p className="text-[#5c5c5c]">No criteria KB — run <code className="text-[#1f1f1f]">python build_criteria_kb.py</code>.</p></Panel>;

  return (
    <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
      <Panel title="Drugs" subtitle="Mined from history + FDA">
        <div className="scroll-thin max-h-[560px] space-y-1.5 overflow-y-auto">
          {drugs.map((d) => (
            <button
              key={d.drug}
              onClick={() => setSel(d.drug)}
              className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition ${
                sel === d.drug ? "border-[#008f32] bg-[#eefcf4] text-[#00521d]" : "border-[#e6e6e6] bg-[#f7f9f5] text-[#4d4d4d] hover:text-[#0f0f0f]"
              }`}
            >
              <span className="truncate">{d.drug}</span>
              <span className="ml-2 shrink-0 text-[11px] text-[#7a7a7a]">{d.criteria_count}</span>
            </button>
          ))}
        </div>
      </Panel>

      <div>
        {!detail ? (
          <Loading />
        ) : (
          <>
            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat label="Cases" value={fmt(detail.n_cases)} accent={C.blue} />
              <Stat label="Approval rate" value={detail.approval_rate != null ? `${Math.round(detail.approval_rate * 100)}%` : "—"} accent={C.green} />
              <Stat label="Criteria" value={fmt(detail.criteria_count)} accent={C.amber} hint={`${detail.critical_count} critical`} />
              <Stat label="Sources" value={Object.entries(detail.sources).filter(([, v]) => v).length.toString()} accent="#661aff" hint={Object.entries(detail.sources).filter(([, v]) => v).map(([k]) => k).join(", ")} />
            </div>

            {detail.fda?.indications && (
              <Panel title="FDA-approved indication" subtitle={detail.fda.generic_name ? `${detail.fda.generic_name}${detail.fda.route ? ` · ${detail.fda.route}` : ""}` : undefined}>
                <p className="text-[13px] leading-relaxed text-[#4d4d4d]">{detail.fda.indications.slice(0, 600)}{detail.fda.indications.length > 600 ? "…" : ""}</p>
              </Panel>
            )}

            <Panel title="Criteria checklist" subtitle="Each item must be supported by patient evidence before submission.">
              {!detail.criteria.length ? (
                <p className="text-[#5c5c5c]">No recurring criteria mined for this drug (bespoke questionnaires).</p>
              ) : (
                <div className="space-y-2">
                  {detail.criteria.map((c, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg border border-[#e6e6e6] bg-[#f7f9f5] px-3 py-2.5">
                      <span className="mt-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ color: c.source === "fda_label" ? "#008f32" : "#4d4d4d", background: c.source === "fda_label" ? "#008f3222" : "#e6e6e622" }}>
                        {c.source === "fda_label" ? "FDA" : "HIST"}
                      </span>
                      <div className="flex-1">
                        <div className="text-[13px] leading-snug text-[#1f1f1f]">
                          {c.critical && <span className="mr-1 text-[10px] font-bold text-[#c24400]">CRITICAL</span>}
                          {c.statement}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- batch */
const BATCH_SAMPLE = `case_id,drug_class,payer,supportive,contradictory
PA-1001,Brand,Fidelis Care,Diagnosis matches indication,No prior step-therapy documented | Quantity exceeds plan limit
PA-1002,Brand,Aetna Commercial,Failed two preferred agents | Labs support necessity,
PA-1003,Generic,WellCare,,Required biomarker test not in record | Not medically necessary
PA-1004,Brand,Cigna,Diagnosis matches indication | Prior therapy documented,Outdated labs over 6 months old
PA-1005,Brand,UnitedHealthcare,Strong clinical rationale provided,`;

type ParsedCase = {
  case_id: string;
  medication_class: string;
  payer_name: string;
  supportive_texts: string[];
  contradictory_texts: string[];
};

function parseBatch(text: string): ParsedCase[] {
  const rows = text.trim().split("\n").filter(Boolean);
  if (!rows.length) return [];
  const out: ParsedCase[] = [];
  // skip header if present
  const start = /case_id/i.test(rows[0]) ? 1 : 0;
  const splitFacts = (s: string) =>
    (s ?? "").split("|").map((x) => x.trim()).filter(Boolean);
  for (let i = start; i < rows.length; i++) {
    const c = rows[i].split(",");
    out.push({
      case_id: (c[0] ?? `case-${i}`).trim(),
      medication_class: (c[1] ?? "Brand").trim() || "Brand",
      payer_name: (c[2] ?? "").trim(),
      supportive_texts: splitFacts(c[3] ?? ""),
      contradictory_texts: splitFacts(c[4] ?? ""),
    });
  }
  return out;
}

function Batch() {
  const [text, setText] = useState(BATCH_SAMPLE);
  const [res, setRes] = useState<BatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const parsed = parseBatch(text);

  const run = useCallback(async () => {
    setLoading(true);
    try {
      const cases = parsed.map((p) => ({
        case_id: p.case_id,
        medication_class: p.medication_class,
        payer_name: p.payer_name,
        total_questions: p.supportive_texts.length + p.contradictory_texts.length || 1,
        answered_questions: p.supportive_texts.length + p.contradictory_texts.length || 1,
        supportive_facts: p.supportive_texts.length,
        contradictory_facts: p.contradictory_texts.length,
        supportive_texts: p.supportive_texts,
        contradictory_texts: p.contradictory_texts,
      }));
      const r = await fetch("/api/predict-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cases }),
      });
      setRes(await r.json());
    } finally {
      setLoading(false);
    }
  }, [parsed]);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
      <Panel
        title="Score a queue of PAs"
        subtitle="One case per row: case_id, drug_class, payer, supportive, contradictory. Separate multiple facts with “|”."
      >
        <textarea
          rows={12}
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          className="scroll-thin w-full resize-y rounded-xl border border-[#e6e6e6] bg-[#ffffff] px-3 py-2.5 font-mono text-[12px] leading-relaxed outline-none focus:border-[#008f32]"
        />
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={run}
            disabled={loading || !parsed.length}
            className="rounded-xl bg-gradient-to-r from-[#008f32] to-[#1db954] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {loading ? "Scoring…" : `Score ${parsed.length} cases`}
          </button>
          <button
            onClick={() => setText(BATCH_SAMPLE)}
            className="rounded-xl border border-[#e6e6e6] bg-[#f7f9f5] px-3 py-2.5 text-xs text-[#4d4d4d] hover:text-[#0f0f0f]"
          >
            Reset sample
          </button>
        </div>
      </Panel>

      <Panel title="Portfolio result">
        {!res ? (
          <div className="flex h-64 flex-col items-center justify-center text-center text-sm text-[#7a7a7a]">
            <span className="mb-2 text-3xl opacity-40">▦</span>
            Paste a queue of PAs and score them to see the risk distribution.
          </div>
        ) : (
          <div className="animate-fade-up">
            <div className="mb-4 grid grid-cols-3 gap-3">
              <Stat label="Touchless" value={`${res.touchless_rate}%`} accent={C.green} hint={`${res.routing?.AUTO_SUBMIT ?? 0} auto-submit`} />
              <Stat label="Needs human" value={fmt(res.needs_human)} accent={C.amber} hint={`of ${res.count}`} />
              <Stat label="Avg risk" value={`${res.avg_risk}%`} accent={C.blue} />
            </div>
            <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-[#7a7a7a]">Routing</div>
            <div className="mb-4 flex h-3 overflow-hidden rounded-full">
              {(["AUTO_SUBMIT", "REVIEW", "BLOCK"] as const).map((d) => {
                const n = res.routing?.[d] ?? 0;
                const w = (n / (res.count || 1)) * 100;
                return w ? (
                  <div key={d} style={{ width: `${w}%`, background: DECISION_META[d].color }} title={`${DECISION_META[d].label}: ${n}`} />
                ) : null;
              })}
            </div>
            <div className="scroll-thin max-h-72 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-[#7a7a7a]">
                    {["Case", "Risk", "Routing", "Top factor"].map((h) => (
                      <th key={h} className="sticky top-0 border-b border-[#e6e6e6] bg-[#ffffff] px-2 py-2 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {res.results.map((r) => {
                    const dm = DECISION_META[r.decision] ?? DECISION_META.REVIEW;
                    return (
                      <tr key={r.case_id} className="hover:bg-[#f7f9f5]">
                        <td className="border-b border-[#ededed] px-2 py-2 text-[#1f1f1f]">{r.case_id}</td>
                        <td className="border-b border-[#ededed] px-2 py-2 font-semibold" style={{ color: RISK_COLORS[r.risk_level] }}>{r.denial_risk}%</td>
                        <td className="border-b border-[#ededed] px-2 py-2">
                          <span className="rounded-md px-2 py-0.5 text-[11px] font-semibold" style={{ color: dm.color, background: `${dm.color}1f` }}>{dm.icon} {r.decision.replace("_", " ")}</span>
                        </td>
                        <td className="border-b border-[#ededed] px-2 py-2 text-[11px] text-[#4d4d4d]">{r.top_factor ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ impact */
const money = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`;

function ImpactTab() {
  const [impact, setImpact] = useState<Impact | null>(null);
  useEffect(() => {
    getJSON<Impact>("/api/impact").then(setImpact).catch(() => setImpact(null));
  }, []);
  if (impact === null) return <Loading />;
  const a = impact.assumptions;

  return (
    <>
      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Denials today" value={fmt(impact.denials_today)} accent={C.red} hint="per year" />
        <Stat label="Year-1 net benefit" value={money(impact.year1_net_benefit)} accent={C.green} hint="target scenario" />
        <Stat label="ROI" value={`${impact.roi_multiple}×`} accent={C.amber} hint={`vs ${money(impact.implementation_cost)} cost`} />
        <Stat label="Model recall" value={`${a.model_recall_pct}%`} accent={C.blue} hint="denials caught" />
      </div>

      <Panel title="Two scenarios, honestly labeled" subtitle="The stated 60%→95% goal vs. what this model conservatively delivers today.">
        <div className="grid gap-4 md:grid-cols-2">
          {impact.scenarios.map((s, i) => (
            <div key={s.label} className="rounded-xl border border-[#e6e6e6] bg-[#f7f9f5] p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold" style={{ color: i === 0 ? C.green : C.blue }}>{s.label}</span>
                <span className="rounded-full border border-[#e6e6e6] px-2 py-0.5 text-[11px] text-[#4d4d4d]">
                  → {s.new_approval_rate_pct}% approval
                </span>
              </div>
              <p className="mt-1.5 text-[12px] leading-relaxed text-[#5c5c5c]">{s.note}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <KV k="Denials avoided" v={fmt(s.denials_avoided)} />
                <KV k="Annual benefit" v={money(s.total_annual_benefit)} />
                <KV k="Revenue gain" v={money(s.revenue_gain)} />
                <KV k="Rework savings" v={money(s.rework_savings)} />
                <KV k="Patient-days saved" v={fmt(s.patient_days_saved)} />
                <KV k="Staff hours saved" v={fmt(s.staff_hours_saved)} />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Assumptions" subtitle="Every number above is derived from these inputs (config.py) — fully auditable.">
        <div className="flex flex-wrap gap-2 text-[11px] text-[#5c5c5c]">
          <Chip>{fmt(a.annual_pa_volume)} PAs/yr</Chip>
          <Chip>{a.current_approval_rate_pct}% → {a.target_approval_rate_pct}% approval</Chip>
          <Chip>{money(a.revenue_per_approval)}/approval</Chip>
          <Chip>{a.rework_minutes_per_case} min rework @ {money(a.staff_hourly_rate)}/hr</Chip>
          <Chip>{a.avg_delay_days}-day denial delay</Chip>
          <Chip>{a.preventable_share_pct}% preventable</Chip>
          <Chip>{a.fix_success_rate_pct}% fix rate</Chip>
        </div>
      </Panel>
    </>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[#e6e6e6] bg-[#ffffff] px-3 py-2">
      <span className="text-[12px] text-[#5c5c5c]">{k}</span>
      <span className="text-[13px] font-semibold text-[#1f1f1f]">{v}</span>
    </div>
  );
}

/* ----------------------------------------------------------------- patterns */
function Patterns({ stats }: { stats: Segment[] }) {
  const top = [...stats]
    .sort((a, b) => b.denial_rate - a.denial_rate)
    .slice(0, 15)
    .map((r) => ({ name: `${r.medication_class ?? "?"} · ${r.payer_name ?? "?"}`, denial_rate: r.denial_rate }));

  return (
    <>
      <Panel title="Denial rate by drug class & payer" subtitle="Top 15 highest-risk segments">
        <div style={{ width: "100%", height: 480 }}>
          <ResponsiveContainer>
            <BarChart data={top} layout="vertical" margin={{ left: 12, right: 28, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e6e6e6" horizontal={false} />
              <XAxis type="number" stroke={C.muted} domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" stroke={C.muted} width={240} tick={{ fontSize: 11 }} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(0,0,0,0.04)" }} formatter={(v) => [`${v}%`, "Denial rate"]} />
              <Bar dataKey="denial_rate" radius={[0, 6, 6, 0]}>
                {top.map((d, i) => (
                  <Cell key={i} fill={`rgba(204,3,0,${0.3 + (d.denial_rate / 100) * 0.55})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
      <Panel title="Full table">
        <SegmentTable rows={stats} />
      </Panel>
    </>
  );
}

function SegmentTable({ rows }: { rows: Segment[] }) {
  if (!rows.length) return <p className="text-[#5c5c5c]">No data.</p>;
  return (
    <div className="scroll-thin overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-[#7a7a7a]">
            {["Drug class", "Payer", "Cases", "Denials", "Denial rate"].map((h) => (
              <th key={h} className="border-b border-[#e6e6e6] px-3 py-2 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-[#f7f9f5]">
              <td className="border-b border-[#ededed] px-3 py-2">{r.medication_class ?? "—"}</td>
              <td className="border-b border-[#ededed] px-3 py-2">{r.payer_name || "—"}</td>
              <td className="border-b border-[#ededed] px-3 py-2 text-[#4d4d4d]">{fmt(r.total_cases)}</td>
              <td className="border-b border-[#ededed] px-3 py-2 text-[#4d4d4d]">{fmt(r.denials)}</td>
              <td className="border-b border-[#ededed] px-3 py-2">
                <span
                  className="rounded-md px-2 py-0.5 text-xs font-semibold"
                  style={{
                    color: r.denial_rate >= 50 ? C.red : r.denial_rate >= 35 ? C.amber : C.green,
                    background: `${r.denial_rate >= 50 ? C.red : r.denial_rate >= 35 ? C.amber : C.green}1f`,
                  }}
                >
                  {r.denial_rate}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ----------------------------------------------------------------- audit */
function Audit() {
  const [rows, setRows] = useState<AuditRow[] | null>(null);
  useEffect(() => {
    getJSON<AuditRow[]>("/api/audit").then(setRows).catch(() => setRows([]));
  }, []);
  if (rows === null) return <Loading />;

  return (
    <Panel title="Prediction audit trail" subtitle="Only de-identified prediction metadata is persisted (STORAGE_BACKEND=local | firestore | bigquery).">
      {!rows.length ? (
        <p className="text-[#5c5c5c]">No predictions logged yet — score a case in the Predict tab.</p>
      ) : (
        <div className="scroll-thin overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-[#7a7a7a]">
                {Object.keys(rows[0]).map((k) => (
                  <th key={k} className="border-b border-[#e6e6e6] px-3 py-2 font-medium">{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="hover:bg-[#f7f9f5]">
                  {Object.keys(rows[0]).map((k) => (
                    <td key={k} className="border-b border-[#ededed] px-3 py-2 text-[#4d4d4d]">
                      {Array.isArray(row[k]) ? (row[k] as unknown[]).join("; ") : String(row[k] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

function Loading() {
  return (
    <div className="flex h-40 items-center justify-center text-sm text-[#7a7a7a]">
      <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-[#008f32] border-t-transparent" />
      Loading…
    </div>
  );
}
