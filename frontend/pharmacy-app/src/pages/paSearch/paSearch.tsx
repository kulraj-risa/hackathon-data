import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchPaCasesFromBigQuery } from "../../api/bigQuery/paCasesBigQuery";
import CustomTable from "../../components/custom-table/custom-table";
import {
  TableCellType,
  TableHeader,
} from "../../components/custom-table/table";
import { capitalizeString } from "../../utils/stringModifications";
import {
  answerQuestionnaire,
  AnswerPacket,
  FilingQueueCase,
  predictCase,
} from "../../api/denialEngine";

/* ── RISA denial-engine helpers ─────────────────────────────────────────── */
const getPayer = (r: any): string =>
  r?.coverage?.primary?.payer_name ||
  r?.payer ||
  r?.pa_request?.payer ||
  "";

const getDrugName = (r: any): string =>
  r?.drug?.drug_name_onco_emr || r?.drug?.drug_name || "";

const buildEngineCase = (r: any): FilingQueueCase => {
  const drug = getDrugName(r);
  const name = [r?.patient?.first_name, r?.patient?.last_name]
    .filter(Boolean)
    .join(" ");
  return {
    patient: name,
    dob: r?.patient?.dob ?? "",
    member_id: r?.coverage?.primary?.member_id ?? "",
    cmm_id: r?.identifier ?? "",
    drug,
    medication: drug,
    medication_class: "Brand",
    payer_name: getPayer(r),
    total_questions: 10,
    answered_questions: 10,
  };
};

const riskBadge = (risk: number) => {
  if (risk >= 60) return { bg: "#FFE8E8", color: "#CC0300" };
  if (risk >= 30) return { bg: "#FFF3E0", color: "#C24400" };
  return { bg: "#E6F3F0", color: "#005D49" };
};

const DECISION_META: Record<string, { label: string; bg: string; color: string }> = {
  AUTO_SUBMIT: { label: "AUTO-FILE", bg: "#E6F3F0", color: "#005D49" },
  REVIEW: { label: "REVIEW", bg: "#FFF3E0", color: "#C24400" },
  BLOCK: { label: "BLOCK", bg: "#FFE8E8", color: "#CC0300" },
};

interface Prediction {
  risk: number;
  decision: string;
}

const PA_TABLE_HEADERS: TableHeader[] = [
  {
    label: "First Name",
    key: "firstName",
    order: 0,
    width: 15,
    sortable: true,
    type: TableCellType.STRING,
  },
  {
    label: "Last Name",
    key: "lastName",
    order: 1,
    width: 15,
    sortable: true,
    type: TableCellType.STRING,
  },
  {
    label: "DOB",
    key: "dob",
    order: 2,
    width: 12,
    sortable: true,
    type: TableCellType.STRING,
  },
  {
    label: "Drug",
    key: "drug",
    order: 3,
    width: 15,
    sortable: true,
    type: TableCellType.STRING,
  },
  {
    label: "Payer",
    key: "payer",
    order: 4,
    width: 15,
    sortable: true,
    type: TableCellType.STRING,
  },
  {
    label: "Denial risk",
    key: "risk",
    order: 5,
    width: 11,
    sortable: true,
    type: TableCellType.BADGE,
  },
  {
    label: "Decision",
    key: "decision",
    order: 6,
    width: 13,
    sortable: true,
    type: TableCellType.BADGE,
  },
  {
    label: "Action",
    key: "action",
    order: 7,
    width: 12,
    sortable: false,
    type: TableCellType.BUTTON_WITH_THREE_DOTS,
  },
];

interface WorkflowEvent {
  event_action_name?: string;
  event_action_description?: string;
  event_platform?: string;
  event_status?: string;
  event_status_description?: string;
  event_start_time?: string;
  event_end_time?: string;
  event_source?: string;
  event_show_on_ui?: string;
}

const emptyBadge = (text: string) => ({
  text,
  displayText: text,
  color: "#6B7280",
  bgColor: "#F5F5F5",
});

const mapRowsToTableData = (
  rows: any[],
  predictions: Record<string, Prediction> = {},
): Record<string, any>[] =>
  rows
    .map((r: any) => {
      const id = r.identifier ?? "";
      const pred = predictions[id];
      const riskCell = pred
        ? (() => {
            const b = riskBadge(pred.risk);
            const t = `${Math.round(pred.risk)}%`;
            return { text: t, displayText: t, color: b.color, bgColor: b.bg };
          })()
        : emptyBadge("…");
      const decisionCell = pred
        ? (() => {
            const m = DECISION_META[pred.decision] ?? {
              label: pred.decision || "—",
              bg: "#F5F5F5",
              color: "#6B7280",
            };
            return {
              text: m.label,
              displayText: m.label,
              color: m.color,
              bgColor: m.bg,
            };
          })()
        : emptyBadge("…");

      return {
        id,
        firstName: capitalizeString(r.patient?.first_name ?? ""),
        lastName: capitalizeString(r.patient?.last_name ?? ""),
        dob: r.patient?.dob ?? "",
        drug: capitalizeString(getDrugName(r)),
        payer: getPayer(r) || "—",
        risk: riskCell,
        decision: decisionCell,
        _risk: pred ? pred.risk : -1,
        action: {
          label: "Workflow",
          buttonId: "run_case",
          disabled: false,
          rowId: id,
          threeDotsOptions: [],
          showNavigateArrow: true,
          navigateArrowId: "view_details",
        },
      };
    })
    .sort((a, b) => b._risk - a._risk);

/* Status badge style — matches outcomeBadgeStyle pattern */
const statusBadge = (status?: string) => {
  const s = (status ?? "").toLowerCase();
  if (s === "success") return { bg: "#E6F3F0", color: "#005D49" };
  if (s === "error") return { bg: "#FFE8E8", color: "#CC0300" };
  if (s === "pending" || s === "in progress")
    return { bg: "#FFF3E0", color: "#C24400" };
  return { bg: "#F5F5F5", color: "#0F0F0F" };
};

const EMPTY_NEW_CASE = {
  firstName: "",
  lastName: "",
  mrn: "",
  dob: "",
  drug: "",
  providerName: "",
};

