import { useEffect, useMemo, useState } from "react";
import {
  AnswerPacket,
  answerQuestionnaire,
  CriteriaMatch,
  EngineDecision,
  FilingQueueCase,
  getFilingQueue,
  getShowcase,
  PredictResult,
  predictCase,
  ShowcaseCase,
  showcaseToFilingCase,
} from "../../../api/denialEngine";

interface ScoredRow extends FilingQueueCase {
  result?: PredictResult;
  error?: boolean;
}

type Mode = "live" | "validation";

const riskTone = (risk: number) => {
  if (risk >= 60) return { text: "text-tertiaryRed-3", chip: "bg-tertiaryRed-11 text-tertiaryRed-2" };
  if (risk >= 30) return { text: "text-secondaryOrange-3", chip: "bg-secondaryOrange-12 text-secondaryOrange-2" };
  return { text: "text-primaryGreen-3", chip: "bg-primaryGreen-11 text-primaryGreen-2" };
};

const approvalPct = (denialRisk: number) => Math.max(0, Math.min(100, Math.round(100 - denialRisk)));

const criteriaByStatus = (cm: CriteriaMatch | null | undefined, met: boolean): string[] => {
  const items = Array.isArray(cm?.criteria) ? cm!.criteria! : [];
  return items
    .filter((c) => (met ? c.status === "MET" : c.status !== "MET"))
    .map((c) => c.statement);
};

const statusMeta: Record<string, { dot: string; label: string }> = {
  MET: { dot: "text-primaryGreen-3", label: "Supported" },
  AT_RISK: { dot: "text-tertiaryRed-3", label: "Contradicted" },
  UNVERIFIED: { dot: "text-secondaryOrange-3", label: "Needs docs" },
};

const workflowMeta: Record<
  EngineDecision,
  { status: string; statusChip: string; action: string; actionChip: string }
> = {
  AUTO_SUBMIT: {
    status: "Ready to file",
    statusChip: "bg-primaryGreen-11 text-primaryGreen-2 border border-primaryGreen-9",
    action: "Send to Plan",
    actionChip: "bg-primaryGreen-3 text-white",
  },
  REVIEW: {
    status: "Needs review",
    statusChip: "bg-secondaryOrange-12 text-secondaryOrange-2 border border-secondaryOrange-9",
    action: "View Clinical",
    actionChip: "bg-primaryGray-2 text-white",
  },
  BLOCK: {
    status: "Fix before filing",
    statusChip: "bg-tertiaryRed-11 text-tertiaryRed-2 border border-tertiaryRed-8",
    action: "Retry QA",
    actionChip: "bg-tertiaryRed-3 text-white",
  },
};

const hasMissingData = (r: ScoredRow): boolean => {
  const cm = r.result?.criteria_match;
  if (!cm) return false;
  if ((cm.critical_unmet ?? 0) > 0) return true;
  const items = Array.isArray(cm.criteria) ? cm.criteria : [];
  return items.some((c) => c.status && c.status !== "MET");
};

const sourceLabel: Record<string, string> = {
  fda_label: "FDA label",
  payer_policy: "Payer policy",
  historical: "Historical PAs",
};

/* ──────────────────────────────────────────────────────────────────────── */
/* Shared small components                                                    */
/* ──────────────────────────────────────────────────────────────────────── */
const StatCard = ({
  label,
  value,
  tone = "text-primaryGray-2",
}: {
  label: string;
  value: string | number;
  tone?: string;
}) => (
  <div className="flex min-w-[68px] flex-col items-center justify-center rounded-lg border border-primaryGray-15 bg-white px-3 py-2">
    <span className={`text-h10 font-bold leading-none ${tone}`}>{value}</span>
    <span className="mt-1 text-x-tiny font-semiBold uppercase tracking-wide text-primaryGray-8">
      {label}
    </span>
  </div>
);

const SectionLabel = ({ children, tone = "text-primaryGray-7" }: { children: React.ReactNode; tone?: string }) => (
  <div className={`text-x-tiny font-bold uppercase tracking-wide ${tone}`}>{children}</div>
);

