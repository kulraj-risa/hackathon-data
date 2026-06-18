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

type PredictResult = {
  denial_risk: number;
  risk_level: "HIGH" | "MEDIUM" | "LOW";
  recommendations: string[];
  record_id?: string;
  model?: string;
  model_auc?: number;
};

type AuditRow = Record<string, unknown>;

const TABS = ["Overview", "Risk Insights", "Predict", "Patterns", "Audit"] as const;
type Tab = (typeof TABS)[number];

const C = {
  blue: "#5b8cff",
  green: "#3ddc97",
  amber: "#ffb454",
  red: "#ff5d6c",
  muted: "#8b97b5",
  border: "#233056",
  panel: "#0e1424",
  panel2: "#131c33",
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
  color: "#e7ecf5",
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
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#5b8cff] to-[#7b5bff] text-lg shadow-lg shadow-[#5b8cff]/20">
                ⚕
              </span>
              <h1 className="bg-gradient-to-r from-white to-[#aab8e0] bg-clip-text text-2xl font-bold text-transparent">
                RISA Denial Prevention Engine
              </h1>
            </div>
            <p className="mt-1.5 text-sm text-[#8b97b5]">
              Catch pharmacy prior-auth denials <em className="not-italic text-[#cdd6ee]">before</em> submission
              — turn the evidence RISA already extracts into a go / no-go signal.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-[#1f7a52] bg-[#0f2a20] px-3 py-1.5 text-xs font-semibold text-[#3ddc97]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#3ddc97]" />
              Model live{auc ? ` · AUC ${auc}` : ""}
            </span>
          </div>
        </div>
      </header>

      {/* tabs */}
      <nav className="sticky top-0 z-10 -mx-5 flex flex-wrap gap-2 border-b border-[#1b2540] bg-[#080c18]/85 px-5 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
              tab === t
                ? "border-[#5b8cff] bg-[#16203c] text-white shadow-sm shadow-[#5b8cff]/20"
                : "border-transparent bg-[#0e1424] text-[#8b97b5] hover:border-[#233056] hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </nav>

      <main key={tab} className="animate-fade-up pt-6">
        {tab === "Overview" && <Overview summary={summary} insights={insights} />}
        {tab === "Risk Insights" && <RiskInsights insights={insights} />}
        {tab === "Predict" && <Predict />}
        {tab === "Patterns" && <Patterns stats={stats} />}
        {tab === "Audit" && <Audit />}
      </main>

      <footer className="mt-14 border-t border-[#1b2540] pt-5 text-xs text-[#6b7799]">
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
      className={`mb-5 rounded-2xl border border-[#1f2a49] bg-[#0e1424]/80 p-5 shadow-xl shadow-black/20 ${className}`}
    >
      {title && <h2 className="text-base font-semibold text-white">{title}</h2>}
      {subtitle && <p className="mt-1 mb-3 text-sm text-[#8b97b5]">{subtitle}</p>}
      {!subtitle && title && <div className="mb-3" />}
      {children}
    </section>
  );
}

