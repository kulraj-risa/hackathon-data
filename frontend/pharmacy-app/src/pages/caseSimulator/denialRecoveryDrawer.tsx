import { useEffect, useRef, useState } from "react";
import {
  DenialRecoveryResult,
  runDenialRecovery,
} from "../../api/denialEngine";

interface Props {
  open: boolean;
  onClose: () => void;
  drug: string;
  payer: string;
  denialReason?: string;
  supportiveTexts: string[];
  contradictoryTexts: string[];
}

const PIPELINE = [
  { id: "ingest", name: "Data Ingestion", role: "Denial letter, submitted answers, records, labs, treatment history." },
  { id: "analysis", name: "Appeal Analysis Engine", role: "Denial reason vs. coverage criteria, FDA label, NCCN/ASCO." },
  { id: "rootcause", name: "Root Cause Identification", role: "Pinpoints the exact denial triggers." },
  { id: "scoring", name: "Appeal Scoring Model", role: "Appeal viability, approval probability, recovery potential." },
  { id: "optimize", name: "Appeal Optimization", role: "Missing evidence, required corrections, guideline references." },
  { id: "generate", name: "Auto Appeal Generation", role: "Drafts the appeal letter + supporting rationale." },
  { id: "ready", name: "Submission-Ready Appeal", role: "Complete, guideline-supported, ready to file." },
];

type Tone = "good" | "warn" | "bad";
const toneStyle: Record<Tone, { bg: string; color: string }> = {
  good: { bg: "#E6F3F0", color: "#005D49" },
  warn: { bg: "#FFF3E0", color: "#C24400" },
  bad: { bg: "#FFE8E8", color: "#CC0300" },
};

const viableTone = (v?: string): Tone => {
  const s = (v || "").toUpperCase();
  if (s === "YES") return "good";
  if (s === "NO") return "bad";
  return "warn";
};
const probTone = (p?: string): Tone => {
  const s = (p || "").toUpperCase();
  if (s === "HIGH") return "good";
  if (s === "LOW") return "bad";
  return "warn";
};

const Spinner = () => (
  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-primaryGray-14 border-t-primaryGray-1" />
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-2 text-xs font-bold uppercase tracking-wide text-primaryGray-9">{children}</div>
);

const Bullets = ({ items, mark = "•" }: { items?: string[]; mark?: string }) => (
  <ul className="space-y-1.5">
    {(items || []).map((t, i) => (
      <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-primaryGray-3">
        <span className="mt-0.5 shrink-0 font-bold text-primaryGray-6">{mark}</span>
        {t}
      </li>
    ))}
    {(!items || items.length === 0) && <li className="text-xs text-primaryGray-9">None.</li>}
  </ul>
);

