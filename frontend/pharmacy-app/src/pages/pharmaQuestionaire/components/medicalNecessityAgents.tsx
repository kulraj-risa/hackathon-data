import { useEffect, useMemo, useRef, useState } from "react";
import {
  CoverageMatrixItem,
  GapRecoveryItem,
  NecessityResult,
  runNecessity,
} from "../../../api/denialEngine";

interface Props {
  open: boolean;
  onClose: () => void;
  drug: string;
  payer: string;
  supportiveTexts: string[];
  contradictoryTexts: string[];
  questions: { question?: string }[];
}

// The staged multi-agent pipeline (DB1 evidence → DB2 criteria → coverage →
// reasoning → strategy → DB3 model → gap recovery → composer). Used to animate
// "agents working" while the engine runs, then annotated with the real trace.
const PIPELINE: { id: string; name: string; role: string }[] = [
  { id: "evidence", name: "Patient Evidence (DB1)", role: "Extracts the supportive & contradictory chart facts for this case." },
  { id: "criteria", name: "Criteria Retrieval (DB2)", role: "Pulls the FDA + payer criteria this PA must satisfy." },
  { id: "coverage", name: "Coverage Matching", role: "Maps each criterion to chart evidence: met / missing / contradicted." },
  { id: "reasoner", name: "Clinical Reasoner", role: "Reads the chart against each criterion by meaning and drafts cited answers." },
  { id: "strategy", name: "Payer Strategy", role: "Applies the payer's policy and the winning filing strategy." },
  { id: "model", name: "Historical Model (DB3)", role: "Blends the trained approval model with the KB base rate." },
  { id: "gap", name: "Gap Recovery", role: "For any unmet criterion, finds bypass / appeal pathways." },
  { id: "composer", name: "Final Composer", role: "Rolls everything into one approval prediction + next steps." },
];

const pct = (v?: number) => {
  if (v == null) return null;
  return v <= 1 ? Math.round(v * 100) : Math.round(v);
};

const predictionTone = (p?: string) => {
  const v = (p || "").toUpperCase();
  if (v.includes("APPROV")) return { bg: "#E6F3F0", color: "#005D49", label: "APPROVE" };
  if (v.includes("DENY") || v.includes("DENI")) return { bg: "#FFE8E8", color: "#CC0300", label: "DENY" };
  return { bg: "#FFF3E0", color: "#C24400", label: "PEND / REVIEW" };
};

const Spinner = () => (
  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-primaryGray-14 border-t-primaryGray-1" />
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-2 text-xs font-bold uppercase tracking-wide text-primaryGray-9">{children}</div>
);

const ScoreBar = ({ label, value }: { label: string; value?: number }) => {
  const p = pct(value);
  const color = p == null ? "#9CA3AF" : p >= 70 ? "#00A67E" : p >= 40 ? "#F59E0B" : "#EF4444";
  return (
    <div className="rounded-lg border border-primaryGray-14 bg-white px-3 py-2">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs text-primaryGray-4">{label}</span>
        <span className="text-xs font-bold" style={{ color }}>
          {p == null ? "—" : `${p}%`}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-primaryGray-16">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${p ?? 0}%`, backgroundColor: color }} />
      </div>
    </div>
  );
};

