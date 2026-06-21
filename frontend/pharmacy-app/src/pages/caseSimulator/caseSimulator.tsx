import { useEffect, useMemo, useState } from "react";
import {
  EngineDecision,
  FilingQueueCase,
  getFilingQueue,
  PredictResult,
  predictCase,
} from "../../api/denialEngine";
import MedicalNecessityAgents from "../pharmaQuestionaire/components/medicalNecessityAgents";
import CaseQaReview from "../caseQaReview/caseQaReview";
import DenialRecoveryDrawer from "./denialRecoveryDrawer";
import WorkflowDiagram from "./workflowDiagram";
// Simulator: case replay + end-to-end workflow map + QA review.

type StageStatus = "idle" | "running" | "done";

interface StpOutcome {
  ready: boolean;
  gaps: string[];
}

interface SimRow extends FilingQueueCase {
  stpStatus: StageStatus;
  stpOutcome?: StpOutcome;
  clinicalStatus: StageStatus;
  clinicalResult?: PredictResult;
}

const workflowMeta: Record<EngineDecision, { label: string; chip: string }> = {
  AUTO_SUBMIT: { label: "Touchless · auto-file", chip: "bg-[#E6F3F0] text-[#005D49]" },
  REVIEW: { label: "Needs review", chip: "bg-[#FFF3E0] text-[#C24400]" },
  BLOCK: { label: "Block", chip: "bg-[#FFE8E8] text-[#CC0300]" },
};

const decisionLabel = (d?: string) => {
  const v = (d || "").toUpperCase();
  if (v.includes("AUTO")) return "AUTO_SUBMIT";
  if (v.includes("BLOCK")) return "BLOCK";
  return "REVIEW";
};

const riskText = (risk: number) =>
  risk >= 60 ? "text-[#CC0300]" : risk >= 30 ? "text-[#C24400]" : "text-[#005D49]";

// The first STP is administrative and automatic: capture the demographics we
// already have, verify eligibility, and auto-fill the step-therapy form. No
// denial-risk prediction happens here — that is the clinical (medical
// necessity) stage's job.
const STP_STAGES = [
  "Demographics capture",
  "Insurance / eligibility check",
  "Step-therapy form auto-fill",
];

// The first STP is touchless and deterministic — it runs automatically, no
// button. The only thing that can stop it being touchless is a genuine
// administrative gap (a missing demographic / eligibility field), which is
// what flips "Needs Review" to Yes (a human must complete the pre-STP steps).
const computeStp = (r: FilingQueueCase): StpOutcome => {
  const gaps: string[] = [];
  if (!r.patient) gaps.push("Patient name");
  if (!r.dob) gaps.push("Date of birth");
  if (!r.member_id) gaps.push("Member ID");
  if (!r.payer_name) gaps.push("Payer");
  if (!r.medication && !r.drug) gaps.push("Medication");
  return { ready: gaps.length === 0, gaps };
};

// A denial only "came" when the known/expected outcome is BLOCK or the
// simulated clinical decision blocked it — only then is Stage 3 relevant.
const isDenied = (expected: string | null, clinical: string | null): boolean =>
  expected === "BLOCK" || clinical === "BLOCK";

const Spinner = () => (
  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-primaryGray-14 border-t-primaryGray-1" />
);

const DemoField = ({ label, value }: { label: string; value?: string }) => (
  <div className="rounded-md bg-primaryGray-16 px-3 py-1.5">
    <div className="text-[10px] font-bold uppercase tracking-wide text-primaryGray-9">{label}</div>
    <div className="truncate text-xs text-primaryGray-2">{value || "—"}</div>
  </div>
);