function Stat({ label, value, accent, hint }: { label: string; value: string; accent: string; hint?: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-[#1f2a49] bg-[#121a30] p-4">
      <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: accent }} />
      <div className="text-xs font-medium text-[#8b97b5]">{label}</div>
      <div className="mt-1.5 text-2xl font-bold tracking-tight" style={{ color: accent }}>
        {value}
      </div>
      {hint && <div className="mt-0.5 text-[11px] text-[#6b7799]">{hint}</div>}
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
    ["With questionnaire", empty ? "—" : fmt(summary.cases_with_questionnaire), "#7b5bff"],
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
              <p className="mt-3 text-sm text-[#8b97b5]">
                Adding the <strong className="text-[#cdd6ee]">evidence-text channel</strong> (the supportive /
                contradictory facts RISA already produces) lifted ROC-AUC from{" "}
                <span className="text-[#ff9b6c]">{m.baseline_auc}</span> →{" "}
                <span className="text-[#3ddc97]">{m.roc_auc}</span> — the facts are by far the dominant signal.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 self-start">
              <Metric label="Precision" value={m.precision} />
              <Metric label="Recall" value={m.recall} />
              <Metric label="F1 score" value={m.f1} />
              <Metric label="Accuracy" value={m.accuracy} />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-[#8b97b5]">
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
            <div key={h} className="rounded-xl border border-[#1f2a49] bg-[#121a30] p-4">
              <div className="text-sm font-semibold" style={{ color: accent }}>{h}</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[#9aa6c0]">{body}</p>
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
          <p className="text-[#8b97b5]">
            No app data found. Run <code className="text-[#cdd6ee]">python build_app_data.py</code> and{" "}
            <code className="text-[#cdd6ee]">python build_insights.py</code> locally.
          </p>
        </Panel>
      )}
    </>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[#1f2a49] bg-[#0e1424] p-3 text-center">
      <div className="text-2xl font-bold text-white">{(value * 100).toFixed(0)}%</div>
      <div className="text-[11px] text-[#8b97b5]">{label}</div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-[#233056] bg-[#121a30] px-2.5 py-1">{children}</span>
  );
}

function AucBar({ baseline, current }: { baseline: number; current: number }) {
  const row = (label: string, v: number, color: string) => (
    <div className="mb-2.5">
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-[#8b97b5]">{label}</span>
        <span className="font-semibold" style={{ color }}>{v.toFixed(3)}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#1a2238]">
        <div className="h-full rounded-full" style={{ width: `${v * 100}%`, background: color }} />
      </div>
    </div>
  );
  return (
    <div>
      {row("Numeric-only (baseline)", baseline, "#ff9b6c")}
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
        <p className="text-[#8b97b5]">
          No insights yet. Run <code className="text-[#cdd6ee]">python build_insights.py</code> locally.
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
          <CartesianGrid strokeDasharray="3 3" stroke="#1c2742" vertical={false} />
          <XAxis dataKey="bucket" stroke={C.muted} tick={{ fontSize: 12 }} tickLine={false} />
          <YAxis stroke={C.muted} tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            formatter={(value, _name, item) => {
              const b = item?.payload as Bucket | undefined;
              return [`${value}%  ·  ${fmt(b?.cases)} cases`, "Denial rate"];
            }}
          />
          <Bar dataKey="denial_rate" radius={[6, 6, 0, 0]} maxBarSize={64}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.denial_rate >= base ? color : "#445074"} />
            ))}
            <LabelList dataKey="denial_rate" position="top" formatter={(v) => `${v}%`} fill="#cdd6ee" fontSize={11} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function TermList({ terms, color, base }: { terms: Term[]; color: string; base: number }) {
  if (!terms.length) return <p className="text-[#8b97b5]">No terms.</p>;
  const max = Math.max(...terms.map((t) => t.denial_rate), 100);
  return (
    <div className="space-y-2.5">
      {terms.map((t) => (
        <div key={t.term} className="flex items-center gap-3">
          <code className="w-40 shrink-0 truncate text-[13px] text-[#cdd6ee]" title={t.term}>
            {t.term}
          </code>
          <div className="relative h-6 flex-1 overflow-hidden rounded-md bg-[#1a2238]">
            <div className="h-full rounded-md opacity-80" style={{ width: `${(t.denial_rate / max) * 100}%`, background: color }} />
            <span className="absolute inset-y-0 right-2 flex items-center text-[11px] font-semibold text-white">
              {t.denial_rate}%
            </span>
          </div>
          <span className="w-20 shrink-0 text-right text-[11px] text-[#6b7799]">{fmt(t.cases)} cases</span>
        </div>
      ))}
      <p className="pt-1 text-[11px] text-[#6b7799]">Baseline denial rate: {base}%</p>
    </div>
  );
}

/* ----------------------------------------------------------------- predict */
type Form = {
  medClass: string;
  payer: string;
  totalQ: number;
  answeredQ: number;
  supText: string;
  conText: string;
};

const PRESETS: Record<string, Form> = {
  "Clean case": {
    medClass: "Brand",
    payer: "Aetna Commercial",
    totalQ: 8,
    answeredQ: 8,
    supText: [
      "Patient diagnosis matches the FDA-approved indication for the drug.",
      "Documented trial and failure of two preferred first-line agents.",
      "Baseline labs and staging support medical necessity.",
    ].join("\n"),
    conText: "",
  },
  "Conflicted case": {
    medClass: "Brand",
    payer: "Fidelis Care",
    totalQ: 10,
    answeredQ: 8,
    supText: "Patient diagnosis matches the approved indication.",
    conText: [
      "No documentation of prior step-therapy with a preferred agent.",
      "Requested quantity exceeds the plan's maximum days-supply limit.",
      "Required PD-L1 biomarker test result not found in the record.",
    ].join("\n"),
  },
  "No questionnaire": {
    medClass: "Unknown",
    payer: "Aetna Commercial",
    totalQ: 0,
    answeredQ: 0,
    supText: "",
    conText: "",
  },
};

const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);

