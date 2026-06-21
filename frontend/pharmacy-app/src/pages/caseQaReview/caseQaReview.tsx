import { useEffect, useMemo, useState } from "react";
import {
  AnswerReviewResult,
  CompletedCase,
  getCompletedCases,
  reviewCaseAnswers,
} from "../../api/denialEngine";

/* ──────────────────────────────────────────────────────────────────────────
 * Case QA Review
 *
 * Replays previously-completed PAs (real questionnaire + the answer that was
 * actually submitted + the real payer outcome) through our medical-necessity
 * engine, and compares:
 *   • the bot's per-question answer vs. the actual submitted answer
 *   • the necessity engine's predicted decision vs. the real outcome
 *   • the trained XGBoost model's decision vs. the real outcome
 *
 * Loaded cases + per-case review results persist to localStorage, so the
 * worklist stays saved across reloads.
 * ────────────────────────────────────────────────────────────────────────── */

const CASES_KEY = "qaReview.cases.v1";
const REVIEWS_KEY = "qaReview.reviews.v1";

const Spinner = () => (
  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-primaryGray-14 border-t-primaryGray-1" />
);

const loadLS = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const outcomeChip = (o?: string | null) =>
  o === "Approved"
    ? "bg-[#E6F3F0] text-[#005D49]"
    : o === "Denied"
      ? "bg-[#FFE8E8] text-[#CC0300]"
      : "bg-primaryGray-15 text-primaryGray-7";

const Verdict = ({
  value,
  correct,
}: {
  value?: string | null;
  correct?: boolean | null;
}) => {
  if (!value) return <span className="text-x-tiny text-primaryGray-9">—</span>;
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`rounded-md px-2 py-0.5 text-x-tiny font-bold ${outcomeChip(value)}`}>{value}</span>
      {correct != null && (
        <span className={correct ? "text-[#005D49]" : "text-[#CC0300]"}>{correct ? "✓" : "✗"}</span>
      )}
    </span>
  );
};

const statusChip = (s?: string | null) => {
  const v = (s || "").toUpperCase();
  if (v === "MET") return "bg-[#E6F3F0] text-[#005D49]";
  if (v === "AT_RISK") return "bg-[#FFF3E0] text-[#C24400]";
  return "bg-primaryGray-15 text-primaryGray-7";
};