const CaseSimulator = () => {
  const [rows, setRows] = useState<SimRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [clinicalCase, setClinicalCase] = useState<SimRow | null>(null);
  const [recoveryCase, setRecoveryCase] = useState<SimRow | null>(null);
  const [view, setView] = useState<"workflow" | "replay" | "review">("replay");

  const loadCases = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const queue = await getFilingQueue();
      setRows(
        queue.slice(0, 10).map((c) => ({
          ...c,
          // STP is touchless: it has already auto-completed by the time the
          // case lands in the worklist. We show its result, not a "Run" button.
          stpStatus: "done" as StageStatus,
          stpOutcome: computeStp(c),
          clinicalStatus: "idle" as StageStatus,
        })),
      );
    } catch {
      setErrorMsg("Could not load previous cases from the engine. Is the API deployed with CORS enabled?");
    } finally {
      setLoading(false);
    }
  };

  const removeCases = () => {
    setRows([]);
    setExpanded(null);
    setQuery("");
    setClinicalCase(null);
  };

  const key = (r: FilingQueueCase) => r.cmm_id || r.member_id || r.patient;

  // Stage 2 — the clinical / medical-necessity stage. This is where the denial
  // risk and the touchless decision are actually computed, then validated
  // against the known outcome. It also opens the multi-agent reasoning drawer.
  const simulateClinical = async (r: SimRow) => {
    const k = key(r);
    setClinicalCase(r);
    setRows((rs) => rs.map((x) => (key(x) === k ? { ...x, clinicalStatus: "running" } : x)));
    try {
      const res = await predictCase(r);
      setRows((rs) =>
        rs.map((x) => (key(x) === k ? { ...x, clinicalStatus: "done", clinicalResult: res } : x)),
      );
    } catch {
      setRows((rs) => rs.map((x) => (key(x) === k ? { ...x, clinicalStatus: "idle" } : x)));
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.patient, r.medication, r.drug, r.payer_name, r.cmm_id]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [rows, query]);

  const summary = useMemo(() => {
    const stpDone = rows.filter((r) => r.stpOutcome).length;
    let matches = 0;
    let validated = 0;
    rows.forEach((r) => {
      if (r.clinicalResult && r.expected_decision) {
        validated += 1;
        if (decisionLabel(r.clinicalResult.decision) === decisionLabel(String(r.expected_decision)))
          matches += 1;
      }
    });
    return { stpDone, matches, validated, accuracy: validated ? Math.round((matches / validated) * 100) : null };
  }, [rows]);

  const COLS = "grid-cols-[1.3fr_1.1fr_0.9fr_0.9fr_0.9fr_1fr_0.8fr_28px]";

  return (
    <div className="case-sim__layout h-full w-full bg-primaryGray-16 p-2">
      <div className="case-sim__inner flex h-full flex-col gap-3 overflow-hidden rounded bg-white p-4">
        {/* View toggle: end-to-end workflow map vs. case replay */}
        <div className="flex w-fit items-center gap-1 rounded-lg border border-primaryGray-14 bg-primaryGray-16 p-1">
          {([
            { id: "replay", label: "Case Replay" },
            { id: "workflow", label: "Workflow" },
            { id: "review", label: "QA Review" },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              className={`rounded-md px-3.5 py-1.5 text-small font-bold transition-colors ${
                view === t.id ? "bg-white text-primaryGray-1 shadow-sm" : "text-primaryGray-7 hover:text-primaryGray-3"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {view === "workflow" && <WorkflowDiagram />}

        {view === "review" && <CaseQaReview embedded />}

        {view === "replay" && (
          <>
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-h11 font-bold text-primaryGray-1">PA Simulator</div>
            <div className="mt-0.5 max-w-[680px] text-tiny text-primaryGray-7">
              Replay previously-filed cases through the agents: Stage 1 auto-fills demographics + STP (no
              prediction — it just completes), Stage 2 assesses clinical medical-necessity and denial risk,
              and validates against the known outcome.
            </div>
          </div>
          <div className="flex items-center gap-2">
            {summary.accuracy != null && (
              <div className="flex items-center gap-2">
                <span className="rounded-lg border border-primaryGray-14 bg-white px-3 py-2 text-center">
                  <span className="block text-h10 font-bold text-[#005D49]">{summary.accuracy}%</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-primaryGray-8">
                    Clinical vs expected
                  </span>
                </span>
              </div>
            )}
            <button
              onClick={loadCases}
              disabled={loading}
              className="rounded-lg bg-primaryGray-1 px-3.5 py-2 text-small font-bold text-white hover:bg-primaryGray-5 disabled:opacity-50"
            >
              {loading ? "Loading…" : "Load 10 cases"}
            </button>
            <button
              onClick={removeCases}
              disabled={rows.length === 0}
              className="rounded-lg border border-primaryGray-14 bg-white px-3.5 py-2 text-small font-bold text-primaryGray-3 hover:bg-primaryGray-16 disabled:opacity-40"
            >
              Remove
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="rounded-lg border border-[#fca5a5] bg-[#FEF2F2] px-3 py-2 text-small text-[#CC0300]">
            {errorMsg}
          </div>
        )}

        {/* Search (scoped to loaded cases) */}
        {rows.length > 0 && (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search loaded cases — patient, drug, payer, CMM ID…"
              className="min-w-[260px] flex-1 rounded-lg border border-primaryGray-14 bg-white px-3 py-2 text-small text-primaryGray-3 placeholder:text-primaryGray-9 focus:border-primaryGray-1 focus:outline-none"
            />
            <span className="text-x-tiny text-primaryGray-8">
              {filtered.length} of {rows.length} · {summary.stpDone} STP simulated
            </span>
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {rows.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="text-small font-semibold text-primaryGray-7">No cases loaded.</div>
              <div className="mt-1 text-x-tiny text-primaryGray-9">
                Click <b>Load 10 cases</b> to pull previously-filed PAs and simulate them through the agents.
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-primaryGray-14">
              <div
                className={`grid ${COLS} items-center gap-2 border-b border-primaryGray-14 bg-primaryGray-16 px-4 py-2.5 text-x-tiny font-bold uppercase tracking-wide text-primaryGray-7`}
              >
                <span>Patient</span>
                <span>Medication</span>
                <span>Payer</span>
                <span>1st STP</span>
                <span>Needs Review</span>
                <span>Clinical risk</span>
                <span>Expected</span>
                <span />
              </div>

              {filtered.map((r) => {
                const k = key(r);
                const isOpen = expanded === k;
                const clinicalDecision = r.clinicalResult ? decisionLabel(r.clinicalResult.decision) : null;
                const wf = clinicalDecision ? workflowMeta[clinicalDecision as EngineDecision] : null;
                const expected = r.expected_decision ? decisionLabel(String(r.expected_decision)) : null;
                const match = clinicalDecision && expected ? clinicalDecision === expected : null;
                // Needs Review = Yes only when the pre-STP steps couldn't be
                // completed touchlessly (an administrative gap). Otherwise the
                // first STP was touchless and no human is needed.
                const needsReview = r.stpOutcome ? !r.stpOutcome.ready : false;
                const denied = isDenied(expected, clinicalDecision);
                return (
                  <div key={k} className="border-b border-primaryGray-16 last:border-b-0">
                    <div
                      className={`grid ${COLS} cursor-pointer items-center gap-2 px-4 py-3 text-small hover:bg-primaryGray-17`}
                      onClick={() => setExpanded(isOpen ? null : k)}
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
                        {r.stpOutcome?.ready ? (
                          <span className="inline-block rounded-md bg-[#E6F3F0] px-2 py-0.5 text-x-tiny font-bold text-[#005D49]">
                            Touchless ✓
                          </span>
                        ) : (
                          <span className="inline-block rounded-md bg-[#FFF3E0] px-2 py-0.5 text-x-tiny font-bold text-[#C24400]">
                            Pending
                          </span>
                        )}
                      </div>
                      <div>
                        {needsReview ? (
                          <span className="inline-block rounded-md bg-[#FFF3E0] px-2 py-0.5 text-x-tiny font-bold text-[#C24400]">
                            Yes · human
                          </span>
                        ) : (
                          <span className="inline-block rounded-md bg-[#E6F3F0] px-2 py-0.5 text-x-tiny font-bold text-[#005D49]">
                            No
                          </span>
                        )}
                      </div>
                      <div>
                        {r.clinicalStatus === "running" ? (
                          <span className="inline-flex items-center gap-1 text-x-tiny text-primaryGray-7">
                            <Spinner /> assessing…
                          </span>
                        ) : r.clinicalResult && wf ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span className={`inline-block rounded-md px-2 py-0.5 text-x-tiny font-bold ${wf.chip}`}>
                              {wf.label}
                            </span>
                            <span className={`text-x-tiny font-bold ${riskText(r.clinicalResult.denial_risk)}`}>
                              {Math.round(r.clinicalResult.denial_risk)}%
                            </span>
                          </span>
                        ) : (
                          <span className="text-x-tiny text-primaryGray-9">not run</span>
                        )}
                      </div>
                      <div>
                        {expected ? (
                          <span className="inline-flex items-center gap-1 text-x-tiny font-semibold text-primaryGray-4">
                            {workflowMeta[expected as EngineDecision]?.label.split(" ")[0] || expected}
                            {match != null && (
                              <span className={match ? "text-[#005D49]" : "text-[#CC0300]"}>
                                {match ? "✓" : "✗"}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-x-tiny text-primaryGray-9">—</span>
                        )}
                      </div>
                      <div className="text-center text-primaryGray-9">{isOpen ? "▾" : "▸"}</div>
                    </div>

                    {isOpen && (
                      <div className="space-y-4 bg-primaryGray-17 px-4 py-4">
                        {/* Stage 1 · STP */}
                        <div className="rounded-lg border border-primaryGray-14 bg-white p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <span className="text-small font-bold text-primaryGray-1">
                              Stage 1 · Demographics + STP
                            </span>
                            <span className="rounded-md bg-[#E6F3F0] px-2.5 py-1 text-[11px] font-bold text-[#005D49]">
                              Automatic · touchless
                            </span>
                          </div>

                          {/* demographics captured */}
                          <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-3">
                            <DemoField label="Patient" value={r.patient} />
                            <DemoField label="DOB" value={r.dob} />
                            <DemoField label="Member ID" value={r.member_id} />
                            <DemoField label="Drug" value={r.medication} />
                            <DemoField label="Payer" value={r.payer_name} />
                            <DemoField label="CMM ID" value={r.cmm_id} />
                          </div>

                          {/* staged pipeline — all auto-completed */}
                          <div className="mb-3 flex flex-wrap gap-2">
                            {STP_STAGES.map((s) => (
                              <span
                                key={s}
                                className="inline-flex items-center gap-1.5 rounded-full border border-[#bfe3d8] bg-[#E6F3F0] px-2.5 py-1 text-[11px] font-semibold text-[#005D49]"
                              >
                                ✓ {s}
                              </span>
                            ))}
                          </div>

                          {/* STP outcome — administrative only, no denial prediction */}
                          {r.stpOutcome && (
                            <div className="flex flex-wrap items-center gap-3 rounded-md bg-primaryGray-16 px-3 py-2">
                              {r.stpOutcome.ready ? (
                                <>
                                  <span className="rounded-md bg-[#E6F3F0] px-2 py-0.5 text-x-tiny font-bold text-[#005D49]">
                                    STP complete · auto-filed
                                  </span>
                                  <span className="text-xs text-primaryGray-7">
                                    Demographics captured, eligibility verified, and the step-therapy form was
                                    filled automatically. Ready for clinical review.
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="rounded-md bg-[#FFF3E0] px-2 py-0.5 text-x-tiny font-bold text-[#C24400]">
                                    Needs Review · human
                                  </span>
                                  <span className="text-xs text-primaryGray-7">
                                    The pre-STP steps could not complete touchlessly — a human must supply:{" "}
                                    {r.stpOutcome.gaps.join(", ")}.
                                  </span>
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Stage 2 · Clinicals (Medical Necessity) — denial risk & issues live here */}
                        <div className="rounded-lg border border-primaryGray-14 bg-white p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-small font-bold text-primaryGray-1">
                                Stage 2 · Clinicals (Medical Necessity)
                              </span>
                              <p className="mt-0.5 text-xs text-primaryGray-7">
                                Loads the real clinical evidence, assesses denial risk, and runs the multi-agent
                                necessity engine. This is where approval issues are surfaced.
                              </p>
                            </div>
                            <button
                              onClick={() => simulateClinical(r)}
                              disabled={r.clinicalStatus === "running"}
                              className="rounded-md bg-[#005D49] px-3 py-1.5 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
                            >
                              {r.clinicalStatus === "running"
                                ? "Assessing…"
                                : r.clinicalResult
                                  ? "Re-open Reasoning"
                                  : "Simulate Clinicals"}
                            </button>
                          </div>

                          {/* Clinical denial-risk verdict + validation vs known outcome */}
                          {r.clinicalResult && wf && (
                            <div className="mt-3 flex flex-wrap items-center gap-4 rounded-md bg-primaryGray-16 px-3 py-2">
                              <span className={`rounded-md px-2 py-0.5 text-x-tiny font-bold ${wf.chip}`}>
                                {wf.label}
                              </span>
                              <span className="text-xs text-primaryGray-4">
                                Denial risk:{" "}
                                <b className={riskText(r.clinicalResult.denial_risk)}>
                                  {Math.round(r.clinicalResult.denial_risk)}%
                                </b>
                              </span>
                              {expected && (
                                <span className="text-xs text-primaryGray-4">
                                  Known outcome:{" "}
                                  <b>{workflowMeta[expected as EngineDecision]?.label.split(" ")[0] || expected}</b>{" "}
                                  {match != null && (
                                    <span className={match ? "text-[#005D49]" : "text-[#CC0300]"}>
                                      {match ? "✓ match" : "✗ differs"}
                                    </span>
                                  )}
                                </span>
                              )}
                              {r.clinicalResult.decision_reason && (
                                <span className="text-xs text-primaryGray-7">{r.clinicalResult.decision_reason}</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Stage 3 · Post-Denial Recovery — only relevant once a denial has come */}
                        {denied ? (
                          <div className="rounded-lg border border-[#f3c7c7] bg-white p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-small font-bold text-primaryGray-1">
                                  Stage 3 · Post-Denial Recovery
                                </span>
                                <p className="mt-0.5 text-xs text-primaryGray-7">
                                  This PA was denied — run the appeal specialist: viability, root cause,
                                  recovery opportunities, and a submission-ready appeal letter.
                                </p>
                              </div>
                              <button
                                onClick={() => setRecoveryCase(r)}
                                className="rounded-md bg-[#CC0300] px-3 py-1.5 text-xs font-bold text-white hover:opacity-90"
                              >
                                Recover Denial
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-lg border border-dashed border-primaryGray-14 bg-white px-4 py-3 text-xs text-primaryGray-8">
                            Stage 3 · Post-Denial Recovery activates only if this PA is denied. No denial
                            on record{r.clinicalResult ? "" : " yet — run Stage 2 to assess"}, so no appeal
                            is needed.
                          </div>
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
        )}
      </div>

      {/* Clinicals drawer (reuses the Medical Necessity agent team) */}
      <MedicalNecessityAgents
        key={clinicalCase ? key(clinicalCase) : "none"}
        open={!!clinicalCase}
        onClose={() => setClinicalCase(null)}
        drug={clinicalCase?.drug || ""}
        payer={clinicalCase?.payer_name || ""}
        supportiveTexts={clinicalCase?.supportive_texts || []}
        contradictoryTexts={clinicalCase?.contradictory_texts || []}
        questions={[]}
      />

      {/* Post-denial recovery drawer */}
      <DenialRecoveryDrawer
        key={recoveryCase ? `rec-${key(recoveryCase)}` : "rec-none"}
        open={!!recoveryCase}
        onClose={() => setRecoveryCase(null)}
        drug={recoveryCase?.drug || ""}
        payer={recoveryCase?.payer_name || ""}
        supportiveTexts={recoveryCase?.supportive_texts || []}
        contradictoryTexts={recoveryCase?.contradictory_texts || []}
      />
    </div>
  );
};

export default CaseSimulator;