function Predict() {
  const [form, setForm] = useState<Form>(PRESETS["Conflicted case"]);
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
      <span className="mb-1.5 block text-xs font-medium text-[#8b97b5]">{label}</span>
      <input
        type="number"
        min={0}
        value={form[k]}
        onChange={(e) => set(k, Number(e.target.value))}
        className="w-full rounded-xl border border-[#233056] bg-[#0b1020] px-3 py-2.5 text-sm outline-none focus:border-[#5b8cff]"
      />
    </label>
  );

  const facts = (k: "supText" | "conText", label: string, accent: string, hint: string) => (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-2 text-xs font-medium text-[#8b97b5]">
        <span className="h-2 w-2 rounded-full" style={{ background: accent }} />
        {label}
      </span>
      <textarea
        rows={5}
        value={form[k]}
        placeholder={hint}
        onChange={(e) => set(k, e.target.value)}
        className="w-full resize-y rounded-xl border border-[#233056] bg-[#0b1020] px-3 py-2.5 text-[13px] leading-relaxed outline-none focus:border-[#5b8cff]"
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
              className="rounded-lg border border-[#233056] bg-[#121a30] px-3 py-1.5 text-xs text-[#9aa6c0] transition hover:border-[#5b8cff] hover:text-white"
            >
              {name}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-[#8b97b5]">Drug class</span>
            <input
              value={form.medClass}
              onChange={(e) => set("medClass", e.target.value)}
              className="w-full rounded-xl border border-[#233056] bg-[#0b1020] px-3 py-2.5 text-sm outline-none focus:border-[#5b8cff]"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-[#8b97b5]">Payer</span>
            <input
              value={form.payer}
              onChange={(e) => set("payer", e.target.value)}
              className="w-full rounded-xl border border-[#233056] bg-[#0b1020] px-3 py-2.5 text-sm outline-none focus:border-[#5b8cff]"
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
          className="mt-4 w-full rounded-xl bg-gradient-to-r from-[#5b8cff] to-[#7b5bff] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60 sm:w-auto"
        >
          {loading ? "Analyzing…" : "Analyze case"}
        </button>
      </Panel>

      <Panel title="Result">
        {!result ? (
          <div className="flex h-64 flex-col items-center justify-center text-center text-sm text-[#6b7799]">
            <span className="mb-2 text-3xl opacity-40">◔</span>
            Enter a case and hit <span className="mx-1 text-[#9aa6c0]">Analyze</span> to score it.
          </div>
        ) : (
          <div className="animate-fade-up">
            <Gauge value={result.denial_risk} level={result.risk_level} />
            <div className="mt-4 space-y-2">
              {result.recommendations.map((r, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-[#233056] bg-[#121a30] px-3 py-2.5 text-[13px] leading-relaxed text-[#cdd6ee]"
                >
                  {r}
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-[#6b7799]">
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
          <circle cx="80" cy="80" r={R} fill="none" stroke="#1a2238" strokeWidth="14" />
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
          <span className="text-4xl font-extrabold text-white">{value}%</span>
          <span className="text-[11px] uppercase tracking-wider text-[#8b97b5]">denial risk</span>
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
              <CartesianGrid strokeDasharray="3 3" stroke="#1c2742" horizontal={false} />
              <XAxis type="number" stroke={C.muted} domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" stroke={C.muted} width={240} tick={{ fontSize: 11 }} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} formatter={(v) => [`${v}%`, "Denial rate"]} />
              <Bar dataKey="denial_rate" radius={[0, 6, 6, 0]}>
                {top.map((d, i) => (
                  <Cell key={i} fill={`rgba(255,93,108,${0.35 + (d.denial_rate / 100) * 0.55})`} />
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
  if (!rows.length) return <p className="text-[#8b97b5]">No data.</p>;
  return (
    <div className="scroll-thin overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-[#6b7799]">
            {["Drug class", "Payer", "Cases", "Denials", "Denial rate"].map((h) => (
              <th key={h} className="border-b border-[#233056] px-3 py-2 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-[#121a30]">
              <td className="border-b border-[#1a2238] px-3 py-2">{r.medication_class ?? "—"}</td>
              <td className="border-b border-[#1a2238] px-3 py-2">{r.payer_name || "—"}</td>
              <td className="border-b border-[#1a2238] px-3 py-2 text-[#9aa6c0]">{fmt(r.total_cases)}</td>
              <td className="border-b border-[#1a2238] px-3 py-2 text-[#9aa6c0]">{fmt(r.denials)}</td>
              <td className="border-b border-[#1a2238] px-3 py-2">
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
        <p className="text-[#8b97b5]">No predictions logged yet — score a case in the Predict tab.</p>
      ) : (
        <div className="scroll-thin overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-[#6b7799]">
                {Object.keys(rows[0]).map((k) => (
                  <th key={k} className="border-b border-[#233056] px-3 py-2 font-medium">{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="hover:bg-[#121a30]">
                  {Object.keys(rows[0]).map((k) => (
                    <td key={k} className="border-b border-[#1a2238] px-3 py-2 text-[#9aa6c0]">
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
    <div className="flex h-40 items-center justify-center text-sm text-[#6b7799]">
      <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-[#5b8cff] border-t-transparent" />
      Loading…
    </div>
  );
}