const CaseQaReview = ({ embedded = false }: { embedded?: boolean }) => {
  const [cases, setCases] = useState<CompletedCase[]>(() => loadLS<CompletedCase[]>(CASES_KEY, []));
  const [reviews, setReviews] = useState<Record<string, AnswerReviewResult>>(() =>
    loadLS<Record<string, AnswerReviewResult>>(REVIEWS_KEY, {}),
  );
  const [loadCount, setLoadCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [runningCase, setRunningCase] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    localStorage.setItem(CASES_KEY, JSON.stringify(cases));
  }, [cases]);
  useEffect(() => {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
  }, [reviews]);

  const loadCases = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await getCompletedCases(loadCount);
      setCases(data);
    } catch {
      setErrorMsg("Could not load completed cases. Is the engine API deployed with /api/completed-cases?");
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setCases([]);
    setReviews({});
    setExpanded(null);
    setQuery("");
  };

  const runReview = async (c: CompletedCase) => {
    setRunningCase(c.case_id);
    try {
      const res = await reviewCaseAnswers(c);
      setReviews((r) => ({ ...r, [c.case_id]: res }));
    } catch {
      setErrorMsg(
        `Couldn't run the bot on ${c.case_id}. The cases load locally, but running the medical-necessity ` +
          `engine + XGBoost comparison needs the live engine API (/api/answer-review) to be deployed.`,
      );
    } finally {
      setRunningCase(null);
    }
  };

  const toggle = (c: CompletedCase) => {
    const open = expanded === c.case_id;
    setExpanded(open ? null : c.case_id);
    if (!open && !reviews[c.case_id] && runningCase !== c.case_id) runReview(c);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cases;
    return cases.filter((c) =>
      [c.drug, c.payer_name, c.case_id, c.actual_outcome]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [cases, query]);

  // Aggregate stats over the cases that have been reviewed.
  const stats = useMemo(() => {
    const rev = Object.values(reviews);
    let agree = 0;
    let comparable = 0;
    let necCorrect = 0;
    let necTotal = 0;
    let xgbCorrect = 0;
    let xgbTotal = 0;
    rev.forEach((r) => {
      agree += r.n_agree || 0;
      comparable += r.n_comparable || 0;
      if (r.necessity_correct != null) {
        necTotal += 1;
        if (r.necessity_correct) necCorrect += 1;
      }
      if (r.xgb_correct != null) {
        xgbTotal += 1;
        if (r.xgb_correct) xgbCorrect += 1;
      }
    });
    return {
      reviewed: rev.length,
      qAgreementPct: comparable ? Math.round((agree / comparable) * 100) : null,
      qAgree: agree,
      qComparable: comparable,
      necAccuracy: necTotal ? Math.round((necCorrect / necTotal) * 100) : null,
      necTotal,
      xgbAccuracy: xgbTotal ? Math.round((xgbCorrect / xgbTotal) * 100) : null,
      xgbTotal,
    };
  }, [reviews]);

  const COLS = "grid-cols-[1.4fr_1.1fr_0.8fr_1fr_1fr_0.9fr_28px]";

  const inner = (
    <>
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-h11 font-bold text-primaryGray-1">Case QA Review</div>
            <div className="mt-0.5 max-w-[760px] text-tiny text-primaryGray-7">
              Replay previously-completed PAs through the medical-necessity engine and compare the bot's
              questionnaire answers to what was actually submitted — and both engines' predicted decision
              to the real payer outcome. Loaded cases and results stay saved.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={loadCount}
              onChange={(e) => setLoadCount(Number(e.target.value))}
              className="rounded-lg border border-primaryGray-14 bg-white px-2.5 py-2 text-small font-semibold text-primaryGray-3 focus:border-primaryGray-1 focus:outline-none"
            >
              <option value={10}>Load 10</option>
              <option value={25}>Load 25</option>
              <option value={50}>Load 50</option>
            </select>
            <button
              onClick={loadCases}
              disabled={loading}
              className="rounded-lg bg-primaryGray-1 px-3.5 py-2 text-small font-bold text-white hover:bg-primaryGray-5 disabled:opacity-50"
            >
              {loading ? "Loading…" : "Load cases"}
            </button>
            <button
              onClick={clearAll}
              disabled={cases.length === 0}
              className="rounded-lg border border-primaryGray-14 bg-white px-3.5 py-2 text-small font-bold text-primaryGray-3 hover:bg-primaryGray-16 disabled:opacity-40"
            >
              Clear
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="rounded-lg border border-[#fca5a5] bg-[#FEF2F2] px-3 py-2 text-small text-[#CC0300]">
            {errorMsg}
          </div>
        )}

        {/* Stats + model explainer */}
        {cases.length > 0 && (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.1fr_1.4fr]">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
              <Stat label="Cases loaded" value={String(cases.length)} sub={`${stats.reviewed} reviewed`} />
              <Stat
                label="Q/A agreement"
                value={stats.qAgreementPct != null ? `${stats.qAgreementPct}%` : "—"}
                sub={`${stats.qAgree}/${stats.qComparable} yes-no items`}
                tone="teal"
              />
              <Stat
                label="Necessity engine"
                value={stats.necAccuracy != null ? `${stats.necAccuracy}%` : "—"}
                sub={`vs outcome · n=${stats.necTotal}`}
                tone="teal"
              />
              <Stat
                label="XGBoost model"
                value={stats.xgbAccuracy != null ? `${stats.xgbAccuracy}%` : "—"}
                sub={`vs outcome · n=${stats.xgbTotal}`}
                tone="violet"
              />
            </div>

            <div className="rounded-xl border border-primaryGray-14 bg-primaryGray-17 p-3 text-[12px] leading-relaxed text-primaryGray-6">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-primaryGray-8">
                Two engines, compared on these Q/As
              </div>
              <p className="mb-1.5">
                <b className="text-[#5B21B6]">Trained model (XGBoost + TF-IDF)</b> — predicts a denial-risk
                score (0–100) from payer, drug class, the supportive/contradictory evidence text, and
                questionnaire completeness. Trained on ~10k historic PAs (AUC ≈ 0.83). Fast and cheap, but a
                single opaque number.
              </p>
              <p>
                <b className="text-[#005D49]">Medical-necessity engine</b> — an 8-stage LLM pipeline (patient
                evidence → drug criteria → historical → deciding factor → coverage → approval optimization →
                clinical answering → final justification). It actually answers each question with a
                justification and is fully explainable.{" "}
                {stats.necAccuracy != null && stats.xgbAccuracy != null && (
                  <span className="font-semibold text-primaryGray-2">
                    On your reviewed set the necessity engine is{" "}
                    {stats.necAccuracy === stats.xgbAccuracy
                      ? "tied with"
                      : stats.necAccuracy > stats.xgbAccuracy
                        ? "ahead of"
                        : "behind"}{" "}
                    XGBoost ({stats.necAccuracy}% vs {stats.xgbAccuracy}%).
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Search */}
        {cases.length > 0 && (
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search loaded cases — drug, payer, case ID, outcome…"
            className="rounded-lg border border-primaryGray-14 bg-white px-3 py-2 text-small text-primaryGray-3 placeholder:text-primaryGray-9 focus:border-primaryGray-1 focus:outline-none"
          />
        )}

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {cases.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="text-small font-semibold text-primaryGray-7">No cases loaded.</div>
              <div className="mt-1 text-x-tiny text-primaryGray-9">
                Pick a size and click <b>Load cases</b> to pull previously-completed PAs with their real
                questionnaire and outcome. Expand a row to run the bot and compare.
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-primaryGray-14">
              <div
                className={`grid ${COLS} items-center gap-2 border-b border-primaryGray-14 bg-primaryGray-16 px-4 py-2.5 text-x-tiny font-bold uppercase tracking-wide text-primaryGray-7`}
              >
                <span>Drug</span>
                <span>Payer</span>
                <span>Prior outcome</span>
                <span>Necessity engine</span>
                <span>XGBoost model</span>
                <span>Q/A match</span>
                <span />
              </div>

              {filtered.map((c) => {
                const isOpen = expanded === c.case_id;
                const r = reviews[c.case_id];
                const isRunning = runningCase === c.case_id;
                return (
                  <div key={c.case_id} className="border-b border-primaryGray-16 last:border-b-0">
                    <div
                      className={`grid ${COLS} cursor-pointer items-center gap-2 px-4 py-3 text-small hover:bg-primaryGray-17`}
                      onClick={() => toggle(c)}
                    >
                      <div className="min-w-0">
                        <div className="truncate font-semiBold text-primaryGray-2">{c.drug}</div>
                        <div className="truncate text-x-tiny text-primaryGray-9">
                          {c.case_id} · {c.questions.length} questions
                        </div>
                      </div>
                      <div className="truncate text-primaryGray-4" title={c.payer_name}>
                        {c.payer_name}
                      </div>
                      <div>
                        <span className={`rounded-md px-2 py-0.5 text-x-tiny font-bold ${outcomeChip(c.actual_outcome)}`}>
                          {c.actual_outcome}
                        </span>
                      </div>
                      <div>
                        {isRunning && !r ? (
                          <span className="inline-flex items-center gap-1 text-x-tiny text-primaryGray-7">
                            <Spinner /> running…
                          </span>
                        ) : r ? (
                          <Verdict value={r.necessity_predicts} correct={r.necessity_correct} />
                        ) : (
                          <span className="text-x-tiny text-primaryGray-9">expand to run</span>
                        )}
                      </div>
                      <div>
                        {r?.xgb ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Verdict value={r.xgb.predicts} correct={r.xgb_correct} />
                            <span className="text-x-tiny text-primaryGray-8">{Math.round(r.xgb.denial_risk)}%</span>
                          </span>
                        ) : (
                          <span className="text-x-tiny text-primaryGray-9">—</span>
                        )}
                      </div>
                      <div>
                        {r?.agreement_pct != null ? (
                          <span className="text-x-tiny font-bold text-primaryGray-3">
                            {r.agreement_pct}%{" "}
                            <span className="font-normal text-primaryGray-8">
                              ({r.n_agree}/{r.n_comparable})
                            </span>
                          </span>
                        ) : (
                          <span className="text-x-tiny text-primaryGray-9">—</span>
                        )}
                      </div>
                      <div className="text-center text-primaryGray-9">{isOpen ? "▾" : "▸"}</div>
                    </div>

                    {isOpen && (
                      <div className="space-y-3 bg-primaryGray-17 px-4 py-4">
                        {isRunning && !r ? (
                          <div className="flex items-center gap-2 rounded-lg border border-primaryGray-14 bg-white px-4 py-6 text-small text-primaryGray-7">
                            <Spinner /> Running the 8-stage medical-necessity engine over this questionnaire
                            (~30–60s). Results are cached once complete.
                          </div>
                        ) : r ? (
                          <CaseDetail c={c} r={r} onRerun={() => runReview(c)} rerunning={isRunning} />
                        ) : (
                          <button
                            onClick={() => runReview(c)}
                            className="rounded-md bg-[#005D49] px-3 py-1.5 text-xs font-bold text-white hover:opacity-90"
                          >
                            Run bot on this questionnaire
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
    </>
  );

  // When embedded (inside the Simulator) the parent already provides the white
  // card + padding, so we drop the standalone page chrome and just fill space.
  if (embedded) {
    return (
      <div className="flex flex-1 min-h-0 flex-col gap-3 overflow-hidden">
        {inner}
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-primaryGray-16 p-2">
      <div className="flex h-full flex-col gap-3 overflow-hidden rounded bg-white p-4">
        {inner}
      </div>
    </div>
  );
};

const Stat = ({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "teal" | "violet";
}) => (
  <div className="rounded-xl border border-primaryGray-14 bg-white px-3 py-2.5">
    <div className="text-[10px] font-bold uppercase tracking-wide text-primaryGray-8">{label}</div>
    <div
      className={`text-h10 font-bold ${
        tone === "teal" ? "text-[#005D49]" : tone === "violet" ? "text-[#5B21B6]" : "text-primaryGray-1"
      }`}
    >
      {value}
    </div>
    {sub && <div className="text-[10px] text-primaryGray-8">{sub}</div>}
  </div>
);

const CaseDetail = ({
  c,
  r,
  onRerun,
  rerunning,
}: {
  c: CompletedCase;
  r: AnswerReviewResult;
  onRerun: () => void;
  rerunning: boolean;
}) => (
  <>
    {/* verdict + reasoning */}
    <div className="rounded-lg border border-primaryGray-14 bg-white p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-small font-bold text-primaryGray-1">Bot decision &amp; reasoning</span>
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-primaryGray-16 px-2 py-0.5 text-x-tiny font-semibold text-primaryGray-7">
            {r.reasoning_mode === "llm" ? "LLM reasoning" : "deterministic"}
          </span>
          <button
            onClick={onRerun}
            disabled={rerunning}
            className="rounded-md border border-primaryGray-14 bg-white px-2.5 py-1 text-x-tiny font-bold text-primaryGray-3 hover:bg-primaryGray-16 disabled:opacity-50"
          >
            {rerunning ? "Re-running…" : "Re-run live"}
          </button>
        </div>
      </div>
      <div className="mb-2 flex flex-wrap items-center gap-4 rounded-md bg-primaryGray-16 px-3 py-2">
        <span className="text-xs text-primaryGray-4">
          Prior outcome:{" "}
          <span className={`rounded px-1.5 py-0.5 text-x-tiny font-bold ${outcomeChip(c.actual_outcome)}`}>
            {c.actual_outcome}
          </span>
        </span>
        <span className="text-xs text-primaryGray-4">
          Necessity: <b>{r.necessity_predicts}</b>{" "}
          {r.necessity_correct != null && (
            <span className={r.necessity_correct ? "text-[#005D49]" : "text-[#CC0300]"}>
              {r.necessity_correct ? "✓" : "✗"}
            </span>
          )}{" "}
          · {Math.round(r.approval_probability || 0)}% approval prob
        </span>
        {r.xgb && (
          <span className="text-xs text-primaryGray-4">
            XGBoost: <b>{r.xgb.predicts}</b>{" "}
            {r.xgb_correct != null && (
              <span className={r.xgb_correct ? "text-[#005D49]" : "text-[#CC0300]"}>
                {r.xgb_correct ? "✓" : "✗"}
              </span>
            )}{" "}
            · {Math.round(r.xgb.denial_risk)}% risk
          </span>
        )}
      </div>
      {r.xgb && r.xgb_after && (
        <div className="mb-2 flex flex-wrap items-center gap-3 rounded-md border border-[#bfe3d8] bg-[#F3FAF7] px-3 py-2">
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#005D49]">
            Prevention · trained model re-scored on engine output
          </span>
          <span className="text-xs text-primaryGray-4">
            Denial risk <b className="text-primaryGray-3">{Math.round(r.xgb.denial_risk)}%</b>
            <span className="mx-1 text-primaryGray-8">→</span>
            <b className="text-[#005D49]">{Math.round(r.xgb_after.denial_risk)}%</b>
          </span>
          {r.xgb_delta != null && (
            <span
              className={`rounded-md px-2 py-0.5 text-x-tiny font-bold ${
                r.xgb_delta > 0
                  ? "bg-[#E6F3F0] text-[#005D49]"
                  : "bg-primaryGray-15 text-primaryGray-7"
              }`}
            >
              {r.xgb_delta > 0 ? `▼ ${r.xgb_delta} pts preventable` : "no change"}
            </span>
          )}
          <span className="text-[11px] text-primaryGray-7">
            {r.xgb_after.n_resolved ?? 0} criteria substantiated · {r.xgb_after.n_open_gaps ?? 0} gap(s) still
            open
          </span>
        </div>
      )}
      {r.reasoning && <p className="text-xs leading-relaxed text-primaryGray-6">{r.reasoning}</p>}
      {(r.key_supporting_factors?.length || r.key_risks?.length) && (
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          {!!r.key_supporting_factors?.length && (
            <div className="rounded-md bg-[#F3FAF7] px-3 py-2">
              <div className="text-[10px] font-bold uppercase tracking-wide text-[#005D49]">Supporting</div>
              <ul className="mt-1 list-disc pl-4 text-[11px] text-primaryGray-6">
                {r.key_supporting_factors.slice(0, 5).map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          {!!r.key_risks?.length && (
            <div className="rounded-md bg-[#FFF7F0] px-3 py-2">
              <div className="text-[10px] font-bold uppercase tracking-wide text-[#C24400]">Risks / gaps</div>
              <ul className="mt-1 list-disc pl-4 text-[11px] text-primaryGray-6">
                {r.key_risks.slice(0, 5).map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>

    {/* Q/A comparison */}
    <div className="rounded-lg border border-primaryGray-14 bg-white p-4">
      <div className="mb-2 text-small font-bold text-primaryGray-1">
        Questionnaire — bot vs. what was actually submitted
      </div>
      <div className="overflow-hidden rounded-lg border border-primaryGray-14">
        <div className="grid grid-cols-[2fr_0.8fr_1.3fr_0.6fr_0.5fr] gap-2 border-b border-primaryGray-14 bg-primaryGray-16 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-primaryGray-7">
          <span>Question</span>
          <span>Previous answer</span>
          <span>Bot answer</span>
          <span>Status</span>
          <span>Match</span>
        </div>
        {r.answers.map((a, i) => (
          <div
            key={i}
            className="grid grid-cols-[2fr_0.8fr_1.3fr_0.6fr_0.5fr] gap-2 border-b border-primaryGray-16 px-3 py-2 text-[11px] last:border-b-0"
          >
            <span className="text-primaryGray-3" title={a.question}>
              {a.question.length > 120 ? a.question.slice(0, 120) + "…" : a.question}
            </span>
            <span className="font-semibold text-primaryGray-4">{a.actual_answer || "—"}</span>
            <span className="text-primaryGray-4">
              {a.bot_answer || "—"}
              {a.justification && (
                <span className="mt-0.5 block text-[10px] italic text-primaryGray-8">{a.justification}</span>
              )}
            </span>
            <span>
              {a.status ? (
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${statusChip(a.status)}`}>
                  {a.status}
                </span>
              ) : (
                "—"
              )}
            </span>
            <span>
              {a.agree == null ? (
                <span className="text-primaryGray-9">n/a</span>
              ) : a.agree ? (
                <span className="font-bold text-[#005D49]">✓</span>
              ) : (
                <span className="font-bold text-[#CC0300]">✗</span>
              )}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 text-[10px] text-primaryGray-8">
        Match compares yes/no answers; free-text items are shown as n/a. Status is the engine's
        criterion verdict (MET / AT_RISK / UNVERIFIED).
      </div>
    </div>
  </>
);

export default CaseQaReview;