const PaSearch = () => {
  const navigate = useNavigate();
  const [tableData, setTableData] = useState<Record<string, any>[]>([]);
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [rawCount, setRawCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [predictions, setPredictions] = useState<Record<string, Prediction>>(
    {},
  );
  const [scoring, setScoring] = useState(false);

  // RISA AI review (multi-agent reasoning) modal state
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPacket, setAiPacket] = useState<AnswerPacket | null>(null);
  const [aiCase, setAiCase] = useState<{
    name: string;
    drug: string;
    payer: string;
  } | null>(null);

  // Workflow modal state
  const [workflowModalOpen, setWorkflowModalOpen] = useState(false);
  const [workflowEvents, setWorkflowEvents] = useState<WorkflowEvent[]>([]);
  const [workflowPatientName, setWorkflowPatientName] = useState("");
  const [currentStepElapsed, setCurrentStepElapsed] = useState(0);
  const [workflowOutcome, setWorkflowOutcome] = useState<
    "approved" | "denied" | null
  >(null);
  const [newCaseCounter, setNewCaseCounter] = useState(0);
  const [showOutcomeView, setShowOutcomeView] = useState(false);
  const [selectedOutcomeAction, setSelectedOutcomeAction] = useState<any>(null);

  // New case modal state
  const [newCaseModalOpen, setNewCaseModalOpen] = useState(false);
  const [newCaseForm, setNewCaseForm] = useState({ ...EMPTY_NEW_CASE });
  const [drugSearch, setDrugSearch] = useState("");
  const [drugDropdownOpen, setDrugDropdownOpen] = useState(false);
  const [providerDropdownOpen, setProviderDropdownOpen] = useState(false);
  const [providerSearch, setProviderSearch] = useState("");
  const drugRef = useRef<HTMLDivElement>(null);
  const providerRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      console.log("Fetching data from BigQuery...");
      const data = await fetchPaCasesFromBigQuery(1, 500);
      console.log("BigQuery response:", data);
      const rows = data.rows ?? [];
      setRawCount(rows.length);
      setRawRows(rows);
      setTableData(mapRowsToTableData(rows));
    } catch (err) {
      console.error("PA fetch failed:", err);
      console.error(
        "Error details:",
        err instanceof Error ? err.message : String(err),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Score the visible caseload against the live denial engine, then sort by risk
  useEffect(() => {
    if (rawRows.length === 0) return;
    let cancelled = false;
    const toScore = rawRows.filter((r: any) => getDrugName(r)).slice(0, 60);
    if (toScore.length === 0) return;

    (async () => {
      setScoring(true);
      const next: Record<string, Prediction> = {};
      await Promise.all(
        toScore.map(async (r: any) => {
          const id = r.identifier ?? "";
          try {
            const res = await predictCase(buildEngineCase(r));
            next[id] = {
              risk: res.denial_risk ?? 0,
              decision: res.decision ?? "",
            };
          } catch {
            /* leave unscored — row shows "…" */
          }
        }),
      );
      if (!cancelled) {
        setPredictions(next);
        setScoring(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [rawRows]);

  // Re-render the table whenever fresh predictions arrive (re-sorts by risk)
  useEffect(() => {
    if (rawRows.length === 0) return;
    setTableData(mapRowsToTableData(rawRows, predictions));
  }, [rawRows, predictions]);

  const filteredData = useMemo(() => {
    if (!searchText.trim()) return tableData;
    const q = searchText.toLowerCase();
    return tableData.filter(
      (row) =>
        (row.firstName ?? "").toLowerCase().includes(q) ||
        (row.lastName ?? "").toLowerCase().includes(q) ||
        (row.dob ?? "").toLowerCase().includes(q) ||
        (row.drug ?? "").toLowerCase().includes(q) ||
        (row.payer ?? "").toLowerCase().includes(q) ||
        (row.id ?? "").toLowerCase().includes(q),
    );
  }, [tableData, searchText]);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleRowClick = useCallback(
    (data: any) => {
      const id = data?.id ?? "";
      const row = rawRows.find((r: any) => r.identifier === id);
      if (!row) {
        if (id) navigate(`/pharma-pa-worklists/insurance-details/${id}`);
        return;
      }
      const name = [row.patient?.first_name, row.patient?.last_name]
        .filter(Boolean)
        .join(" ");
      setAiCase({
        name: capitalizeString(name),
        drug: capitalizeString(getDrugName(row)),
        payer: getPayer(row) || "—",
      });
      setAiPacket(null);
      setAiLoading(true);
      setAiOpen(true);
      answerQuestionnaire(buildEngineCase(row))
        .then((packet) => setAiPacket(packet))
        .catch((err) => {
          console.error("AI review failed:", err);
          setAiPacket(null);
        })
        .finally(() => setAiLoading(false));
    },
    [rawRows, navigate],
  );

  const handleButtonClick = useCallback(
    (buttonId: string, rowId: string) => {
      if (buttonId === "view_details") {
        navigate(`/pharma-pa-worklists/insurance-details/${rowId}`);
        return;
      }
      const row = rawRows.find((r: any) => r.identifier === rowId);
      if (row) {
        const events: WorkflowEvent[] = row.events ?? [];
        const name = [row.patient?.first_name, row.patient?.last_name]
          .filter(Boolean)
          .join(" ");
        setWorkflowEvents(events);
        setWorkflowPatientName(name);

        const allDone =
          events.length > 0 &&
          events.every(
            (e) => (e.event_status ?? "").toLowerCase() === "success",
          );
        const outcome = row.workflow?.final_outcome ?? "";
        const isDenied =
          outcome.toLowerCase().includes("denied") ||
          outcome.toLowerCase().includes("denial");
        const resolvedOutcome = allDone
          ? isDenied
            ? "denied"
            : "approved"
          : null;
        setShowOutcomeView(false);
        setWorkflowOutcome(resolvedOutcome);
        setWorkflowModalOpen(true);
      }
    },
    [rawRows, navigate],
  );

  // Unique drug names from BigQuery data
  const drugOptions = useMemo(() => {
    const set = new Set<string>();
    rawRows.forEach((r: any) => {
      const name = r.drug?.drug_name_onco_emr ?? r.drug?.drug_name ?? "";
      if (name) set.add(name);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rawRows]);

  const filteredDrugOptions = useMemo(() => {
    if (!drugSearch.trim()) return drugOptions;
    const q = drugSearch.toLowerCase();
    return drugOptions.filter((d) => d.toLowerCase().includes(q));
  }, [drugOptions, drugSearch]);

  // Unique provider names from BigQuery data
  const providerOptions = useMemo(() => {
    const set = new Set<string>();
    rawRows.forEach((r: any) => {
      const name = r.provider?.full_name ?? "";
      if (name) set.add(name);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rawRows]);

  const filteredProviderOptions = useMemo(() => {
    if (!providerSearch.trim()) return providerOptions;
    const q = providerSearch.toLowerCase();
    return providerOptions.filter((p) => p.toLowerCase().includes(q));
  }, [providerOptions, providerSearch]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (drugRef.current && !drugRef.current.contains(e.target as Node))
        setDrugDropdownOpen(false);
      if (
        providerRef.current &&
        !providerRef.current.contains(e.target as Node)
      )
        setProviderDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleNewCaseChange = (field: string, value: string) => {
    setNewCaseForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleNewCaseSubmit = () => {
    setNewCaseModalOpen(false);

    const caseOutcome = newCaseCounter % 2 === 0 ? "approved" : "denied";
    setNewCaseCounter((prev) => prev + 1);
    setWorkflowOutcome(null);
    setShowOutcomeView(false);
    setSelectedOutcomeAction(null);

    setWorkflowPatientName(
      `${newCaseForm.firstName.toUpperCase()} ${newCaseForm.lastName.toUpperCase()}`,
    );

    // Define the 19 workflow steps (total ~58s, under 1 minute)
    const workflowSteps = [
      {
        event_action_name: "Authenticate EHR Session",
        event_action_description:
          "Establish connection to the EHR system to initiate the workflow. All EHR interactions are performed via FHIR APIs exposed by OncoEMR.",
        event_platform: "OncoEMR",
        delay: 2000,
      },
      {
        event_action_name: "Retrieve Patient Record",
        event_action_description:
          "Retrieve patient using MRN or demographic identifiers through FHIR queries to OncoEMR.",
        event_platform: "OncoEMR",
        delay: 800,
      },
      {
        event_action_name: "Retrieve Prescription Order",
        event_action_description:
          "Fetch the active prescription or medication order associated with the patient via FHIR MedicationRequest resources.",
        event_platform: "OncoEMR",
        delay: 2000,
      },
      {
        event_action_name: "Retrieve Insurance Coverage",
        event_action_description:
          "Retrieve insurance coverage and payer information using FHIR Coverage resources from OncoEMR.",
        event_platform: "OncoEMR",
        delay: 2000,
      },
      {
        event_action_name: "Retrieve Patient Demographics",
        event_action_description:
          "Fetch demographic details such as name, DOB, gender, and address from FHIR Patient resources in OncoEMR.",
        event_platform: "OncoEMR",
        delay: 1500,
      },
      {
        event_action_name: "Retrieve Clinical Documentation",
        event_action_description:
          "Retrieve clinical documentation (progress notes, lab reports, imaging, etc.) required for medical necessity validation via FHIR DocumentReference resources.",
        event_platform: "OncoEMR",
        delay: 4000,
      },
      {
        event_action_name: "Parse Clinical Documents",
        event_action_description:
          "Process retrieved clinical documents and extract structured information required for prior authorization submission.",
        event_platform: "OncoEMR",
        delay: 8000,
      },
      {
        event_action_name: "Execute Medication Module",
        event_action_description:
          "Identify drug attributes, therapeutic classification, and relevant medication metadata required for the authorization process.",
        event_platform: "Internal",
        delay: 800,
      },
      {
        event_action_name: "Execute Form Selection Module",
        event_action_description:
          "Determine the correct prior authorization form based on drug, payer, and insurance plan type.",
        event_platform: "Internal",
        delay: 800,
      },
      {
        event_action_name: "Execute Drug-Diagnosis Module",
        event_action_description:
          "Validate drug indication against diagnosis codes and clinical guidelines to prepare accurate submission data.",
        event_platform: "Internal",
        delay: 800,
      },
      {
        event_action_name: "Authenticate Filing Platform",
        event_action_description:
          "Authenticate into the prior authorization filing platform to initiate submission.",
        event_platform: "CoverMyMeds",
        delay: 2000,
      },
      {
        event_action_name: "Submit Initial PA Request",
        event_action_description:
          "Submit the initial prior authorization request to the payer via the filing platform.",
        event_platform: "CoverMyMeds",
        delay: 6000,
      },
      {
        event_action_name: "Retrieve Initial Payer Response",
        event_action_description:
          "Retrieve the payer's response to the first submission attempt (approved, rejected, or additional questions required).",
        event_platform: "CoverMyMeds",
        delay: 2000,
      },
      {
        event_action_name: "Determine Next Actions (Initial Response)",
        event_action_description:
          "Analyze the payer response and determine the next steps such as answering questionnaires or attaching additional documentation.",
        event_platform: "Internal",
        delay: 2000,
      },
      {
        event_action_name: "Retrieve Payer Questionnaire",
        event_action_description:
          "Retrieve payer-generated clinical questionnaire triggered by the submission response.",
        event_platform: "CoverMyMeds",
        delay: 2000,
      },
      {
        event_action_name: "Execute Medical Necessity Module",
        event_action_description:
          "Generate or validate clinical rationale supporting the medication request based on patient documentation and guidelines.",
        event_platform: "Internal",
        delay: 12000,
      },
      {
        event_action_name: "Populate Questionnaire Responses",
        event_action_description:
          "Populate responses to payer questionnaire using extracted clinical data and generated medical necessity content.",
        event_platform: "CoverMyMeds",
        delay: 4000,
      },
      {
        event_action_name: "Retrieve Final Payer Decision",
        event_action_description:
          "Retrieve the final decision from the payer after questionnaire submission and documentation review.",
        event_platform: "CoverMyMeds",
        delay: 4000,
      },
      {
        event_action_name: "Determine Next Actions (Final Decision)",
        event_action_description:
          "Determine follow-up actions such as appeal, alternate therapy recommendation, or workflow completion.",
        event_platform: "Internal",
        delay: 2000,
      },
    ];

    // Initialize all steps in "Loading" state with duration info
    const initialSteps: WorkflowEvent[] = workflowSteps.map((step) => ({
      event_action_name: step.event_action_name,
      event_action_description: step.event_action_description,
      event_platform: step.event_platform,
      event_status: "Loading",
      event_status_description: `${step.delay / 1000}s`,
    }));

    setWorkflowEvents(initialSteps);
    setWorkflowModalOpen(true);

    // Progressively update each step to "Success" with timer
    let cumulativeDelay = 0;
    workflowSteps.forEach((step, index) => {
      const stepStart = cumulativeDelay;
      const stepDuration = step.delay;

      // Start timer for this step
      setTimeout(() => {
        setCurrentStepElapsed(0);

        // Update timer every 100ms
        const timerInterval = setInterval(() => {
          setCurrentStepElapsed((prev) => {
            const next = prev + 0.1;
            if (next >= stepDuration / 1000) {
              clearInterval(timerInterval);
              return stepDuration / 1000;
            }
            return next;
          });
        }, 100);

        // Mark step as success after duration
        setTimeout(() => {
          clearInterval(timerInterval);
          setWorkflowEvents((prev) => {
            const updated = [...prev];
            updated[index] = {
              ...updated[index],
              event_status: "Success",
            };
            return updated;
          });
        }, stepDuration);
      }, stepStart);

      cumulativeDelay += stepDuration;
    });

    setTimeout(() => {
      setWorkflowOutcome(caseOutcome);
      setShowOutcomeView(true);
    }, cumulativeDelay + 500);

    setNewCaseForm({ ...EMPTY_NEW_CASE });
    setDrugSearch("");
    setProviderSearch("");
  };

  const closeNewCaseModal = () => {
    setNewCaseModalOpen(false);
    setNewCaseForm({ ...EMPTY_NEW_CASE });
    setDrugSearch("");
    setProviderSearch("");
  };

  const isNewCaseValid =
    newCaseForm.firstName.trim() &&
    newCaseForm.lastName.trim() &&
    newCaseForm.dob.trim() &&
    newCaseForm.drug.trim() &&
    newCaseForm.providerName.trim();

  return (
    <div className="h-full w-full bg-primaryGray-16 p-2">
      <div className="flex h-full flex-col gap-2 overflow-hidden rounded bg-white p-4">
        <div className="text-h11 font-bold">PA Requests</div>
        <div className="flex-1 overflow-auto">
          <CustomTable
            tableHeaders={PA_TABLE_HEADERS}
            tableData={filteredData}
            itemsPerPage={15}
            pagesPerView={4}
            count={filteredData.length}
            totalCount={rawCount}
            isFetching={loading}
            tableName={"paRequests"}
            searchingText={handleSearch}
            onReviewButtonClick={handleRowClick}
            onRowClick={handleRowClick}
            onButtonWithThreeDotsOptionClick={handleButtonClick}
            showRefreshButton={true}
            onRefreshButton={loadData}
            showFilterButton={false}
            showOtherButton={true}
            otherButtonMeta={[
              {
                text: "New Case",
                onClick: () => setNewCaseModalOpen(true),
                disabled: false,
                buttonType: "primary",
                size: "medium",
              },
            ]}
          />
        </div>
      </div>

      {/* ───── New Case Modal ───── */}
      {newCaseModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={closeNewCaseModal}
          style={{ animation: "wfFadeIn .15s ease-out" }}
        >
          <div className="absolute inset-0 bg-black/40" />

          <div
            className="relative z-10 w-full max-w-lg rounded-xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "wfSlideUp .2s ease-out" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-primaryGray-14 px-6 py-4">
              <h3 className="text-body font-bold text-primaryGray-1">
                Start New Case
              </h3>
              <button
                className="rounded-full p-1.5 text-primaryGray-9 hover:bg-primaryGray-16 hover:text-primaryGray-1"
                onClick={closeNewCaseModal}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto bg-primaryGray-16/50 px-6 py-5">
              {/* ── Patient Information ── */}
              <div className="flex items-center justify-between">
                <div className="mb-0.5 text-x-tiny font-semibold uppercase tracking-wider text-primaryGray-6">
                  Patient Information
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewCaseForm({
                        firstName: "Laura",
                        lastName: "King",
                        mrn: "MRN123456",
                        dob: "1985-06-15",
                        drug: "Zepbound",
                        providerName: "Dr. Sarah Johnson",
                      });
                    }}
                    className="rounded-md border border-primaryGray-14 bg-white px-3 py-1.5 text-xs font-medium text-primaryGray-6 transition-colors hover:bg-primaryGray-15"
                  >
                    Patient 1
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewCaseForm({
                        firstName: "Mark",
                        lastName: "Ellis",
                        mrn: "MRN789012",
                        dob: "1992-03-22",
                        drug: "Ozempic",
                        providerName: "Dr. Michael Chen",
                      });
                    }}
                    className="rounded-md border border-primaryGray-14 bg-white px-3 py-1.5 text-xs font-medium text-primaryGray-6 transition-colors hover:bg-primaryGray-15"
                  >
                    Patient 2
                  </button>
                </div>
              </div>

              {/* First + Last name side-by-side */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-x-tiny font-medium text-primaryGray-6">
                    First Name <span className="text-tertiaryRed-3">*</span>
                  </label>
                  <input
                    type="text"
                    value={newCaseForm.firstName}
                    onChange={(e) =>
                      handleNewCaseChange("firstName", e.target.value)
                    }
                    placeholder="e.g. Laura"
                    className="w-full rounded-md border border-primaryGray-14 bg-white px-3 py-2 text-small text-primaryGray-1 outline-none transition-all duration-150 placeholder:text-primaryGray-11 focus:border-primaryGray-9 focus:shadow-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-x-tiny font-medium text-primaryGray-6">
                    Last Name <span className="text-tertiaryRed-3">*</span>
                  </label>
                  <input
                    type="text"
                    value={newCaseForm.lastName}
                    onChange={(e) =>
                      handleNewCaseChange("lastName", e.target.value)
                    }
                    placeholder="e.g. King"
                    className="w-full rounded-md border border-primaryGray-14 bg-white px-3 py-2 text-small text-primaryGray-1 outline-none transition-all duration-150 placeholder:text-primaryGray-11 focus:border-primaryGray-9 focus:shadow-sm"
                  />
                </div>
              </div>

              {/* MRN + DOB side-by-side */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-x-tiny font-medium text-primaryGray-6">
                    MRN
                  </label>
                  <input
                    type="text"
                    value={newCaseForm.mrn}
                    onChange={(e) => handleNewCaseChange("mrn", e.target.value)}
                    placeholder="e.g. MRN17433"
                    className="w-full rounded-md border border-primaryGray-14 bg-white px-3 py-2 text-small text-primaryGray-1 outline-none transition-all duration-150 placeholder:text-primaryGray-11 focus:border-primaryGray-9 focus:shadow-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-x-tiny font-medium text-primaryGray-6">
                    Date of Birth <span className="text-tertiaryRed-3">*</span>
                  </label>
                  <input
                    type="date"
                    value={newCaseForm.dob}
                    onChange={(e) => handleNewCaseChange("dob", e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                    className="w-full rounded-md border border-primaryGray-14 bg-white px-3 py-2 text-small text-primaryGray-1 outline-none transition-all duration-150 placeholder:text-primaryGray-11 focus:border-primaryGray-9 focus:shadow-sm"
                  />
                </div>
              </div>

              {/* Separator */}
              <div className="border-t border-primaryGray-14" />

              {/* ── Prescription Details ── */}
              <div className="mb-0.5 text-x-tiny font-semibold uppercase tracking-wider text-primaryGray-6">
                Prescription Details
              </div>

              {/* Drug — searchable dropdown */}
              <div>
                <label className="mb-1 block text-x-tiny font-medium text-primaryGray-6">
                  Drug <span className="text-tertiaryRed-3">*</span>
                </label>
                <div className="relative" ref={drugRef}>
                  <input
                    type="text"
                    value={drugDropdownOpen ? drugSearch : newCaseForm.drug}
                    onChange={(e) => {
                      setDrugSearch(e.target.value);
                      if (!drugDropdownOpen) setDrugDropdownOpen(true);
                    }}
                    onFocus={() => {
                      setDrugDropdownOpen(true);
                      setDrugSearch(newCaseForm.drug);
                    }}
                    placeholder="Search and select a drug..."
                    className="w-full rounded-md border border-primaryGray-14 bg-white px-3 py-2 pr-8 text-small text-primaryGray-1 outline-none transition-all duration-150 placeholder:text-primaryGray-11 focus:border-primaryGray-9 focus:shadow-sm"
                  />
                  <svg
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-primaryGray-9"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                  {drugDropdownOpen && (
                    <div className="absolute left-0 top-full z-20 mt-1 max-h-48 w-full overflow-auto rounded-md border border-primaryGray-14 bg-white shadow-lg">
                      {filteredDrugOptions.length > 0 ? (
                        filteredDrugOptions.map((drug) => (
                          <div
                            key={drug}
                            className={`cursor-pointer px-3 py-2 text-small transition-colors hover:bg-primaryGray-16 ${
                              newCaseForm.drug === drug
                                ? "bg-primaryGray-16 font-semibold text-primaryGray-1"
                                : "text-primaryGray-4"
                            }`}
                            onClick={() => {
                              handleNewCaseChange("drug", drug);
                              setDrugSearch("");
                              setDrugDropdownOpen(false);
                            }}
                          >
                            {capitalizeString(drug)}
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-small text-primaryGray-9">
                          No drugs found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Provider — searchable dropdown */}
              <div>
                <label className="mb-1 block text-x-tiny font-medium text-primaryGray-6">
                  Ordering Provider{" "}
                  <span className="text-tertiaryRed-3">*</span>
                </label>
                <div className="relative" ref={providerRef}>
                  <input
                    type="text"
                    value={
                      providerDropdownOpen
                        ? providerSearch
                        : newCaseForm.providerName
                    }
                    onChange={(e) => {
                      setProviderSearch(e.target.value);
                      if (!providerDropdownOpen) setProviderDropdownOpen(true);
                    }}
                    onFocus={() => {
                      setProviderDropdownOpen(true);
                      setProviderSearch(newCaseForm.providerName);
                    }}
                    placeholder="Search and select a provider..."
                    className="w-full rounded-md border border-primaryGray-14 bg-white px-3 py-2 pr-8 text-small text-primaryGray-1 outline-none transition-all duration-150 placeholder:text-primaryGray-11 focus:border-primaryGray-9 focus:shadow-sm"
                  />
                  <svg
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-primaryGray-9"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                  {providerDropdownOpen && (
                    <div className="absolute left-0 top-full z-20 mt-1 max-h-48 w-full overflow-auto rounded-md border border-primaryGray-14 bg-white shadow-lg">
                      {filteredProviderOptions.length > 0 ? (
                        filteredProviderOptions.map((prov) => (
                          <div
                            key={prov}
                            className={`cursor-pointer px-3 py-2 text-small transition-colors hover:bg-primaryGray-16 ${
                              newCaseForm.providerName === prov
                                ? "bg-primaryGray-16 font-semibold text-primaryGray-1"
                                : "text-primaryGray-4"
                            }`}
                            onClick={() => {
                              handleNewCaseChange("providerName", prov);
                              setProviderSearch("");
                              setProviderDropdownOpen(false);
                            }}
                          >
                            {capitalizeString(prov)}
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-small text-primaryGray-9">
                          No providers found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-primaryGray-14 bg-primaryGray-16 px-5 py-3">
              <span className="text-x-tiny text-primaryGray-9">
                <span className="text-tertiaryRed-3">*</span> Required fields
              </span>
              <div className="flex gap-3">
                <button
                  className="rounded-md border border-primaryGray-14 bg-white px-5 py-2 text-small font-semibold text-primaryGray-1 transition-colors duration-150 hover:bg-primaryGray-16"
                  onClick={closeNewCaseModal}
                >
                  Cancel
                </button>
                <button
                  className="rounded-md border border-primaryGray-1 bg-primaryGray-1 px-5 py-2 text-small font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
                  onClick={handleNewCaseSubmit}
                  disabled={!isNewCaseValid}
                >
                  Initiate Case
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───── Workflow Timeline / Outcome Modal (single modal, content swaps) ───── */}
      {workflowModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => {
            setWorkflowModalOpen(false);
            setWorkflowOutcome(null);
            setShowOutcomeView(false);
            setSelectedOutcomeAction(null);
          }}
          style={{ animation: "wfFadeIn .15s ease-out" }}
        >
          <div className="absolute inset-0 bg-black/40" />

          <div
            className={`relative z-10 flex w-full flex-col overflow-hidden rounded-xl bg-white shadow-2xl transition-all duration-300 ease-in-out ${
              showOutcomeView && workflowOutcome
                ? "max-h-[60vh] max-w-lg"
                : "max-h-[85vh] max-w-3xl"
            }`}
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "wfSlideUp .2s ease-out" }}
          >
            {showOutcomeView && workflowOutcome ? (
              <>
                {/* Back arrow */}
                <button
                  onClick={() => setShowOutcomeView(false)}
                  className="absolute left-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-primaryGray-6 transition-colors hover:bg-primaryGray-16 hover:text-primaryGray-1"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                </button>

                {workflowOutcome === "approved" ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-6 px-10 py-20">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-[#10B981] bg-white">
                      <svg
                        width="40"
                        height="40"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-[28px] font-bold text-[#065F46]">
                        Approved
                      </span>
                      <span className="text-body text-[#047857]">
                        till 12/31/2039
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col gap-6 overflow-auto px-8 pb-8 pt-14">
                    <div className="flex flex-col items-center gap-4">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-[#DC2626] bg-white shadow-sm">
                        <svg
                          width="40"
                          height="40"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#DC2626"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                      </div>
                      <span className="text-[28px] font-bold text-[#991B1B]">
                        Denied
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <span className="text-x-tiny font-semibold uppercase tracking-wider text-primaryGray-6">
                        Denial Reason
                      </span>
                      <div className="rounded-lg border border-l-[3px] border-primaryGray-14 border-l-[#CC0300] bg-white px-4 py-2.5">
                        <span className="text-small text-primaryGray-1">
                          Drug Not Covered - Plan Exclusion
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <span className="text-x-tiny font-semibold uppercase tracking-wider text-primaryGray-6">
                        Denial Summary
                      </span>
                      <div className="rounded-lg border border-l-[3px] border-primaryGray-14 border-l-[#CC0300] bg-white px-4 py-3">
                        <p className="text-small leading-relaxed text-primaryGray-4">
                          Denied – Non-Formulary with step requirements.
                          Approval would require a formulary exception showing
                          inability to use the formulary equivalent with the
                          same active ingredient (palonosetron injection) and
                          other covered alternatives in the class.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <span className="text-x-tiny font-semibold uppercase tracking-wider text-primaryGray-6">
                        Suggested Next Steps
                      </span>
                      {[
                        {
                          steps: "Query Client",
                          steps_summary:
                            "Provider confirmation is required before proceeding after this non-formulary denial.",
                          task: "Ask the provider whether to pursue a formulary exception by documenting inability to use palonosetron injection and other covered alternatives in the class.",
                          cta_microtext: "Query",
                        },
                        {
                          steps: "Appeal",
                          steps_summary:
                            "A formulary exception or appeal may be appropriate if provider-supported justification is available.",
                          task: "Submit a formulary exception or appeal once documentation confirms inability to use the formulary equivalent and other covered alternatives.",
                          cta_microtext: "Appeal",
                        },
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedOutcomeAction(item)}
                          className="group flex w-full items-center gap-4 rounded-lg border border-primaryGray-14 bg-[#F7F9FA] px-5 py-3.5 text-left transition-all duration-150 hover:border-primaryGray-12 hover:shadow-sm active:scale-[0.995]"
                        >
                          <div className="flex min-w-0 flex-1 flex-col">
                            <span className="text-small font-semibold text-primaryGray-1">
                              {item.steps}
                            </span>
                            <span className="mt-0.5 truncate text-xs text-primaryGray-9">
                              {item.steps_summary}
                            </span>
                          </div>
                          <span className="shrink-0 rounded-md border border-primaryGray-1 bg-primaryGray-1 px-3 py-1 text-xs font-medium text-white transition-colors duration-150 group-hover:bg-black">
                            View
                          </span>
                          <svg
                            className="h-3.5 w-3.5 shrink-0 text-primaryGray-9 transition-transform duration-150 group-hover:translate-x-0.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-primaryGray-14 px-6 py-4">
                  <div>
                    <h3 className="text-body font-bold text-primaryGray-1">
                      Workflow Timeline
                    </h3>
                    {workflowPatientName && (
                      <p className="mt-0.5 text-x-tiny text-primaryGray-9">
                        {workflowPatientName} &middot; {workflowEvents.length}{" "}
                        steps
                      </p>
                    )}
                  </div>
                  <button
                    className="rounded-full p-1.5 text-primaryGray-9 hover:bg-primaryGray-16 hover:text-primaryGray-1"
                    onClick={() => {
                      setWorkflowModalOpen(false);
                      setWorkflowOutcome(null);
                      setShowOutcomeView(false);
                      setSelectedOutcomeAction(null);
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                <div className="flex-1 overflow-auto bg-primaryGray-16/50 px-6 py-5">
                  {workflowEvents.length > 0 ? (
                    <div className="relative">
                      {workflowEvents.map((event, idx) => {
                        const isLast = idx === workflowEvents.length - 1;
                        const status = event.event_status ?? "";
                        const badge = statusBadge(status);
                        const isSuccess = status === "Success";

                        const firstLoadingIdx = workflowEvents.findIndex(
                          (e) => e.event_status === "Loading",
                        );
                        const isCurrentStep = idx === firstLoadingIdx;
                        const isFutureStep =
                          firstLoadingIdx >= 0 && idx > firstLoadingIdx;
                        const isPastStep =
                          isSuccess ||
                          (firstLoadingIdx >= 0 && idx < firstLoadingIdx);

                        return (
                          <div
                            key={idx}
                            className={`relative flex gap-4 transition-opacity duration-300 ${isFutureStep ? "opacity-30" : "opacity-100"}`}
                          >
                            {/* Timeline rail */}
                            <div className="relative flex flex-col items-center">
                              {!isLast && (
                                <div
                                  className="absolute bottom-0 left-1/2 top-2.5 w-px -translate-x-1/2 transition-all duration-500"
                                  style={{
                                    backgroundColor: isPastStep
                                      ? "#10B981"
                                      : "#E5E7EB",
                                  }}
                                />
                              )}

                              {isSuccess ? (
                                <div
                                  className="relative z-10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2"
                                  style={{
                                    borderColor: "#10B981",
                                    backgroundColor: "#10B981",
                                  }}
                                >
                                  <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#FFFFFF"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                </div>
                              ) : status === "Error" ? (
                                <div
                                  className="relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                                  style={{
                                    border: "2px solid #FECACA",
                                    backgroundColor: "#FEF2F2",
                                  }}
                                >
                                  <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 20 20"
                                    fill="#DC2626"
                                  >
                                    <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm-.75 4.5a.75.75 0 011.5 0v4a.75.75 0 01-1.5 0v-4zm.75 7.5a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                                  </svg>
                                </div>
                              ) : (
                                <div className="mt-0.5 h-5 w-5 shrink-0" />
                              )}
                            </div>

                            {/* Step card */}
                            <div
                              className={`min-w-0 flex-1 ${isLast ? "pb-0" : "pb-3"}`}
                            >
                              <div
                                className={`relative rounded-lg border bg-white px-4 py-3 transition-all duration-300 ${
                                  isFutureStep
                                    ? "border-primaryGray-14 bg-gray-50"
                                    : "border-primaryGray-14 hover:shadow-sm"
                                }`}
                              >
                                {isCurrentStep && (
                                  <div className="absolute -left-10 top-1/2 -translate-y-1/2">
                                    <svg
                                      className="animate-spin text-blue-500"
                                      width="24"
                                      height="24"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                    </svg>
                                  </div>
                                )}

                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <span
                                      className={`text-small font-semibold ${
                                        isFutureStep
                                          ? "text-primaryGray-9"
                                          : "text-primaryGray-1"
                                      }`}
                                    >
                                      {event.event_action_name ?? "—"}
                                    </span>
                                    {event.event_action_description && (
                                      <p
                                        className={`mt-1 text-xs leading-relaxed ${
                                          isFutureStep
                                            ? "text-primaryGray-11"
                                            : "text-primaryGray-9"
                                        }`}
                                      >
                                        {event.event_action_description}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex flex-col items-end gap-1">
                                    <span
                                      className="shrink-0 rounded-md px-2 py-0.5 text-x-tiny font-semibold"
                                      style={{
                                        backgroundColor: isFutureStep
                                          ? "#F3F4F6"
                                          : badge.bg,
                                        color: isFutureStep
                                          ? "#9CA3AF"
                                          : badge.color,
                                      }}
                                    >
                                      {status || "—"}
                                    </span>
                                    {isCurrentStep && (
                                      <span className="text-sm font-semibold text-blue-600">
                                        {currentStepElapsed.toFixed(1)}s
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {event.event_platform && (
                                  <span
                                    className={`mt-2 inline-block rounded px-2 py-0.5 text-x-tiny font-semibold ${
                                      isFutureStep ? "opacity-40" : ""
                                    }`}
                                    style={{
                                      backgroundColor:
                                        event.event_platform === "OncoEMR"
                                          ? "#EDE9FE"
                                          : event.event_platform ===
                                              "CoverMyMeds"
                                            ? "#E0F2FE"
                                            : event.event_platform ===
                                                "Internal"
                                              ? "#FFF3E0"
                                              : "#F5F5F5",
                                      color:
                                        event.event_platform === "OncoEMR"
                                          ? "#6D28D9"
                                          : event.event_platform ===
                                              "CoverMyMeds"
                                            ? "#0369A1"
                                            : event.event_platform ===
                                                "Internal"
                                              ? "#C24400"
                                              : "#0F0F0F",
                                    }}
                                  >
                                    {event.event_platform}
                                  </span>
                                )}

                                {isLast && isSuccess && workflowOutcome && (
                                  <button
                                    onClick={() => setShowOutcomeView(true)}
                                    className={`mt-3 w-full rounded-lg py-2 text-small font-semibold text-white transition-colors ${
                                      workflowOutcome === "approved"
                                        ? "bg-[#10B981] hover:bg-[#059669]"
                                        : "bg-[#DC2626] hover:bg-[#B91C1C]"
                                    }`}
                                  >
                                    View Status
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex h-40 items-center justify-center text-small text-primaryGray-9">
                      No workflow events found
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 border-t border-primaryGray-14 bg-primaryGray-16 px-5 py-3">
                  <button
                    className="rounded-md border border-primaryGray-1 bg-primaryGray-1 px-5 py-2 text-small font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-black"
                    onClick={() => {
                      setWorkflowModalOpen(false);
                      setWorkflowOutcome(null);
                      setShowOutcomeView(false);
                      setSelectedOutcomeAction(null);
                    }}
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ───── Action Item Detail Modal (from outcome popup) ───── */}
      {selectedOutcomeAction && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center"
          onClick={() => setSelectedOutcomeAction(null)}
          style={{ animation: "wfFadeIn .15s ease-out" }}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative z-10 w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "wfSlideUp .2s ease-out" }}
          >
            <div className="flex items-center justify-between border-b border-primaryGray-14 px-6 py-4">
              <h3 className="text-body font-bold text-primaryGray-1">
                {selectedOutcomeAction.steps}
              </h3>
              <button
                className="rounded-full p-1.5 text-primaryGray-9 hover:bg-primaryGray-16 hover:text-primaryGray-1"
                onClick={() => setSelectedOutcomeAction(null)}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col gap-5 bg-primaryGray-16/50 px-6 py-6">
              <div>
                <p className="mb-1.5 text-x-tiny font-semibold uppercase tracking-wider text-primaryGray-6">
                  Task
                </p>
                <div className="rounded-lg border border-primaryGray-14 bg-white px-4 py-3 text-small leading-relaxed text-primaryGray-1">
                  {selectedOutcomeAction.task}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-primaryGray-14 px-6 py-4">
              <button
                className="cursor-not-allowed rounded-md border border-primaryGray-1 bg-primaryGray-9 px-6 py-2.5 text-small font-semibold text-white shadow-sm"
                disabled
              >
                {selectedOutcomeAction.cta_microtext || "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {aiOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setAiOpen(false)}
          style={{ animation: "wfFadeIn .15s ease-out" }}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative z-10 flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "wfSlideUp .2s ease-out" }}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-primaryGray-14 px-6 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold text-primaryGray-1">
                    RISA AI · Pre-filing Review
                  </span>
                  {aiPacket?.reasoning_mode === "llm" ? (
                    <span className="rounded-full bg-[#EFE7FF] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#5B21B6]">
                      AI-reasoned (Claude)
                    </span>
                  ) : aiPacket ? (
                    <span className="rounded-full bg-primaryGray-16 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primaryGray-6">
                      Rule-based
                    </span>
                  ) : null}
                </div>
                <div className="mt-1 text-small text-primaryGray-6">
                  {aiCase?.name} · {aiCase?.drug} · {aiCase?.payer}
                </div>
              </div>
              <button
                onClick={() => setAiOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-primaryGray-6 transition-colors hover:bg-primaryGray-16 hover:text-primaryGray-1"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {aiLoading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-primaryGray-6">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primaryGray-14 border-t-primaryGray-1" />
                  <div className="text-small">
                    Agents reviewing criteria, mechanism, guidelines &amp; payer policy…
                  </div>
                </div>
              ) : !aiPacket ? (
                <div className="py-16 text-center text-small text-primaryGray-6">
                  Could not reach the reasoning engine for this case.
                </div>
              ) : (
                <>
                  {/* Verdict + readiness */}
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    {aiPacket.verdict && (
                      <span className="rounded-md bg-primaryGray-16 px-3 py-1.5 text-small font-semibold text-primaryGray-1">
                        {aiPacket.verdict}
                      </span>
                    )}
                    {typeof aiPacket.readiness_pct === "number" && (
                      <span className="text-small text-primaryGray-6">
                        Readiness{" "}
                        <strong className="text-primaryGray-1">
                          {Math.round(aiPacket.readiness_pct)}%
                        </strong>
                      </span>
                    )}
                    {typeof aiPacket.critical_unmet === "number" &&
                      aiPacket.critical_unmet > 0 && (
                        <span className="text-small font-semibold text-[#CC0300]">
                          {aiPacket.critical_unmet} critical gap
                          {aiPacket.critical_unmet > 1 ? "s" : ""}
                        </span>
                      )}
                  </div>

                  {aiPacket.summary && (
                    <div className="mb-4 rounded-lg border border-[#D8C8FF] bg-[#F8F4FF] px-4 py-3 text-small leading-relaxed text-[#3A1F73]">
                      {aiPacket.summary}
                    </div>
                  )}

                  <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    {aiPacket.mechanism && (
                      <div className="rounded-lg border border-primaryGray-14 bg-white px-4 py-3">
                        <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-primaryGray-6">
                          Mechanism of action
                        </div>
                        <div className="text-small leading-relaxed text-primaryGray-1">
                          {aiPacket.mechanism}
                        </div>
                      </div>
                    )}
                    {aiPacket.payer_strategy && (
                      <div className="rounded-lg border border-primaryGray-14 bg-white px-4 py-3">
                        <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-primaryGray-6">
                          Payer strategy
                          {aiPacket.payer_strategy.matched_policy
                            ? ` · ${aiPacket.payer_strategy.matched_policy}`
                            : ""}
                        </div>
                        <ul className="list-disc space-y-1 pl-4 text-small leading-relaxed text-primaryGray-1">
                          {(aiPacket.payer_strategy.strategy ?? []).length > 0 ? (
                            aiPacket.payer_strategy.strategy!.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))
                          ) : (
                            <li className="list-none text-primaryGray-6">
                              No payer policy on file.
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>

                  {(aiPacket.guidelines ?? []).length > 0 && (
                    <div className="mb-4 rounded-lg border border-primaryGray-14 bg-white px-4 py-3">
                      <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-primaryGray-6">
                        Clinical guidelines
                      </div>
                      <ul className="list-disc space-y-1 pl-4 text-small leading-relaxed text-primaryGray-1">
                        {aiPacket.guidelines!.map((g, i) => (
                          <li key={i}>{g}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Questionnaire answers */}
                  {(aiPacket.questions ?? []).length > 0 && (
                    <div>
                      <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-primaryGray-6">
                        Drafted questionnaire answers
                      </div>
                      <div className="space-y-2">
                        {aiPacket.questions!.map((q, i) => {
                          const st = (q.status ?? "UNVERIFIED").toUpperCase();
                          const stColor =
                            st === "MET"
                              ? { bg: "#E6F3F0", color: "#005D49" }
                              : st === "AT_RISK"
                                ? { bg: "#FFE8E8", color: "#CC0300" }
                                : { bg: "#F5F5F5", color: "#6B7280" };
                          return (
                            <div
                              key={i}
                              className="rounded-lg border border-primaryGray-14 bg-white px-4 py-3"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="text-small font-medium text-primaryGray-1">
                                  {q.question}
                                  {q.critical && (
                                    <span className="ml-2 text-[10px] font-bold uppercase text-[#CC0300]">
                                      critical
                                    </span>
                                  )}
                                </div>
                                <span
                                  className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                                  style={{
                                    backgroundColor: stColor.bg,
                                    color: stColor.color,
                                  }}
                                >
                                  {st.replace("_", " ")}
                                </span>
                              </div>
                              {q.recommended_answer && (
                                <div className="mt-1.5 text-small text-primaryGray-1">
                                  <span className="font-semibold">Answer: </span>
                                  {q.recommended_answer}
                                </div>
                              )}
                              {q.justification && (
                                <div className="mt-1 text-small leading-relaxed text-primaryGray-6">
                                  {q.justification}
                                </div>
                              )}
                              {q.evidence && (
                                <div className="mt-1 text-[12px] italic text-primaryGray-6">
                                  “{q.evidence}”
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex justify-end border-t border-primaryGray-14 px-6 py-4">
              <button
                onClick={() => setAiOpen(false)}
                className="rounded-md border border-primaryGray-14 bg-white px-6 py-2.5 text-small font-semibold text-primaryGray-1 shadow-sm transition-colors hover:bg-primaryGray-16"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes wfFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes wfSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default PaSearch;
