"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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

type PredictResult = {
  denial_risk: number;
  risk_level: "HIGH" | "MEDIUM" | "LOW";
  recommendations: string[];
  record_id?: string;
  model?: string;
};

type AuditRow = Record<string, unknown>;

const TABS = ["Overview", "Denial Patterns", "Predict", "Audit Log"] as const;
type Tab = (typeof TABS)[number];

const fmt = (n: number | undefined) => (n ?? 0).toLocaleString();

async function getJSON<T>(url: string): Promise<T> {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return r.json();
}

const RISK_COLORS: Record<string, string> = {
  HIGH: "#ff5d6c",
  MEDIUM: "#ffb454",
  LOW: "#3ddc97",
};

export default function Page() {
  const [tab, setTab] = useState<Tab>("Overview");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [stats, setStats] = useState<Segment[]>([]);

  useEffect(() => {
    getJSON<Summary>("/api/summary").then(setSummary).catch(() => setSummary({}));
    getJSON<Segment[]>("/api/denial-stats").then(setStats).catch(() => setStats([]));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-6 pb-16">
      <header className="border-b border-[#263255] pt-8 pb-4">
        <h1 className="text-2xl font-bold">🏥 RISA Denial Prevention Engine</h1>
        <p className="mt-1 text-sm text-[#9aa6c0]">
          Predict pharmacy PA denials before submission · target 60% → 95% approval
        </p>
      </header>

      <nav className="flex flex-wrap gap-2 pt-4">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-xl border px-4 py-2 text-sm transition ${
              tab === t
                ? "border-[#5b8cff] bg-[#1b2340] text-white"
                : "border-[#263255] bg-[#141a2e] text-[#9aa6c0] hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </nav>

      <main className="pt-6">
        {tab === "Overview" && <Overview summary={summary} />}
        {tab === "Denial Patterns" && <Patterns stats={stats} />}
        {tab === "Predict" && <Predict />}
        {tab === "Audit Log" && <Audit />}
      </main>

      <footer className="mt-12 border-t border-[#263255] pt-5 text-xs text-[#9aa6c0]">
        🏆 RISA Hackathon 2026 · de-identified data · Next.js + FastAPI on rapids-platform (Cloud Run)
      </footer>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-5 rounded-2xl border border-[#263255] bg-[#141a2e] p-5">
      {children}
    </div>
  );
}

function Overview({ summary }: { summary: Summary | null }) {
  if (summary === null) return <p className="text-[#9aa6c0]">Loading…</p>;
  if (!Object.keys(summary).length)
    return (
      <Panel>
        <p className="text-[#9aa6c0]">
          No app data. Run <code>python build_app_data.py</code> locally first.
        </p>
      </Panel>
    );

  const cards: [string, string][] = [
    ["Cases analyzed", fmt(summary.total_cases)],
    ["Approval rate", `${summary.approval_rate_pct ?? 0}%`],
    ["With questionnaire", fmt(summary.cases_with_questionnaire)],
    ["Avg questions / case", `${summary.avg_questions ?? 0}`],
  ];

  return (
    <>
      <Panel>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {cards.map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-[#263255] bg-[#1b2340] p-4"
            >
              <div className="text-xs text-[#9aa6c0]">{label}</div>
              <div className="mt-1 text-2xl font-bold">{value}</div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel>
        <h2 className="mb-3 text-base font-semibold">
          Highest-risk segments (drug class × payer)
        </h2>
        <SegmentTable rows={summary.top_denial_segments ?? []} />
      </Panel>
    </>
  );
}

function Patterns({ stats }: { stats: Segment[] }) {
  const top = [...stats]
    .sort((a, b) => b.denial_rate - a.denial_rate)
    .slice(0, 15)
    .map((r) => ({
      name: `${r.medication_class ?? "?"} · ${r.payer_name ?? "?"}`,
      denial_rate: r.denial_rate,
    }));

  return (
    <>
      <Panel>
        <h2 className="mb-3 text-base font-semibold">
          Denial rate by drug class &amp; payer (top 15)
        </h2>
        <div style={{ width: "100%", height: 480 }}>
          <ResponsiveContainer>
            <BarChart
              data={top}
              layout="vertical"
              margin={{ left: 12, right: 24, top: 8, bottom: 8 }}
            >
              <XAxis type="number" stroke="#9aa6c0" domain={[0, 100]} unit="%" />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#9aa6c0"
                width={260}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  background: "#1b2340",
                  border: "1px solid #263255",
                  borderRadius: 10,
                  color: "#e7ecf5",
                }}
                formatter={(v) => [`${v}%`, "Denial rate"]}
              />
              <Bar dataKey="denial_rate" radius={[0, 6, 6, 0]}>
                {top.map((d, i) => (
                  <Cell
                    key={i}
                    fill={`rgba(255,93,108,${0.35 + (d.denial_rate / 100) * 0.55})`}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
      <Panel>
        <h2 className="mb-3 text-base font-semibold">Full table</h2>
        <SegmentTable rows={stats} />
      </Panel>
    </>
  );
}

function SegmentTable({ rows }: { rows: Segment[] }) {
  if (!rows.length) return <p className="text-[#9aa6c0]">No data.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[#9aa6c0]">
            <th className="border-b border-[#263255] px-3 py-2">Drug class</th>
            <th className="border-b border-[#263255] px-3 py-2">Payer</th>
            <th className="border-b border-[#263255] px-3 py-2">Cases</th>
            <th className="border-b border-[#263255] px-3 py-2">Denials</th>
            <th className="border-b border-[#263255] px-3 py-2">Denial rate %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="border-b border-[#263255] px-3 py-2">{r.medication_class ?? "—"}</td>
              <td className="border-b border-[#263255] px-3 py-2">{r.payer_name || "—"}</td>
              <td className="border-b border-[#263255] px-3 py-2">{r.total_cases}</td>
              <td className="border-b border-[#263255] px-3 py-2">{r.denials}</td>
              <td className="border-b border-[#263255] px-3 py-2">{r.denial_rate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Predict() {
  const [medClass, setMedClass] = useState("Brand");
  const [payer, setPayer] = useState("Aetna Commercial");
  const [result, setResult] = useState<PredictResult | null>(null);
  const [loading, setLoading] = useState(false);

  const analyze = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medication_class: medClass,
          payer_name: payer,
          case_id: "demo",
        }),
      });
      setResult(await r.json());
    } finally {
      setLoading(false);
    }
  }, [medClass, payer]);

  return (
    <Panel>
      <h2 className="mb-2 text-base font-semibold">Single-case denial risk</h2>
      <p className="mb-4 text-sm text-[#9aa6c0]">
        🚧 Inference is a placeholder until the trained model is wired in. Training
        runs offline (local / Vertex AI); this service only serves. Submitting logs a
        de-identified record to the audit store.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm text-[#9aa6c0]">Drug class</span>
          <input
            value={medClass}
            onChange={(e) => setMedClass(e.target.value)}
            className="w-full rounded-xl border border-[#263255] bg-[#0b1020] px-3 py-2.5 text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm text-[#9aa6c0]">Payer</span>
          <input
            value={payer}
            onChange={(e) => setPayer(e.target.value)}
            className="w-full rounded-xl border border-[#263255] bg-[#0b1020] px-3 py-2.5 text-sm"
          />
        </label>
      </div>
      <button
        onClick={analyze}
        disabled={loading}
        className="mt-4 rounded-xl bg-[#5b8cff] px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
      >
        {loading ? "Analyzing…" : "Analyze"}
      </button>

      {result && (
        <div className="mt-5">
          <div className="flex items-center gap-3">
            <span className="text-4xl font-extrabold">{result.denial_risk}%</span>
            <span
              className="rounded-full px-3 py-1 text-xs font-bold"
              style={{
                color: RISK_COLORS[result.risk_level],
                background: `${RISK_COLORS[result.risk_level]}26`,
              }}
            >
              {result.risk_level}
            </span>
          </div>
          <ul className="mt-3 list-disc pl-5 text-sm text-[#9aa6c0]">
            {result.recommendations.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-[#9aa6c0]">
            Logged to audit store (record_id={(result.record_id ?? "").slice(0, 8)}… ·
            model={result.model})
          </p>
        </div>
      )}
    </Panel>
  );
}

function Audit() {
  const [rows, setRows] = useState<AuditRow[] | null>(null);

  useEffect(() => {
    getJSON<AuditRow[]>("/api/audit").then(setRows).catch(() => setRows([]));
  }, []);

  if (rows === null) return <p className="text-[#9aa6c0]">Loading…</p>;

  return (
    <Panel>
      <h2 className="mb-2 text-base font-semibold">Prediction audit trail</h2>
      <p className="mb-3 text-sm text-[#9aa6c0]">
        Only de-identified prediction metadata is persisted (set
        STORAGE_BACKEND=firestore|bigquery to switch).
      </p>
      {!rows.length ? (
        <p className="text-[#9aa6c0]">No predictions logged yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[#9aa6c0]">
                {Object.keys(rows[0]).map((k) => (
                  <th key={k} className="border-b border-[#263255] px-3 py-2">{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  {Object.keys(rows[0]).map((k) => (
                    <td key={k} className="border-b border-[#263255] px-3 py-2">
                      {Array.isArray(row[k])
                        ? (row[k] as unknown[]).join("; ")
                        : String(row[k] ?? "")}
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
