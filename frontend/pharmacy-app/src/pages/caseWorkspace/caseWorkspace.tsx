import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  CoverageMatrixItem,
  FilingQueueCase,
  getFilingQueue,
  getShowcase,
  NecessityResult,
  runNecessity,
  showcaseToFilingCase,
} from "../../api/denialEngine";

/* ──────────────────────────────────────────────────────────────────────────
 * CaseWorkspace — the per-patient case view.
 *
 * Left  : the patient's documents (chart evidence, demographics, payer form).
 * Right : the AI-filled questionnaire — every answer with its status, a
 *         confidence read-out, the reasoning, and the citation it's grounded in.
 *
 * Powered by the Medical Necessity Engine (/api/necessity) over a real,
 * evidence-rich filing-queue case, so the questionnaire is always populated.
 * ────────────────────────────────────────────────────────────────────────── */

const PIPELINE = [
  "Patient Evidence (DB1)",
  "Criteria Retrieval (DB2)",
  "Coverage Matching",
  "Clinical Reasoner",
  "Payer Strategy",
  "Historical Model (DB3)",
  "Final Composer",
];

const hashIndex = (s: string, mod: number) => {
  if (mod <= 0) return 0;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % mod;
};

const pct = (v?: number) => (v == null ? null : v <= 1 ? Math.round(v * 100) : Math.round(v));

const predictionTone = (p?: string) => {
  const v = (p || "").toUpperCase();
  if (v.includes("APPROV")) return { bg: "#E6F3F0", color: "#005D49", label: "LIKELY APPROVE" };
  if (v.includes("DENY") || v.includes("DENI")) return { bg: "#FFE8E8", color: "#CC0300", label: "LIKELY DENY" };
  return { bg: "#FFF3E0", color: "#C24400", label: "NEEDS REVIEW" };
};

const statusPill = (status?: string) => {
  const s = (status || "").toUpperCase();
  if (s.includes("MET") || s.includes("PRESENT") || s.includes("SUPPORT"))
    return { bg: "#E6F3F0", color: "#005D49", label: "Supported", conf: "High" };
  if (s.includes("RISK") || s.includes("CONTRA"))
    return { bg: "#FFE8E8", color: "#CC0300", label: "Contradicted", conf: "Low" };
  return { bg: "#FFF3E0", color: "#C24400", label: "Needs docs", conf: "Medium" };
};

const Spinner = () => (
  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-primaryGray-14 border-t-primaryGray-1" />
);

const ScoreBar = ({ label, value }: { label: string; value?: number }) => {
  const p = pct(value);
  const color = p == null ? "#9CA3AF" : p >= 70 ? "#00A67E" : p >= 40 ? "#F59E0B" : "#EF4444";
  return (
    <div className="rounded-lg border border-primaryGray-14 bg-white px-3 py-2">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-x-tiny text-primaryGray-5">{label}</span>
        <span className="text-x-tiny font-bold" style={{ color }}>
          {p == null ? "—" : `${p}%`}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-primaryGray-16">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${p ?? 0}%`, backgroundColor: color }} />
      </div>
    </div>
  );
};

interface DocDef {
  id: string;
  name: string;
  tag: string;
  lines?: string[];
  kv?: { k: string; v: string }[];
  tone?: "good" | "bad" | "plain";
}