const DenialRecoveryDrawer = ({
  open,
  onClose,
  drug,
  payer,
  denialReason,
  supportiveTexts,
  contradictoryTexts,
}: Props) => {
  const [result, setResult] = useState<DenialRecoveryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [stage, setStage] = useState(0);
  const [copied, setCopied] = useState(false);
  const hasRun = useRef(false);

  const run = async () => {
    setLoading(true);
    setErrorMsg(null);
    setResult(null);
    setStage(0);
    try {
      const res = await runDenialRecovery({
        drug,
        payer_name: payer,
        denial_reason: denialReason || null,
        supportive_texts: supportiveTexts.length ? supportiveTexts : null,
        contradictory_texts: contradictoryTexts.length ? contradictoryTexts : null,
      });
      setResult(res);
    } catch {
      setErrorMsg("Could not reach the Denial Recovery agent. Is the API deployed with CORS enabled?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && !hasRun.current) {
      hasRun.current = true;
      run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!loading) return;
    setStage(0);
    const t = setInterval(() => setStage((s) => (s < PIPELINE.length - 1 ? s + 1 : s)), 480);
    return () => clearInterval(t);
  }, [loading]);

  if (!open) return null;

  const a = result?.assessment;
  const cls = result?.classification;
  const isLLM = result?._mode === "llm";

  const copyLetter = () => {
    if (!result?.appeal_letter) return;
    navigator.clipboard.writeText(result.appeal_letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black bg-opacity-40" onClick={onClose}>
      <div className="flex h-full w-full max-w-[780px] flex-col bg-[#F7F9FA] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between border-b border-primaryGray-13 bg-white px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 rounded-md bg-[#CC0300] px-2 py-1 text-tiny font-bold text-white">RISA AI</span>
            <div>
              <h2 className="text-large font-semibold text-primaryGray-1">Post-Denial Recovery &amp; Appeal Specialist</h2>
              <p className="mt-0.5 text-xs text-primaryGray-7">
                {drug || "—"} {payer ? `· ${payer}` : ""} — can this denial be overturned, and how?
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={run}
              disabled={loading}
              className="rounded-md border border-primaryGray-13 bg-white px-3 py-1.5 text-xs font-semibold text-primaryGray-3 hover:bg-primaryGray-16 disabled:opacity-50"
            >
              {loading ? "Analyzing…" : "Re-run"}
            </button>
            <button onClick={onClose} className="rounded-full p-1 text-primaryGray-9 hover:bg-primaryGray-16 hover:text-primaryGray-1">
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

          {/* SECTION 1 — Appeal assessment */}
          {a && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primaryGray-13 bg-white p-4">
              <div className="flex flex-wrap items-center gap-5">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wide text-primaryGray-9">Appeal viable</div>
                  <span className="mt-1 inline-block rounded-full px-3 py-1 text-body font-bold" style={toneStyle[viableTone(a.appeal_viable)]}>
                    {a.appeal_viable}
                  </span>
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wide text-primaryGray-9">Approval probability</div>
                  <div className="mt-1 text-h10 font-bold" style={{ color: toneStyle[probTone(a.approval_probability)].color }}>
                    {a.approval_probability}
                    {a.approval_probability_pct != null && (
                      <span className="ml-1 text-small font-semibold">({a.approval_probability_pct}%)</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wide text-primaryGray-9">Recovery priority</div>
                  <div className="mt-1 text-h10 font-bold text-primaryGray-1">{a.recovery_priority}</div>
                </div>
              </div>
              <span
                className={`rounded-md px-2 py-1 text-[11px] font-bold ${isLLM ? "bg-[#005D49] text-white" : "bg-primaryGray-15 text-primaryGray-7"}`}
                title={isLLM ? "Reasoned by Claude" : "Deterministic, rule-based reasoning"}
              >
                {isLLM ? "AI-REASONED (Claude)" : "RULE-BASED"}
              </span>
            </div>
          )}

          {/* Classification banner */}
          {cls?.label && (
            <div className="mb-4 rounded-lg border-l-4 border-[#CC0300] bg-white px-4 py-3">
              <div className="text-[11px] font-bold uppercase tracking-wide text-primaryGray-9">Denial recovery classification</div>
              <div className="mt-0.5 text-small font-semibold text-primaryGray-1">
                #{cls.code} · {cls.label}
              </div>
            </div>
          )}

          {/* Agent pipeline */}
          <div className="mb-5">
            <SectionTitle>Recovery pipeline {loading ? "· working…" : "· trace"}</SectionTitle>
            <div className="space-y-2">
              {PIPELINE.map((p, i) => {
                const done = !loading || i < stage;
                const running = loading && i === stage;
                return (
                  <div
                    key={p.id}
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
                      <div className="text-small font-semibold text-primaryGray-1">{i + 1}. {p.name}</div>
                      <div className="text-xs leading-relaxed text-primaryGray-7">{p.role}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {loading && !result && (
            <div className="rounded-lg border border-primaryGray-13 bg-white px-4 py-6 text-center text-small text-primaryGray-8">
              Analyzing the denial and building the appeal…
            </div>
          )}

          {result && (
            <>
              {/* SECTION 2 — Root cause */}
              <div className="mb-4 rounded-lg border border-primaryGray-13 bg-white p-4">
                <SectionTitle>Root cause of denial</SectionTitle>
                <Bullets items={result.root_cause} mark="✗" />
              </div>

              {/* SECTION 3 — Recovery opportunities */}
              <div className="mb-4 rounded-lg border border-primaryGray-13 bg-white p-4">
                <SectionTitle>Recovery opportunities</SectionTitle>
                <Bullets items={result.recovery_opportunities} mark="→" />
              </div>

              {/* SECTION 4 — Required documents */}
              <div className="mb-4 rounded-lg border border-primaryGray-13 bg-white p-4">
                <SectionTitle>Required supporting documents</SectionTitle>
                <Bullets items={result.required_documents} mark="□" />
              </div>

              {/* SECTION 5 — Strategy */}
              {result.appeal_strategy && (
                <div className="mb-4 rounded-lg border border-primaryGray-13 bg-white p-4">
                  <SectionTitle>Best appeal strategy</SectionTitle>
                  <p className="text-small leading-relaxed text-primaryGray-2">{result.appeal_strategy}</p>
                </div>
              )}

              {/* SECTION 6 — Appeal letter */}
              {result.appeal_letter && (
                <div className="mb-4 rounded-lg border border-primaryGray-13 bg-white p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <SectionTitle>Appeal letter (submission-ready)</SectionTitle>
                    <button
                      onClick={copyLetter}
                      className="rounded-md border border-primaryGray-13 bg-white px-2.5 py-1 text-[11px] font-semibold text-primaryGray-3 hover:bg-primaryGray-16"
                    >
                      {copied ? "Copied ✓" : "Copy"}
                    </button>
                  </div>
                  <pre className="max-h-[320px] overflow-auto whitespace-pre-wrap rounded-md bg-primaryGray-16 p-3 text-xs leading-relaxed text-primaryGray-2">
                    {result.appeal_letter}
                  </pre>
                </div>
              )}

              {/* SECTION 7 — Automation output */}
              {result.automation && (
                <div className="rounded-lg border border-primaryGray-13 bg-white p-4">
                  <SectionTitle>Automation output</SectionTitle>
                  <div className="grid grid-cols-1 gap-px overflow-hidden rounded-md border border-primaryGray-15 bg-primaryGray-15 md:grid-cols-2">
                    {Object.entries(result.automation).map(([k, v]) => (
                      <div key={k} className="bg-white px-3 py-2">
                        <div className="text-[10px] font-bold uppercase tracking-wide text-primaryGray-9">{k.replace(/_/g, " ")}</div>
                        <div className="text-xs text-primaryGray-2">{v || "—"}</div>
                      </div>
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

export default DenialRecoveryDrawer;
