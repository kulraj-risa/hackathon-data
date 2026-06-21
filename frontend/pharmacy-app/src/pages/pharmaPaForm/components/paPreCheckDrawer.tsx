import { useEffect, useMemo, useRef, useState } from "react";
import {
  AnswerPacket,
  answerQuestionnaire,
  PredictResult,
  predictCase,
} from "../../../api/denialEngine";

export interface RequiredFieldCheck {
  label: string;
  value: string;
  critical?: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  drug: string;
  medicationClass: string;
  payer: string;
  diagnosisCode: string;
  diagnosisDesc: string;
  requiredFields: RequiredFieldCheck[];
  drugConfidence?: number | null;
}

// Small curated FDA-indication fallback so the indication check is meaningful
// even for drugs the engine KB hasn't deeply mined yet. The live engine value
// (criteria_match.fda_indication) is always preferred when present.
const INDICATION_FALLBACK: Record<string, string> = {
  lupron: "prostate cancer, endometriosis, central precocious puberty",
  leuprolide: "prostate cancer, endometriosis, central precocious puberty",
  eligard: "advanced prostate cancer",
  zepbound: "chronic weight management / obesity",
  wegovy: "chronic weight management / obesity",
  injectafer: "iron deficiency anemia",
  venofer: "iron deficiency anemia",
  gemtesa: "overactive bladder",
  tadalafil: "benign prostatic hyperplasia / erectile dysfunction",
  pembrolizumab: "various solid-tumor cancers (melanoma, NSCLC, etc.)",
};

const STOP = new Set([
  "the", "of", "and", "or", "a", "an", "with", "for", "to", "in", "on",
  "due", "other", "unspecified", "without", "type", "disease", "disorder",
]);
const SYN: Record<string, string> = {
  neoplasm: "cancer",
  malignant: "cancer",
  carcinoma: "cancer",
  tumor: "cancer",
  tumour: "cancer",
  obesity: "weight",
  anemia: "anaemia",
};
const tokens = (s: string) =>
  (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w))
    .map((w) => SYN[w] || w);

const Spinner = () => (
  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-primaryGray-14 border-t-primaryGray-1" />
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-2 text-xs font-bold uppercase tracking-wide text-primaryGray-9">{children}</div>
);

type CheckTone = "good" | "warn" | "bad";
const toneStyle: Record<CheckTone, { bg: string; color: string }> = {
  good: { bg: "#E6F3F0", color: "#005D49" },
  warn: { bg: "#FFF3E0", color: "#C24400" },
  bad: { bg: "#FFE8E8", color: "#CC0300" },
};

const Pill = ({ tone, children }: { tone: CheckTone; children: React.ReactNode }) => (
  <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase" style={toneStyle[tone]}>
    {children}
  </span>
);

const PIPELINE = [
  { id: "intake", name: "Form Intake", role: "Reads the PA form: patient, drug, diagnosis, payer & provider." },
  { id: "complete", name: "Completeness Audit", role: "Flags required fields that are empty or inconsistent." },
  { id: "indication", name: "Indication Match", role: "Checks the diagnosis is an on-label / FDA indication for the drug." },
  { id: "formulary", name: "Formulary & PBM Eligibility", role: "Matches the payer/PBM policy and historical approval pattern." },
  { id: "suggest", name: "Auto-fill Suggestions", role: "Proposes fixes for gaps before the form is filed." },
  { id: "verdict", name: "Readiness Verdict", role: "Rolls everything into a go / no-go fileability call." },
];