const FactList = ({ title, items, tone }: { title: string; items?: string[]; tone: "good" | "bad" | "warn" }) => {
  const toneCls =
    tone === "good"
      ? "border-l-[#22c55e] bg-[#F0FAF4]"
      : tone === "bad"
        ? "border-l-[#ef4444] bg-[#FEF2F2]"
        : "border-l-[#eab308] bg-[#FFFBEB]";
  const mark = tone === "good" ? "✓" : tone === "bad" ? "✗" : "→";
  return (
    <div className={`rounded-lg border border-primaryGray-13 border-l-4 p-3 ${toneCls}`}>
      <div className="mb-1.5 text-xs font-bold text-primaryGray-1">{title}</div>
      {items && items.length > 0 ? (
        <ul className="space-y-1">
          {items.map((t, i) => (
            <li key={i} className="text-xs leading-relaxed text-primaryGray-3">
              <span className="mr-1 font-bold">{mark}</span>
              {t}
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-xs text-primaryGray-9">None.</div>
      )}
    </div>
  );
};

const statusPill = (status?: string) => {
  const s = (status || "").toUpperCase();
  if (s.includes("MET") || s.includes("PRESENT") || s.includes("SUPPORT"))
    return { bg: "#E6F3F0", color: "#005D49", label: "Supported" };
  if (s.includes("RISK") || s.includes("CONTRA"))
    return { bg: "#FFE8E8", color: "#CC0300", label: "Contradicted" };
  return { bg: "#FFF3E0", color: "#C24400", label: "Needs docs" };
};

const GapCard = ({ gap }: { gap: GapRecoveryItem }) => {
  const imp = (gap.importance || "").toLowerCase();
  const impColor = imp.includes("crit") ? "#CC0300" : imp.includes("maj") ? "#C24400" : "#0056D6";
  return (
    <div className="rounded-lg border border-primaryGray-13 bg-white p-3">
      <div className="mb-1.5 flex flex-wrap items-center gap-2">
        <span className="text-small font-semibold text-primaryGray-1">{gap.criterion}</span>
        {gap.importance && (
          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase" style={{ color: impColor, backgroundColor: impColor + "1A" }}>
            {gap.importance}
          </span>
        )}
        {gap.bypass_possible && (
          <span className="rounded-full bg-primaryGray-16 px-2 py-0.5 text-[10px] font-semibold text-primaryGray-4">
            Bypass: {gap.bypass_possible}
          </span>
        )}
        {gap.appeal_strength && (
          <span className="rounded-full bg-primaryGray-16 px-2 py-0.5 text-[10px] font-semibold text-primaryGray-4">
            Appeal: {gap.appeal_strength}
          </span>
        )}
      </div>
      {gap.reviewer_intent && <p className="mb-2 text-xs italic text-primaryGray-7">{gap.reviewer_intent}</p>}
      {(gap.alternative_pathways?.length || 0) > 0 && (
        <div className="mb-1.5">
          <span className="text-[11px] font-bold uppercase text-primaryGray-9">Alternative pathways</span>
          <ul className="mt-0.5 space-y-0.5">
            {gap.alternative_pathways!.map((p, i) => (
              <li key={i} className="text-xs text-primaryGray-3">→ {p}</li>
            ))}
          </ul>
        </div>
      )}
      {(gap.appeal_arguments?.length || 0) > 0 && (
        <div>
          <span className="text-[11px] font-bold uppercase text-primaryGray-9">Appeal arguments</span>
          <ul className="mt-0.5 space-y-0.5">
            {gap.appeal_arguments!.map((p, i) => (
              <li key={i} className="text-xs text-primaryGray-3">• {p}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const MedicalNecessityAgents = ({
  open,
  onClose,
  drug,
  payer,
  supportiveTexts,
  contradictoryTexts,
  questions,
}: Props) => {
  const [result, setResult] = useState<NecessityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeStage, setActiveStage] = useState(0);
  const hasRun = useRef(false);

  const run = async () => {
    setLoading(true);
    setErrorMsg(null);
    setResult(null);
    setActiveStage(0);
    try {
      const res = await runNecessity({
        drug,
        payer_name: payer,
        supportive_texts: supportiveTexts.length ? supportiveTexts : null,
        contradictory_texts: contradictoryTexts.length ? contradictoryTexts : null,
        questions: questions.filter((q) => q.question).map((q) => ({ question: q.question })),
      });
      setResult(res);
    } catch {
      setErrorMsg("Could not reach the Medical Necessity Engine. Is the API deployed with CORS enabled?");
    } finally {
      setLoading(false);
    }
  };

  // Kick off a single run the first time the drawer opens.
  useEffect(() => {
    if (open && !hasRun.current) {
      hasRun.current = true;
      run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Animate the pipeline stages while the engine is working.
  useEffect(() => {
    if (!loading) return;
    setActiveStage(0);
    const t = setInterval(() => {
      setActiveStage((s) => (s < PIPELINE.length - 1 ? s + 1 : s));
    }, 550);
    return () => clearInterval(t);
  }, [loading]);

  const scores = result?.scores;
  const finalPred = result?.final?.approval_prediction || result?.final_prediction;
  const tone = predictionTone(finalPred);
  const confidence =
    pct(result?.final?.confidence_score) ?? pct(result?.final_confidence) ?? null;
  const approvalProb = pct(scores?.overall_approval_probability);
  const isLLM = result?.reasoning_mode === "llm";
  const coverage: CoverageMatrixItem[] = result?.coverage?.coverage_matrix ?? [];
  const clinicalAnswers = result?.clinical_answers?.answers ?? [];
  const gaps = result?.gap_recovery?.gaps ?? [];

  const agentTrace = useMemo(() => {
    if (result?.agents?.length) {
      return result.agents.map((a, i) => ({
        id: `a-${i}`,
        name: a.agent,
        role: a.role,
        mode: a.mode,
      }));
    }
    return PIPELINE.map((p) => ({ id: p.id, name: p.name, role: p.role, mode: undefined }));
  }, [result]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black bg-opacity-40" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-[760px] flex-col bg-[#F7F9FA] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-primaryGray-13 bg-white px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 rounded-md bg-primaryGray-1 px-2 py-1 text-tiny font-bold text-white">RISA AI</span>
            <div>
              <h2 className="text-large font-semibold text-primaryGray-1">Medical Necessity Engine · Agent Team</h2>
              <p className="mt-0.5 text-xs text-primaryGray-7">
                {drug || "—"} {payer ? `· ${payer}` : ""} — multi-agent staged reasoning over the chart & criteria.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={run}
              disabled={loading}
              className="rounded-md border border-primaryGray-13 bg-white px-3 py-1.5 text-xs font-semibold text-primaryGray-3 hover:bg-primaryGray-16 disabled:opacity-50"
            >
              {loading ? "Running…" : "Re-run"}
            </button>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-primaryGray-9 hover:bg-primaryGray-16 hover:text-primaryGray-1"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-5">
          {errorMsg && (
            <div className="mb-4 rounded-lg border border-[#fca5a5] bg-[#FEF2F2] px-3 py-2 text-small text-[#CC0300]">{errorMsg}</div>
          )}

          {/* Verdict banner */}
          {result && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primaryGray-13 bg-white p-4">
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wide text-primaryGray-9">Engine verdict</div>
                  <span className="mt-1 inline-block rounded-full px-3 py-1 text-body font-bold" style={{ backgroundColor: tone.bg, color: tone.color }}>
                    {tone.label}
                  </span>
                </div>
                {confidence != null && (
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wide text-primaryGray-9">Confidence</div>
                    <div className="mt-1 text-h10 font-bold text-primaryGray-1">{confidence}%</div>
                  </div>
                )}
                {approvalProb != null && (
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wide text-primaryGray-9">Approval likelihood</div>
                    <div className="mt-1 text-h10 font-bold" style={{ color: tone.color }}>{approvalProb}%</div>
                  </div>
                )}
              </div>
              <span
                className={`rounded-md px-2 py-1 text-[11px] font-bold ${isLLM ? "bg-[#005D49] text-white" : "bg-primaryGray-15 text-primaryGray-7"}`}
                title={isLLM ? "Reasoned by Claude over the criteria KB" : "Deterministic, rule-based reasoning"}
              >
                {isLLM ? "AI-REASONED (Claude)" : "RULE-BASED"}
              </span>
            </div>
          )}

          {/* Agent pipeline */}
          <div className="mb-5">
            <SectionTitle>Agent team {loading ? "· working…" : "· trace"}</SectionTitle>
            <div className="space-y-2">
              {agentTrace.map((a, i) => {
                const done = !loading || i < activeStage;
                const running = loading && i === activeStage;
                return (
                  <div
                    key={a.id}
                    className={`flex items-start gap-3 rounded-lg border bg-white px-3 py-2.5 transition-all ${
                      running ? "border-primaryGray-1 shadow-sm" : "border-primaryGray-13"
                    }`}
                  >
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                      {running ? (
                        <Spinner />
                      ) : done ? (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E6F3F0] text-[#005D49]">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </span>
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-primaryGray-14" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-small font-semibold text-primaryGray-1">
                          {i + 1}. {a.name}
                        </span>
                        {a.mode && (
                          <span className="rounded bg-primaryGray-16 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primaryGray-7">
                            {a.mode}
                          </span>
                        )}
                      </div>
                      <div className="text-xs leading-relaxed text-primaryGray-7">{a.role}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {loading && !result && (
            <div className="rounded-lg border border-primaryGray-13 bg-white px-4 py-6 text-center text-small text-primaryGray-8">
              Agents reasoning over the chart and criteria…
            </div>
          )}

          {result && (
            <>
              {/* Scores */}
              {scores && (
                <div className="mb-5">
                  <SectionTitle>Necessity scores</SectionTitle>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                    <ScoreBar label="Clinical match" value={scores.clinical_match_score} />
                    <ScoreBar label="Criteria coverage" value={scores.criteria_coverage_score} />
                    <ScoreBar label="Historical match" value={scores.historical_match_score} />
                    <ScoreBar label="Documentation" value={scores.documentation_score} />
                    <ScoreBar label="Approval probability" value={scores.overall_approval_probability} />
                    <ScoreBar label="Confidence" value={scores.confidence_score} />
                  </div>
                </div>
              )}

              {/* Deciding factors */}
              {result.deciding_factor && (
                <div className="mb-5">
                  <SectionTitle>Why — the deciding logic</SectionTitle>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                    <FactList title="Supporting" items={result.deciding_factor.supporting_reasons} tone="good" />
                    <FactList title="Missing requirements" items={result.deciding_factor.missing_requirements} tone="warn" />
                    <FactList title="Contradictions" items={result.deciding_factor.contradictions} tone="bad" />
                  </div>
                </div>
              )}

              {/* Final justification + next steps */}
              {result.final && (result.final.clinical_justification || (result.final.recommended_next_steps?.length || 0) > 0) && (
                <div className="mb-5 rounded-lg border border-primaryGray-13 bg-white p-3">
                  {result.final.clinical_justification && (
                    <>
                      <SectionTitle>Clinical justification</SectionTitle>
                      <p className="mb-2 text-small leading-relaxed text-primaryGray-2">{result.final.clinical_justification}</p>
                    </>
                  )}
                  {(result.final.recommended_next_steps?.length || 0) > 0 && (
                    <>
                      <div className="mt-1 text-[11px] font-bold uppercase text-primaryGray-9">Recommended next steps</div>
                      <ul className="mt-1 space-y-1">
                        {result.final.recommended_next_steps!.map((s, i) => (
                          <li key={i} className="text-xs text-primaryGray-3">→ {s}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}

              {/* Coverage matrix */}
              {coverage.length > 0 && (
                <div className="mb-5">
                  <SectionTitle>Coverage matrix — criteria vs. chart</SectionTitle>
                  <div className="overflow-hidden rounded-lg border border-primaryGray-13 bg-white">
                    {coverage.map((c, i) => {
                      const met = c.present && !c.missing;
                      return (
                        <div key={i} className="flex items-start justify-between gap-3 border-b border-primaryGray-16 px-3 py-2 last:border-b-0">
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-primaryGray-2">
                              {c.critical && <span className="mr-1 text-[#CC0300]">★</span>}
                              {c.requirement}
                            </div>
                            {c.supporting_document && (
                              <div className="text-[11px] italic text-primaryGray-8">Cite: {c.supporting_document}</div>
                            )}
                          </div>
                          <span
                            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                            style={met ? { backgroundColor: "#E6F3F0", color: "#005D49" } : { backgroundColor: "#FFE8E8", color: "#CC0300" }}
                          >
                            {met ? "MET" : "MISSING"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Per-question clinical answers */}
              {clinicalAnswers.length > 0 && (
                <div className="mb-5">
                  <SectionTitle>Drafted questionnaire answers (with reasoning)</SectionTitle>
                  <div className="space-y-2">
                    {clinicalAnswers.map((q, i) => {
                      const sp = statusPill(q.status);
                      return (
                        <div key={i} className="rounded-lg border border-primaryGray-13 bg-white p-3">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-semibold text-primaryGray-1">{q.question}</span>
                            <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: sp.bg, color: sp.color }}>
                              {sp.label}
                            </span>
                          </div>
                          {q.recommended_answer && (
                            <div className="mt-1 text-xs text-primaryGray-3">
                              <span className="font-semibold">Answer:</span> {q.recommended_answer}
                            </div>
                          )}
                          {q.justification && <div className="mt-0.5 text-xs text-primaryGray-7">{q.justification}</div>}
                          {q.citation && <div className="mt-0.5 text-xs italic text-primaryGray-8">Cite: {q.citation}</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Gap recovery */}
              {gaps.length > 0 && (
                <div className="mb-2">
                  <SectionTitle>Criteria gap recovery — how to still win unmet criteria</SectionTitle>
                  <div className="space-y-2">
                    {gaps.map((g, i) => (
                      <GapCard key={i} gap={g} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicalNecessityAgents;