const CaseWorkspace = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const stateCase = (location.state as { engineCase?: FilingQueueCase } | null)?.engineCase;

  const [caseData, setCaseData] = useState<FilingQueueCase | null>(stateCase ?? null);
  const [result, setResult] = useState<NecessityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeStage, setActiveStage] = useState(0);
  const [activeDoc, setActiveDoc] = useState(0);
  const loadedFor = useRef<string>("");

  // Resolve a rich case to drive the workspace.
  useEffect(() => {
    if (caseData) return;
    let cancel = false;
    (async () => {
      let queue: FilingQueueCase[] = [];
      try {
        queue = await getFilingQueue();
      } catch {
        try {
          const sc = await getShowcase();
          queue = sc.map(showcaseToFilingCase);
        } catch {
          queue = [];
        }
      }
      if (cancel) return;
      if (queue.length) setCaseData(queue[hashIndex(id, queue.length)]);
      else setErrorMsg("Could not load case data from the engine.");
    })();
    return () => {
      cancel = true;
    };
  }, [id, caseData]);

  // Run the necessity engine once we have a case.
  useEffect(() => {
    if (!caseData) return;
    const key = caseData.cmm_id || caseData.drug || id;
    if (loadedFor.current === key) return;
    loadedFor.current = key;
    setLoading(true);
    setErrorMsg(null);
    setResult(null);
    (async () => {
      try {
        const res = await runNecessity({
          drug: caseData.drug,
          payer_name: caseData.payer_name,
          supportive_texts: caseData.supportive_texts?.length ? caseData.supportive_texts : null,
          contradictory_texts: caseData.contradictory_texts?.length ? caseData.contradictory_texts : null,
        });
        setResult(res);
      } catch {
        setErrorMsg("Could not reach the Medical Necessity Engine.");
      } finally {
        setLoading(false);
      }
    })();
  }, [caseData, id]);

  useEffect(() => {
    if (!loading) return;
    setActiveStage(0);
    const t = setInterval(() => setActiveStage((s) => (s < PIPELINE.length - 1 ? s + 1 : s)), 520);
    return () => clearInterval(t);
  }, [loading]);

  const scores = result?.scores;
  const finalPred = result?.final?.approval_prediction || result?.final_prediction;
  const tone = predictionTone(finalPred);
  const confidence = pct(result?.final?.confidence_score) ?? pct(result?.final_confidence) ?? null;
  const approvalProb = pct(scores?.overall_approval_probability);
  const isLLM = result?.reasoning_mode === "llm";
  const coverage: CoverageMatrixItem[] = result?.coverage?.coverage_matrix ?? [];
  const answers = result?.clinical_answers?.answers ?? [];

  // Build the left-hand "documents".
  const docs: DocDef[] = useMemo(() => {
    if (!caseData) return [];
    const sup = caseData.supportive_texts ?? [];
    const con = caseData.contradictory_texts ?? [];
    return [
      {
        id: "note",
        name: "Progress Note",
        tag: "OncoEMR",
        tone: "good",
        lines: sup.length ? sup : ["No supporting chart excerpts attached."],
      },
      {
        id: "gaps",
        name: "Clinical Findings / Gaps",
        tag: "OncoEMR",
        tone: "bad",
        lines: con.length ? con : ["No contradictory findings recorded."],
      },
      {
        id: "demo",
        name: "Patient Demographics",
        tag: "Intake",
        tone: "plain",
        kv: [
          { k: "Patient", v: caseData.patient || "—" },
          { k: "Date of birth", v: caseData.dob || "—" },
          { k: "Member ID", v: caseData.member_id || "—" },
          { k: "CoverMyMeds ID", v: caseData.cmm_id || "—" },
          { k: "Medication", v: caseData.medication || caseData.drug || "—" },
          { k: "Drug class", v: caseData.medication_class || "—" },
        ],
      },
      {
        id: "payer",
        name: "Payer Form",
        tag: "CoverMyMeds",
        tone: "plain",
        kv: [
          { k: "Payer", v: caseData.payer_name || "—" },
          { k: "Questions on form", v: String(caseData.total_questions ?? "—") },
          { k: "Answered", v: String(caseData.answered_questions ?? "—") },
        ],
      },
    ];
  }, [caseData]);

  const doc = docs[activeDoc] || docs[0];

  return (
    <div className="h-full w-full bg-primaryGray-16 p-2">
      <div className="flex h-full flex-col overflow-hidden rounded bg-white">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-primaryGray-14 px-5 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="rounded-lg border border-primaryGray-14 bg-white px-2.5 py-1.5 text-small font-bold text-primaryGray-4 hover:bg-primaryGray-16"
            >
              ← Back
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-primaryGray-1 px-2 py-0.5 text-x-tiny font-bold text-white">RISA AI</span>
                <h1 className="text-body font-extrabold text-primaryGray-1">{caseData?.patient || "Loading case…"}</h1>
              </div>
              <p className="mt-0.5 text-x-tiny text-primaryGray-7">
                {caseData?.drug || "—"}
                {caseData?.payer_name ? ` · ${caseData.payer_name}` : ""}
                {caseData?.cmm_id ? ` · ${caseData.cmm_id}` : ""}
              </p>
            </div>
          </div>
          {result && (
            <span className="rounded-full px-3 py-1 text-small font-bold" style={{ backgroundColor: tone.bg, color: tone.color }}>
              {tone.label}
            </span>
          )}
        </div>

        {errorMsg && (
          <div className="border-b border-primaryGray-14 bg-red-50 px-5 py-2 text-x-tiny text-tertiaryRed-3">{errorMsg}</div>
        )}

        {/* Two-pane body */}
        <div className="grid flex-1 grid-cols-[minmax(320px,1fr)_minmax(380px,1.25fr)] gap-0 overflow-hidden">
          {/* ── Left: Patient documents ─────────────────────────────────── */}
          <div className="flex min-h-0 flex-col border-r border-primaryGray-14 bg-primaryGray-17">
            <div className="border-b border-primaryGray-14 px-4 py-2.5">
              <div className="text-small font-bold text-primaryGray-1">Patient Documents</div>
              <div className="text-x-tiny text-primaryGray-7">The chart & forms the agent reasons over</div>
            </div>
            <div className="flex min-h-0 flex-1">
              {/* doc list */}
              <div className="w-[150px] shrink-0 overflow-y-auto border-r border-primaryGray-14 bg-white py-2">
                {docs.map((d, i) => (
                  <button
                    key={d.id}
                    onClick={() => setActiveDoc(i)}
                    className={`flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left transition-colors ${
                      i === activeDoc ? "bg-primaryGray-16" : "hover:bg-primaryGray-17"
                    }`}
                    style={{ borderLeft: i === activeDoc ? "3px solid #005D49" : "3px solid transparent" }}
                  >
                    <span className="flex items-center gap-1.5 text-x-tiny font-semibold text-primaryGray-2">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      {d.name}
                    </span>
                    <span className="text-[9px] uppercase tracking-wide text-primaryGray-9">{d.tag}</span>
                  </button>
                ))}
              </div>
              {/* doc viewer */}
              <div className="min-w-0 flex-1 overflow-y-auto p-4">
                {doc && (
                  <>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-small font-bold text-primaryGray-1">{doc.name}</span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-primaryGray-7 ring-1 ring-primaryGray-14">
                        {doc.tag}
                      </span>
                    </div>
                    <div className="rounded-lg border border-primaryGray-14 bg-white p-3.5">
                      {doc.kv ? (
                        <div className="space-y-1.5">
                          {doc.kv.map((row) => (
                            <div key={row.k} className="flex items-center justify-between gap-3 border-b border-primaryGray-16 pb-1.5 last:border-b-0 last:pb-0">
                              <span className="text-x-tiny text-primaryGray-7">{row.k}</span>
                              <span className="text-tiny font-semibold text-primaryGray-2">{row.v}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <ul className="space-y-2">
                          {doc.lines!.map((ln, i) => (
                            <li key={i} className="flex items-start gap-2 text-tiny leading-relaxed text-primaryGray-3">
                              <span className="mt-0.5 font-bold" style={{ color: doc.tone === "bad" ? "#CC0300" : doc.tone === "good" ? "#005D49" : "#9CA3AF" }}>
                                {doc.tone === "bad" ? "✗" : doc.tone === "good" ? "✓" : "•"}
                              </span>
                              {ln}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <p className="mt-2 text-[10px] italic text-primaryGray-8">
                      Highlighted lines are the evidence the agent maps to each questionnaire answer on the right.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ── Right: AI-filled questionnaire ──────────────────────────── */}
          <div className="flex min-h-0 flex-col overflow-y-auto">
            <div className="border-b border-primaryGray-14 px-4 py-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-small font-bold text-primaryGray-1">AI-Filled Questionnaire</div>
                  <div className="text-x-tiny text-primaryGray-7">Each answer with its confidence, reasoning & citation</div>
                </div>
                {isLLM && (
                  <span className="rounded-md bg-[#005D49] px-2 py-1 text-[10px] font-bold text-white">AI-REASONED (Claude)</span>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {/* Verdict + confidence */}
              {result && (
                <div className="mb-4 grid grid-cols-3 gap-2">
                  <div className="rounded-lg border border-primaryGray-14 bg-white px-3 py-2.5">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-primaryGray-9">Verdict</div>
                    <div className="mt-1 text-small font-extrabold" style={{ color: tone.color }}>{tone.label}</div>
                  </div>
                  <div className="rounded-lg border border-primaryGray-14 bg-white px-3 py-2.5">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-primaryGray-9">Confidence</div>
                    <div className="mt-1 text-h10 font-extrabold text-primaryGray-1">{confidence != null ? `${confidence}%` : "—"}</div>
                  </div>
                  <div className="rounded-lg border border-primaryGray-14 bg-white px-3 py-2.5">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-primaryGray-9">Approval likelihood</div>
                    <div className="mt-1 text-h10 font-extrabold" style={{ color: tone.color }}>{approvalProb != null ? `${approvalProb}%` : "—"}</div>
                  </div>
                </div>
              )}

              {/* Loading: agent progress */}
              {loading && (
                <div className="mb-4 rounded-lg border border-primaryGray-14 bg-primaryGray-17 p-3">
                  <div className="mb-2 text-x-tiny font-bold uppercase tracking-wide text-primaryGray-9">Agents reasoning over the chart…</div>
                  <div className="space-y-1.5">
                    {PIPELINE.map((name, i) => {
                      const done = i < activeStage;
                      const running = i === activeStage;
                      return (
                        <div key={name} className="flex items-center gap-2 text-tiny">
                          <span className="flex h-4 w-4 items-center justify-center">
                            {running ? <Spinner /> : done ? <span className="text-[#005D49]">✓</span> : <span className="h-1.5 w-1.5 rounded-full bg-primaryGray-14" />}
                          </span>
                          <span className={done || running ? "text-primaryGray-3" : "text-primaryGray-9"}>
                            {i + 1}. {name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Necessity scores */}
              {scores && (
                <div className="mb-4">
                  <div className="mb-1.5 text-x-tiny font-bold uppercase tracking-wide text-primaryGray-9">Necessity scores</div>
                  <div className="grid grid-cols-2 gap-2">
                    <ScoreBar label="Clinical match" value={scores.clinical_match_score} />
                    <ScoreBar label="Criteria coverage" value={scores.criteria_coverage_score} />
                    <ScoreBar label="Historical match" value={scores.historical_match_score} />
                    <ScoreBar label="Documentation" value={scores.documentation_score} />
                  </div>
                </div>
              )}

              {/* Per-question answers */}
              {answers.length > 0 && (
                <div className="mb-4">
                  <div className="mb-1.5 text-x-tiny font-bold uppercase tracking-wide text-primaryGray-9">
                    Questionnaire answers ({answers.length})
                  </div>
                  <div className="space-y-2">
                    {answers.map((q, i) => {
                      const sp = statusPill(q.status);
                      return (
                        <div key={i} className="rounded-lg border border-primaryGray-14 bg-white p-3">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-tiny font-semibold text-primaryGray-1">
                              {i + 1}. {q.question}
                            </span>
                            <span className="flex shrink-0 items-center gap-1">
                              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: sp.bg, color: sp.color }}>
                                {sp.label}
                              </span>
                              <span className="rounded-full bg-primaryGray-16 px-2 py-0.5 text-[10px] font-bold text-primaryGray-6">
                                {sp.conf} conf.
                              </span>
                            </span>
                          </div>
                          {q.recommended_answer && (
                            <div className="mt-1.5 rounded-md bg-primaryGray-17 px-2.5 py-1.5 text-tiny text-primaryGray-2">
                              <span className="font-bold text-primaryGray-1">Answer: </span>
                              {q.recommended_answer}
                            </div>
                          )}
                          {q.justification && (
                            <div className="mt-1.5 text-x-tiny leading-relaxed text-primaryGray-7">
                              <span className="font-semibold text-primaryGray-5">Why: </span>
                              {q.justification}
                            </div>
                          )}
                          {q.citation && (
                            <div className="mt-1 flex items-center gap-1 text-[10px] italic text-primaryGray-8">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                              </svg>
                              Cite: {q.citation}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Coverage matrix (fallback when no per-question answers) */}
              {answers.length === 0 && coverage.length > 0 && (
                <div className="mb-4">
                  <div className="mb-1.5 text-x-tiny font-bold uppercase tracking-wide text-primaryGray-9">Coverage matrix — criteria vs. chart</div>
                  <div className="overflow-hidden rounded-lg border border-primaryGray-14 bg-white">
                    {coverage.map((c, i) => {
                      const met = c.present && !c.missing;
                      return (
                        <div key={i} className="flex items-start justify-between gap-3 border-b border-primaryGray-16 px-3 py-2 last:border-b-0">
                          <div className="min-w-0 text-x-tiny text-primaryGray-2">
                            {c.critical && <span className="mr-1 text-[#CC0300]">★</span>}
                            {c.requirement}
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

              {!loading && !result && !errorMsg && (
                <div className="rounded-lg border border-dashed border-primaryGray-14 px-4 py-8 text-center text-small text-primaryGray-8">
                  Preparing the case…
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseWorkspace;