const PaPreCheckDrawer = ({
  open,
  onClose,
  drug,
  medicationClass,
  payer,
  diagnosisCode,
  diagnosisDesc,
  requiredFields,
  drugConfidence,
}: Props) => {
  const [predict, setPredict] = useState<PredictResult | null>(null);
  const [packet, setPacket] = useState<AnswerPacket | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [stage, setStage] = useState(0);
  const hasRun = useRef(false);

  const run = async () => {
    setLoading(true);
    setErrorMsg(null);
    setPredict(null);
    setPacket(null);
    setStage(0);
    try {
      const [p, ap] = await Promise.all([
        predictCase({
          patient: "",
          dob: "",
          member_id: "",
          cmm_id: `precheck-${drug}`,
          drug,
          medication: drug,
          medication_class: medicationClass || "Brand",
          payer_name: payer,
          total_questions: 10,
          answered_questions: 10,
        }),
        answerQuestionnaire({
          patient: "",
          dob: "",
          member_id: "",
          cmm_id: `precheck-${drug}`,
          drug,
          medication: drug,
          medication_class: medicationClass || "Brand",
          payer_name: payer,
          total_questions: 10,
          answered_questions: 10,
        }).catch(() => null),
      ]);
      setPredict(p);
      if (ap) setPacket(ap);
    } catch {
      setErrorMsg("Could not reach the engine for the pre-check. Is the API deployed with CORS enabled?");
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
    const t = setInterval(() => setStage((s) => (s < PIPELINE.length - 1 ? s + 1 : s)), 500);
    return () => clearInterval(t);
  }, [loading]);

  // ── Completeness ──
  const missing = useMemo(
    () => requiredFields.filter((f) => !f.value || String(f.value).trim() === ""),
    [requiredFields],
  );
  const criticalMissing = missing.filter((f) => f.critical);

  // ── Indication match ──
  const fdaIndication =
    predict?.criteria_match?.fda_indication ||
    INDICATION_FALLBACK[(drug || "").toLowerCase().split(/\s+/)[0]] ||
    "";
  const indication = useMemo(() => {
    if (!diagnosisDesc && !diagnosisCode) return { tone: "warn" as CheckTone, label: "No diagnosis on form", detail: "" };
    if (!fdaIndication) return { tone: "warn" as CheckTone, label: "Indication not in KB", detail: "" };
    const a = new Set(tokens(fdaIndication));
    const overlap = tokens(diagnosisDesc).filter((w) => a.has(w));
    if (overlap.length > 0)
      return { tone: "good" as CheckTone, label: "On-label match", detail: `Shared: ${[...new Set(overlap)].join(", ")}` };
    return { tone: "bad" as CheckTone, label: "Possible off-label", detail: "Diagnosis does not clearly match the FDA indication." };
  }, [fdaIndication, diagnosisDesc, diagnosisCode]);

  // ── Formulary / PBM ──
  const approvalRate = predict?.criteria_match?.approval_rate ?? predict?.criteria_match?.coverage ?? null;
  const matchedPolicy = packet?.payer_strategy?.matched_policy || null;
  const payerStrategies = packet?.payer_strategy?.strategy || [];

  // ── Verdict ──
  const verdict = useMemo(() => {
    if (criticalMissing.length > 0 || indication.tone === "bad")
      return { tone: "bad" as CheckTone, label: "Fix before filing" };
    if (missing.length > 0 || indication.tone === "warn")
      return { tone: "warn" as CheckTone, label: "Needs attention" };
    return { tone: "good" as CheckTone, label: "Ready to proceed" };
  }, [criticalMissing.length, missing.length, indication.tone]);

  // ── Auto-fill suggestions ──
  const suggestions = useMemo(() => {
    const s: string[] = [];
    missing.forEach((f) => s.push(`Pull "${f.label}" from the clinical note / EMR before continuing.`));
    if (drugConfidence != null && drugConfidence < 0.8)
      s.push(`Drug was auto-picked at ${Math.round(drugConfidence * 100)}% confidence — verify "${drug}" is correct.`);
    if (indication.tone === "bad")
      s.push("Add a covered secondary diagnosis or attach documentation supporting the requested indication.");
    return s;
  }, [missing, drugConfidence, drug, indication.tone]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black bg-opacity-40" onClick={onClose}>
      <div className="flex h-full w-full max-w-[720px] flex-col bg-[#F7F9FA] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between border-b border-primaryGray-13 bg-white px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 rounded-md bg-primaryGray-1 px-2 py-1 text-tiny font-bold text-white">RISA AI</span>
            <div>
              <h2 className="text-large font-semibold text-primaryGray-1">PA Pre-Check · Agent Team</h2>
              <p className="mt-0.5 text-xs text-primaryGray-7">
                {drug || "—"} {payer ? `· ${payer}` : ""} — validates the form before it reaches medical necessity.
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

          {/* Verdict banner */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primaryGray-13 bg-white p-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide text-primaryGray-9">Pre-check verdict</div>
              <span className="mt-1 inline-block rounded-full px-3 py-1 text-body font-bold" style={toneStyle[verdict.tone]}>
                {verdict.label}
              </span>
            </div>
            <div className="flex items-center gap-5 text-right">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wide text-primaryGray-9">Fields complete</div>
                <div className="mt-1 text-h10 font-bold text-primaryGray-1">
                  {requiredFields.length - missing.length}/{requiredFields.length}
                </div>
              </div>
              {approvalRate != null && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wide text-primaryGray-9">Hist. approval</div>
                  <div className="mt-1 text-h10 font-bold" style={{ color: toneStyle[verdict.tone].color }}>
                    {Math.round((approvalRate <= 1 ? approvalRate * 100 : approvalRate))}%
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Agent pipeline */}
          <div className="mb-5">
            <SectionTitle>Agent team {loading ? "· working…" : "· trace"}</SectionTitle>
            <div className="space-y-2">
              {PIPELINE.map((a, i) => {
                const done = !loading || i < stage;
                const running = loading && i === stage;
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
                      <div className="text-small font-semibold text-primaryGray-1">
                        {i + 1}. {a.name}
                      </div>
                      <div className="text-xs leading-relaxed text-primaryGray-7">{a.role}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Indication match */}
          <div className="mb-4 rounded-lg border border-primaryGray-13 bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <SectionTitle>Indication match · ICD ↔ drug</SectionTitle>
              <Pill tone={indication.tone}>{indication.label}</Pill>
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <div className="rounded-md bg-primaryGray-16 px-3 py-2">
                <div className="text-[11px] font-bold uppercase text-primaryGray-9">Diagnosis on form</div>
                <div className="text-small text-primaryGray-2">
                  {diagnosisCode ? <span className="font-semibold">{diagnosisCode}</span> : null} {diagnosisDesc || "—"}
                </div>
              </div>
              <div className="rounded-md bg-primaryGray-16 px-3 py-2">
                <div className="text-[11px] font-bold uppercase text-primaryGray-9">FDA indication ({drug})</div>
                <div className="text-small text-primaryGray-2">{fdaIndication || "Not on file"}</div>
              </div>
            </div>
            {indication.detail && <div className="mt-2 text-xs text-primaryGray-7">{indication.detail}</div>}
          </div>

          {/* Formulary / PBM */}
          <div className="mb-4 rounded-lg border border-primaryGray-13 bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <SectionTitle>Formulary & PBM eligibility</SectionTitle>
              <Pill tone={matchedPolicy ? "good" : "warn"}>{matchedPolicy ? "Policy matched" : "No policy on file"}</Pill>
            </div>
            <div className="text-small text-primaryGray-3">
              <span className="font-semibold">Payer / PBM:</span> {payer || "—"}
              {matchedPolicy && <span className="ml-1 text-primaryGray-7">· {matchedPolicy}</span>}
            </div>
            {payerStrategies.length > 0 && (
              <ul className="mt-2 space-y-1">
                {payerStrategies.map((s, i) => (
                  <li key={i} className="text-xs text-primaryGray-3">→ {s}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Completeness */}
          <div className="mb-4 rounded-lg border border-primaryGray-13 bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <SectionTitle>Form completeness</SectionTitle>
              <Pill tone={criticalMissing.length ? "bad" : missing.length ? "warn" : "good"}>
                {missing.length ? `${missing.length} gap${missing.length > 1 ? "s" : ""}` : "Complete"}
              </Pill>
            </div>
            <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
              {requiredFields.map((f, i) => {
                const ok = !!f.value && String(f.value).trim() !== "";
                return (
                  <div key={i} className="flex items-center justify-between rounded-md bg-primaryGray-16 px-3 py-1.5">
                    <span className="truncate text-xs text-primaryGray-3">
                      {f.critical && <span className="mr-1 text-[#CC0300]">★</span>}
                      {f.label}
                    </span>
                    <span className="text-xs font-bold" style={{ color: ok ? "#005D49" : "#CC0300" }}>
                      {ok ? "✓" : "Missing"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Auto-fill suggestions */}
          <div className="rounded-lg border border-primaryGray-13 bg-white p-4">
            <SectionTitle>AI suggestions</SectionTitle>
            {suggestions.length > 0 ? (
              <ul className="space-y-1.5">
                {suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-primaryGray-3">
                    <span className="mt-0.5 text-[#C24400]">→</span>
                    {s}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-xs text-primaryGray-9">No gaps detected — the form looks ready to file.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaPreCheckDrawer;