const AgentReasoning = ({ packet, loading }: { packet?: AnswerPacket; loading: boolean }) => {
  if (loading && !packet) {
    return (
      <div className="rounded-lg border border-primaryGray-15 bg-primaryGray-17 px-4 py-3 text-x-tiny text-primaryGray-8">
        <span className="animate-pulse">Multi-agent team reasoning over the questionnaire…</span>
      </div>
    );
  }
  if (!packet) return null;
  const ps = packet.payer_strategy;
  const isLLM = packet.reasoning_mode === "llm";
  return (
    <div className="rounded-lg border border-primaryGray-15 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded bg-primaryGray-2 px-2 py-0.5 text-x-tiny font-bold text-white">
          AGENT TEAM
        </span>
        <span
          className={`rounded px-2 py-0.5 text-x-tiny font-bold ${
            isLLM ? "bg-primaryGreen-3 text-white" : "bg-primaryGray-15 text-primaryGray-7"
          }`}
        >
          {isLLM ? "AI-REASONED (Claude)" : "RULE-BASED"}
        </span>
        <span className="truncate text-x-tiny text-primaryGray-8">
          {(packet.agents || []).map((a) => a.agent).join("  →  ")}
        </span>
      </div>

      {packet.summary && (
        <div className="mb-3 rounded-lg border border-primaryGreen-9 bg-primaryGreen-11 px-3 py-2 text-x-tiny text-primaryGray-3">
          <span className="font-bold text-primaryGreen-2">Reviewer note: </span>
          {packet.summary}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <SectionLabel>Mechanism justification</SectionLabel>
          <div className="mt-1.5 text-x-tiny leading-relaxed text-primaryGray-4">{packet.mechanism}</div>
        </div>
        <div>
          <SectionLabel>Clinical guidelines</SectionLabel>
          <ul className="mt-1.5 space-y-1 text-x-tiny text-primaryGray-4">
            {(packet.guidelines || []).map((g, i) => (
              <li key={i}>• {g}</li>
            ))}
            {(packet.guidelines || []).length === 0 && (
              <li className="text-primaryGray-9">No guideline mapped.</li>
            )}
          </ul>
        </div>
        <div>
          <SectionLabel>Payer strategy {ps?.matched_policy ? `· ${ps.matched_policy}` : ""}</SectionLabel>
          <ul className="mt-1.5 space-y-1 text-x-tiny text-primaryGray-4">
            {(ps?.strategy || []).map((s, i) => (
              <li key={i}>→ {s}</li>
            ))}
            {(ps?.strategy || []).length === 0 && (
              <li className="text-primaryGray-9">No payer policy on file.</li>
            )}
          </ul>
        </div>
      </div>

      <div className="mt-4">
        <SectionLabel>Drafted questionnaire answers</SectionLabel>
        <div className="mt-1.5 divide-y divide-primaryGray-16 overflow-hidden rounded-lg border border-primaryGray-15">
          {(packet.questions || []).map((q, i) => {
            const sm = statusMeta[q.status || ""] || { dot: "text-primaryGray-9", label: q.status || "" };
            return (
              <div key={i} className="px-3 py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-x-tiny font-semiBold text-primaryGray-3">
                    {q.critical ? "★ " : ""}
                    {q.question}
                  </div>
                  <span className={`whitespace-nowrap text-x-tiny font-bold ${sm.dot}`}>{sm.label}</span>
                </div>
                <div className="mt-1 text-x-tiny text-primaryGray-5">
                  <span className="font-semiBold">Answer:</span> {q.recommended_answer}
                  {q.source && (
                    <span className="ml-1 text-primaryGray-9">({sourceLabel[q.source] || q.source})</span>
                  )}
                </div>
                {q.justification && (
                  <div className="mt-0.5 text-x-tiny text-primaryGray-7">{q.justification}</div>
                )}
                {q.evidence && (
                  <div className="mt-0.5 text-x-tiny italic text-primaryGray-8">Cite: {q.evidence}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────────────── */
/* Main panel                                                                 */
/* ──────────────────────────────────────────────────────────────────────── */
const RisaTouchlessPanel = () => {
  const [mode, setMode] = useState<Mode>("live");
  // Compact by default — the detailed worklist/validation tables (which would
  // otherwise stack on top of the real PA Orders grid) are revealed on demand.
  const [open, setOpen] = useState(false);

  // Live worklist state
  const [rows, setRows] = useState<ScoredRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [decisionFilter, setDecisionFilter] = useState<"ALL" | EngineDecision>("ALL");

  // Validation state
  const [showcase, setShowcase] = useState<ShowcaseCase[]>([]);
  const [valLoading, setValLoading] = useState(false);

  // Shared expand + per-row answer cache
  const [expanded, setExpanded] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerPacket>>({});
  const [answerLoading, setAnswerLoading] = useState<Record<string, boolean>>({});

  const loadAnswer = async (key: string, c: FilingQueueCase) => {
    if (answers[key] || answerLoading[key]) return;
    setAnswerLoading((s) => ({ ...s, [key]: true }));
    try {
      const packet = await answerQuestionnaire(c);
      setAnswers((s) => ({ ...s, [key]: packet }));
    } catch {
      /* leave undefined */
    } finally {
      setAnswerLoading((s) => ({ ...s, [key]: false }));
    }
  };

  const toggleRow = (key: string, c: FilingQueueCase) => {
    const next = expanded === key ? null : key;
    setExpanded(next);
    if (next) loadAnswer(key, c);
  };

  const runLive = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const queue = await getFilingQueue();
      setRows(queue.map((c) => ({ ...c })));
      const scored = await Promise.all(
        queue.map(async (c) => {
          try {
            return { ...c, result: await predictCase(c) } as ScoredRow;
          } catch {
            return { ...c, error: true } as ScoredRow;
          }
        }),
      );
      setRows(scored);
    } catch {
      setErrorMsg("Could not reach the RISA Denial Engine. Is the API deployed with CORS enabled?");
    } finally {
      setLoading(false);
    }
  };

  const loadValidation = async () => {
    if (showcase.length || valLoading) return;
    setValLoading(true);
    setErrorMsg(null);
    try {
      setShowcase(await getShowcase());
    } catch {
      setErrorMsg("Could not load validation cases from the engine.");
    } finally {
      setValLoading(false);
    }
  };

  useEffect(() => {
    runLive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mode === "validation") loadValidation();
    setExpanded(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const summary = useMemo(() => {
    const scored = rows.filter((r) => r.result);
    const counts = { AUTO_SUBMIT: 0, REVIEW: 0, BLOCK: 0 } as Record<EngineDecision, number>;
    let riskSum = 0;
    scored.forEach((r) => {
      const d = (r.result?.decision || "REVIEW") as EngineDecision;
      counts[d] = (counts[d] || 0) + 1;
      riskSum += r.result?.denial_risk ?? 0;
    });
    const n = scored.length || 1;
    return {
      total: scored.length,
      counts,
      touchless: Math.round((counts.AUTO_SUBMIT / n) * 100),
      avgRisk: Math.round(riskSum / n),
    };
  }, [rows]);

  const valSummary = useMemo(() => {
    const n = showcase.length || 0;
    const correct = showcase.filter((s) => s.correct).length;
    return { total: n, correct, accuracy: n ? Math.round((correct / n) * 100) : 0 };
  }, [showcase]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (decisionFilter !== "ALL") {
        const d = (r.result?.decision || "REVIEW") as EngineDecision;
        if (d !== decisionFilter) return false;
      }
      if (!q) return true;
      return [r.patient, r.medication, r.drug, r.payer_name, r.cmm_id]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [rows, query, decisionFilter]);

  return (
    <div className="risa-touchless rounded-xl border border-primaryGreen-9 bg-gradient-to-b from-primaryGreen-11 to-white p-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 rounded-md bg-primaryGreen-3 px-2 py-1 text-tiny font-bold text-white">
            RISA AI
          </span>
          <div>
            <div className="text-h11 font-bold text-primaryGray-2">
              {mode === "live"
                ? "Predictive Denial Prevention · Touchless Filing"
                : "Bot Validation · Filed cases vs. actual outcomes"}
            </div>
            <div className="mt-0.5 max-w-[640px] text-tiny text-primaryGray-7">
              {mode === "live"
                ? "Every pending PA is scored before submission and routed auto-file / review / block — with the criteria behind the call."
                : "Load real PAs that were already filed (we know the payer's verdict), run the bot, and check whether it called approve/deny correctly."}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {mode === "live" && summary.total > 0 && (
            <>
              <StatCard label="Touchless" value={`${summary.touchless}%`} tone="text-primaryGreen-3" />
              <StatCard label="Auto-file" value={summary.counts.AUTO_SUBMIT} tone="text-primaryGreen-3" />
              <StatCard label="Review" value={summary.counts.REVIEW} tone="text-secondaryOrange-3" />
              <StatCard label="Block" value={summary.counts.BLOCK} tone="text-tertiaryRed-3" />
              <StatCard label="Avg risk" value={`${summary.avgRisk}%`} tone={riskTone(summary.avgRisk).text} />
            </>
          )}
          {mode === "validation" && valSummary.total > 0 && (
            <>
              <StatCard
                label="Bot accuracy"
                value={`${valSummary.accuracy}%`}
                tone={valSummary.accuracy >= 70 ? "text-primaryGreen-3" : "text-secondaryOrange-3"}
              />
              <StatCard label="Correct" value={valSummary.correct} tone="text-primaryGreen-3" />
              <StatCard
                label="Missed"
                value={valSummary.total - valSummary.correct}
                tone="text-tertiaryRed-3"
              />
              <StatCard label="Cases" value={valSummary.total} />
            </>
          )}
          {mode === "live" && (
            <button
              onClick={runLive}
              disabled={loading}
              className="rounded-lg bg-primaryGreen-3 px-3.5 py-2 text-small font-bold text-white disabled:opacity-50"
            >
              {loading ? "Scoring…" : "Re-run predictions"}
            </button>
          )}
          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg border border-primaryGray-15 bg-white px-3.5 py-2 text-small font-bold text-primaryGray-3 hover:bg-primaryGray-16"
          >
            {open ? "Hide details ▴" : "View details ▾"}
          </button>
        </div>
      </div>

      {!open &&
        (mode === "live" ? (
          errorMsg ? (
            <div className="mt-3 rounded-lg border border-tertiaryRed-8 bg-tertiaryRed-11 px-3 py-2 text-x-tiny text-tertiaryRed-2">
              {errorMsg}
            </div>
          ) : loading && summary.total === 0 ? (
            <div className="mt-3 text-x-tiny text-primaryGray-7">
              <span className="animate-pulse">
                Scoring {rows.length || ""} pending PA{rows.length === 1 ? "" : "s"} with the model…
              </span>
            </div>
          ) : (
            <div className="mt-3 text-x-tiny text-primaryGray-7">
              {`Engine scored ${summary.total} pending PA${summary.total === 1 ? "" : "s"} · ${summary.counts.AUTO_SUBMIT} ready to auto-file · ${summary.counts.REVIEW} need review · ${summary.counts.BLOCK} blocked. Open “View details” for the per-case worklist and the criteria behind each call.`}
            </div>
          )
        ) : (
          <div className="mt-3 text-x-tiny text-primaryGray-7">
            {`Loaded ${valSummary.total} filed case${valSummary.total === 1 ? "" : "s"} with known outcomes. Open “View details” to see the bot's verdict vs. the payer's actual decision.`}
          </div>
        ))}

      {/* Mode toggle */}
      <div className={`mt-4 ${open ? "inline-flex" : "hidden"} rounded-lg border border-primaryGray-15 bg-white p-0.5`}>
        {(
          [
            { id: "live" as const, label: "Live worklist" },
            { id: "validation" as const, label: "Validation (filed cases)" },
          ]
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setMode(t.id)}
            className={`rounded-md px-3.5 py-1.5 text-x-tiny font-bold uppercase tracking-wide transition-colors ${
              mode === t.id ? "bg-primaryGray-2 text-white" : "text-primaryGray-7 hover:bg-primaryGray-16"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {open && errorMsg && (
        <div className="mt-3 rounded-lg border border-tertiaryRed-8 bg-tertiaryRed-11 px-3 py-2 text-small text-tertiaryRed-2">
          {errorMsg}
        </div>
      )}

      {open &&
        (mode === "live" ? (
          <LiveWorklist
            rows={rows}
            filteredRows={filteredRows}
            loading={loading}
            query={query}
            setQuery={setQuery}
            decisionFilter={decisionFilter}
            setDecisionFilter={setDecisionFilter}
            expanded={expanded}
            toggleRow={toggleRow}
            answers={answers}
            answerLoading={answerLoading}
          />
        ) : (
          <ValidationTable
            showcase={showcase}
            loading={valLoading}
            expanded={expanded}
            toggleRow={toggleRow}
            answers={answers}
            answerLoading={answerLoading}
          />
        ))}
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────────────── */
/* Live worklist                                                              */
/* ──────────────────────────────────────────────────────────────────────── */
const COLS = "grid-cols-[1.5fr_1.1fr_0.9fr_0.7fr_0.7fr_1fr_1fr_28px]";

const LiveWorklist = ({
  rows,
  filteredRows,
  loading,
  query,
  setQuery,
  decisionFilter,
  setDecisionFilter,
  expanded,
  toggleRow,
  answers,
  answerLoading,
}: {
  rows: ScoredRow[];
  filteredRows: ScoredRow[];
  loading: boolean;
  query: string;
  setQuery: (v: string) => void;
  decisionFilter: "ALL" | EngineDecision;
  setDecisionFilter: (v: "ALL" | EngineDecision) => void;
  expanded: string | null;
  toggleRow: (key: string, c: FilingQueueCase) => void;
  answers: Record<string, AnswerPacket>;
  answerLoading: Record<string, boolean>;
}) => (
  <>
    {/* controls */}
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search patient, drug, payer, CMM ID…"
        className="min-w-[240px] flex-1 rounded-lg border border-primaryGray-15 bg-white px-3 py-2 text-small text-primaryGray-3 placeholder:text-primaryGray-9 focus:border-primaryGreen-3 focus:outline-none"
      />
      <div className="inline-flex overflow-hidden rounded-lg border border-primaryGray-15 bg-white">
        {(
          [
            { id: "ALL" as const, label: "All" },
            { id: "AUTO_SUBMIT" as const, label: "Auto-file" },
            { id: "REVIEW" as const, label: "Review" },
            { id: "BLOCK" as const, label: "Block" },
          ]
        ).map((f) => (
          <button
            key={f.id}
            onClick={() => setDecisionFilter(f.id)}
            className={`px-3 py-2 text-x-tiny font-bold uppercase tracking-wide transition-colors ${
              decisionFilter === f.id ? "bg-primaryGray-2 text-white" : "text-primaryGray-7 hover:bg-primaryGray-16"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      {rows.length > 0 && (
        <span className="text-x-tiny text-primaryGray-8">
          {filteredRows.length} of {rows.length} shown
        </span>
      )}
    </div>

    <div className="mt-3 overflow-hidden rounded-xl border border-primaryGray-15 bg-white">
      <div
        className={`grid ${COLS} items-center gap-2 border-b border-primaryGray-15 bg-primaryGray-16 px-4 py-2.5 text-x-tiny font-bold uppercase tracking-wide text-primaryGray-7`}
      >
        <span>Patient</span>
        <span>Medication</span>
        <span>Payer</span>
        <span>Risk</span>
        <span>Missing</span>
        <span>CMM status</span>
        <span>Action</span>
        <span />
      </div>

      {loading && rows.length === 0 && (
        <div className="px-4 py-8 text-center text-small text-primaryGray-8">
          Loading PA queue and scoring with the model…
        </div>
      )}
      {!loading && filteredRows.length === 0 && rows.length > 0 && (
        <div className="px-4 py-8 text-center text-small text-primaryGray-8">
          No requests match your search / filter.
        </div>
      )}

      {filteredRows.map((r) => {
        const key = r.cmm_id || r.member_id || r.patient;
        const isOpen = expanded === key;
        const d = (r.result?.decision || "REVIEW") as EngineDecision;
        const wf = workflowMeta[d];
        const cm = r.result?.criteria_match;
        const missing = hasMissingData(r);
        const risk = r.result?.denial_risk ?? 0;
        return (
          <div key={key} className="border-b border-primaryGray-16 last:border-b-0">
            <div
              className={`grid ${COLS} cursor-pointer items-center gap-2 px-4 py-3 text-small hover:bg-primaryGray-17`}
              onClick={() => toggleRow(key, r)}
            >
              <div className="min-w-0">
                <div className="truncate font-semiBold text-primaryGray-2">{r.patient}</div>
                <div className="truncate text-x-tiny text-primaryGray-9">
                  DOB {r.dob} · {r.cmm_id}
                </div>
              </div>
              <div className="truncate text-primaryGray-4">{r.medication}</div>
              <div className="truncate text-primaryGray-4">{r.payer_name}</div>
              <div>
                {r.error ? (
                  <span className="text-primaryGray-9">—</span>
                ) : r.result ? (
                  <span className={`inline-block rounded-md px-2 py-0.5 text-x-tiny font-bold ${riskTone(risk).chip}`}>
                    {Math.round(risk)}%
                  </span>
                ) : (
                  <span className="text-primaryGray-9">…</span>
                )}
              </div>
              <div>
                {r.result ? (
                  <span className={`text-x-tiny font-bold ${missing ? "text-tertiaryRed-3" : "text-primaryGreen-3"}`}>
                    {missing ? "Yes" : "No"}
                  </span>
                ) : (
                  <span className="text-x-tiny text-primaryGray-9">…</span>
                )}
              </div>
              <div>
                {r.result ? (
                  <span className={`inline-block rounded-md px-2 py-0.5 text-x-tiny font-bold ${wf.statusChip}`}>
                    {wf.status}
                  </span>
                ) : (
                  <span className="text-x-tiny text-primaryGray-9">scoring…</span>
                )}
              </div>
              <div>
                {r.result ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleRow(key, r);
                    }}
                    className={`rounded-md px-2.5 py-1 text-x-tiny font-bold ${wf.actionChip}`}
                  >
                    {wf.action}
                  </button>
                ) : (
                  <span className="text-x-tiny text-primaryGray-9">—</span>
                )}
              </div>
              <div className="text-center text-primaryGray-9">{isOpen ? "▾" : "▸"}</div>
            </div>

            {isOpen && r.result && (
              <div className="space-y-3 bg-primaryGray-17 px-4 py-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <DecisionCard
                    title="Why this decision"
                    titleTone="text-primaryGray-7"
                    body={
                      r.result.decision_reason ||
                      `Model risk ${Math.round(r.result.denial_risk)}% (${r.result.risk_level}).`
                    }
                    bullets={(r.result.risk_factors || []).slice(0, 4).map((f) => f.factor)}
                  />
                  <DecisionCard
                    title="Criteria met"
                    titleTone="text-primaryGreen-2"
                    bullets={criteriaByStatus(cm, true).slice(0, 5).map((c) => `✓ ${c}`)}
                    emptyText="No matched criteria in KB for this drug."
                  />
                  <DecisionCard
                    title="Missing / fix before filing"
                    titleTone="text-tertiaryRed-2"
                    bullets={[
                      ...criteriaByStatus(cm, false).slice(0, 5).map((c) => `✗ ${c}`),
                      ...(r.result.recommendations || []).slice(0, 3).map((rec) => `→ ${rec}`),
                    ]}
                    emptyText="Nothing outstanding."
                  />
                </div>
                <AgentReasoning packet={answers[key]} loading={!!answerLoading[key]} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  </>
);

const DecisionCard = ({
  title,
  titleTone,
  body,
  bullets,
  emptyText,
}: {
  title: string;
  titleTone: string;
  body?: string;
  bullets?: string[];
  emptyText?: string;
}) => (
  <div className="rounded-lg border border-primaryGray-15 bg-white p-3">
    <SectionLabel tone={titleTone}>{title}</SectionLabel>
    {body && <div className="mt-1.5 text-small text-primaryGray-3">{body}</div>}
    <ul className="mt-1.5 space-y-1 text-x-tiny text-primaryGray-4">
      {(bullets || []).map((b, i) => (
        <li key={i}>{b}</li>
      ))}
      {(!bullets || bullets.length === 0) && emptyText && (
        <li className="text-primaryGray-9">{emptyText}</li>
      )}
    </ul>
  </div>
);

/* ──────────────────────────────────────────────────────────────────────── */
/* Validation table                                                           */
/* ──────────────────────────────────────────────────────────────────────── */
const VAL_COLS = "grid-cols-[1.2fr_1.4fr_0.8fr_0.9fr_0.9fr_1fr_28px]";

const OutcomePill = ({ outcome }: { outcome: string }) => {
  const approved = String(outcome).toLowerCase().startsWith("approv");
  return (
    <span
      className={`inline-block rounded-md px-2 py-0.5 text-x-tiny font-bold ${
        approved ? "bg-primaryGreen-11 text-primaryGreen-2" : "bg-tertiaryRed-11 text-tertiaryRed-2"
      }`}
    >
      {approved ? "Approved" : "Denied"}
    </span>
  );
};

const ValidationTable = ({
  showcase,
  loading,
  expanded,
  toggleRow,
  answers,
  answerLoading,
}: {
  showcase: ShowcaseCase[];
  loading: boolean;
  expanded: string | null;
  toggleRow: (key: string, c: FilingQueueCase) => void;
  answers: Record<string, AnswerPacket>;
  answerLoading: Record<string, boolean>;
}) => (
  <div className="mt-4 overflow-hidden rounded-xl border border-primaryGray-15 bg-white">
    <div
      className={`grid ${VAL_COLS} items-center gap-2 border-b border-primaryGray-15 bg-primaryGray-16 px-4 py-2.5 text-x-tiny font-bold uppercase tracking-wide text-primaryGray-7`}
    >
      <span>Drug</span>
      <span>Payer</span>
      <span>Bot approval</span>
      <span>Bot verdict</span>
      <span>Actual outcome</span>
      <span>Result</span>
      <span />
    </div>

    {loading && showcase.length === 0 && (
      <div className="px-4 py-8 text-center text-small text-primaryGray-8">
        Loading filed cases with known outcomes…
      </div>
    )}

    {showcase.map((s) => {
      const key = `val-${s.case_id}`;
      const isOpen = expanded === key;
      const appr = approvalPct(s.predicted_risk);
      const filingCase = showcaseToFilingCase(s);
      return (
        <div key={key} className="border-b border-primaryGray-16 last:border-b-0">
          <div
            className={`grid ${VAL_COLS} cursor-pointer items-center gap-2 px-4 py-3 text-small hover:bg-primaryGray-17`}
            onClick={() => toggleRow(key, filingCase)}
          >
            <div className="min-w-0">
              <div className="truncate font-semiBold text-primaryGray-2">{s.drug}</div>
              <div className="truncate text-x-tiny text-primaryGray-9">
                {s.answered_questions}/{s.total_questions} questions · #{s.case_id.slice(0, 6)}
              </div>
            </div>
            <div className="truncate text-primaryGray-4" title={s.payer_name}>
              {s.payer_name}
            </div>
            <div className={`font-bold ${riskTone(s.predicted_risk).text}`}>{appr}%</div>
            <div>
              <OutcomePill outcome={s.predicted_label} />
            </div>
            <div>
              <OutcomePill outcome={s.actual_outcome} />
            </div>
            <div>
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-x-tiny font-bold ${
                  s.correct
                    ? "bg-primaryGreen-11 text-primaryGreen-2"
                    : "bg-tertiaryRed-11 text-tertiaryRed-2"
                }`}
              >
                {s.correct ? "✓ Correct" : "✗ Missed"}
              </span>
            </div>
            <div className="text-center text-primaryGray-9">{isOpen ? "▾" : "▸"}</div>
          </div>

          {isOpen && (
            <div className="space-y-3 bg-primaryGray-17 px-4 py-4">
              {/* verdict banner */}
              <div
                className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 ${
                  s.correct
                    ? "border-primaryGreen-9 bg-primaryGreen-11"
                    : "border-tertiaryRed-8 bg-tertiaryRed-11"
                }`}
              >
                <div className="text-small text-primaryGray-3">
                  Bot predicted <b>{String(s.predicted_label)}</b> at{" "}
                  <b>{appr}% approval likelihood</b> ({Math.round(s.predicted_risk)}% denial risk).
                  Payer actually <b>{String(s.actual_outcome)}</b> it.
                </div>
                <span
                  className={`whitespace-nowrap rounded-md px-3 py-1 text-small font-bold ${
                    s.correct ? "bg-primaryGreen-3 text-white" : "bg-tertiaryRed-3 text-white"
                  }`}
                >
                  {s.correct ? "Bot was right" : "Bot was wrong"}
                </span>
              </div>

              {/* evidence the bot reasoned over */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <DecisionCard
                  title="Supporting evidence (from chart)"
                  titleTone="text-primaryGreen-2"
                  bullets={(s.supportive_texts || []).slice(0, 5).map((t) => `✓ ${t}`)}
                  emptyText="No supportive evidence recorded."
                />
                <DecisionCard
                  title="Contradictory / gaps"
                  titleTone="text-tertiaryRed-2"
                  bullets={(s.contradictory_texts || []).slice(0, 5).map((t) => `✗ ${t}`)}
                  emptyText="No contradictions recorded."
                />
              </div>

              {/* the bot actually filling the questionnaire, live */}
              <AgentReasoning packet={answers[key]} loading={!!answerLoading[key]} />
            </div>
          )}
        </div>
      );
    })}
  </div>
);

export default RisaTouchlessPanel;
