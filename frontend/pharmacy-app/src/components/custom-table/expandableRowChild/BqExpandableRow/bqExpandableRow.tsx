import React, { useState } from "react";
import { CmmOrderTableRowData } from "../../../../data-model/cmmOrderTableRowData";
import { ModalId } from "../../../../enums/modalId";
import MedicalNecessityAgents from "../../../../pages/pharmaQuestionaire/components/medicalNecessityAgents";
import InternalChildCard from "../internalChildCard/internalChildCard";
import InternalChildCardMedical from "../internalChildCard/internalChildCardMedical";
import ModalContainer from "../modalContainer/modalContainer";

interface BqExpandableRowProps {
  rowData: Record<string, any>;
}

const NAME_FIELDS = new Set([
  "patient.full_name",
  "patient.first_name",
  "patient.last_name",
  "provider.full_name",
  "provider.first_name",
  "provider.last_name",
  "drug.drug_name",
  "drug.drug_name_onco_emr",
]);

/** Known credential / suffix abbreviations that should stay UPPERCASE */
const CREDENTIAL_ABBREVS = new Set([
  "MD",
  "DO",
  "PA",
  "NP",
  "NP-C",
  "NP-BC",
  "RN",
  "RN-BC",
  "LPN",
  "DPM",
  "DDS",
  "DMD",
  "OD",
  "DC",
  "DPT",
  "PharmD",
  "PHARMD",
  "APRN",
  "CRNA",
  "CNS",
  "CNM",
  "DNP",
  "FNP",
  "FNP-C",
  "FNP-BC",
  "PA-C",
  "MPAS",
  "MMS",
  "PhD",
  "PHD",
  "MS",
  "MA",
  "MBA",
  "MPH",
  "MSN",
  "BSN",
  "FACP",
  "FACS",
  "FACOG",
  "FAAN",
  "FAAP",
  "II",
  "III",
  "IV",
  "JR",
  "SR",
]);

function titleCase(s: any): string {
  if (!s) return "";
  return String(s)
    .split(/(\s+|,\s*)/)
    .map((token) => {
      const stripped = token.replace(/[.,]/g, "").toUpperCase();
      if (CREDENTIAL_ABBREVS.has(stripped)) return token.toUpperCase();
      if (/^\s+$/.test(token) || /^,\s*$/.test(token)) return token;
      return token.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
    })
    .join("");
}

function get(obj: any, path: string): string {
  if (!obj || !path) return "";
  const val = path.split(".").reduce((cur: any, k: string) => cur?.[k], obj);
  if (val === null || val === undefined) return "";
  return NAME_FIELDS.has(path) ? titleCase(val) : String(val);
}

function notEmpty(v: string): string {
  return v && v !== "null" && v !== "undefined" ? v : "";
}

/** Round a numeric string to 2 decimal places (ceiling-style rounding). Returns original if not a number. */
function roundTo2(v: string): string {
  if (!v) return v;
  const n = parseFloat(v);
  if (isNaN(n)) return v;
  return (Math.ceil(n * 100) / 100).toFixed(2);
}

/**
 * Build a CmmOrderTableRowData-compatible object from the raw BigQuery row
 * so the existing modal content components can read all expected fields.
 */
function buildModalRowData(
  tableRow: Record<string, any>,
  raw: Record<string, any>,
): CmmOrderTableRowData {
  const patient = raw?.patient ?? {};
  const drug = raw?.drug ?? {};
  const prescription = raw?.prescription ?? {};
  const insurance = raw?.insurance ?? {};
  const workflow = raw?.workflow ?? {};
  const diagCodes: any[] = Array.isArray(raw?.diagnosis?.diagnosis_codes)
    ? raw.diagnosis.diagnosis_codes
    : [];

  const primaryDiag = diagCodes.find(
    (d) => d?.is_primary === true || d?.is_primary === "true",
  );
  const secondaryDiag = diagCodes.find(
    (d) => d?.is_secondary === true || d?.is_secondary === "true",
  );

  const firstName = titleCase(patient?.first_name ?? "");
  const lastName = titleCase(patient?.last_name ?? "");
  const fullName = `${firstName} ${lastName}`.trim();

  return {
    id: tableRow?.id ?? raw?.identifier ?? "",
    rowData:
      typeof tableRow?.rowData === "string"
        ? tableRow.rowData
        : JSON.stringify(raw),
    patientDetails: {
      mainText: fullName || tableRow?.patientDetails?.mainText || "",
      secondaryText:
        patient?.patient_mrn || tableRow?.patientDetails?.secondaryText || "",
    },
    patientId: patient?.patient_mrn ?? tableRow?.patientId ?? "",
    dateOfBirth: {
      mainText: patient?.dob ?? tableRow?.dateOfBirth?.mainText ?? "",
      secondaryText: "",
    },
    medication:
      drug?.drug_name_onco_emr ?? drug?.drug_name ?? tableRow?.medication ?? "",
    drugName: drug?.drug_name ?? "",
    cmmKey: workflow?.cmm_result_key ?? tableRow?.cmmKey ?? "",
    type: workflow?.type ?? "",
    prescriptionData: {
      drug_name: drug?.drug_name_onco_emr ?? drug?.drug_name ?? "",
      prescription_date: prescription?.prescription_date ?? "",
      is_related_drug_match: false,
    },
    formPickedFlag: insurance?.form_picked_flag ?? "",
    formName: raw?.form_picked ?? workflow?.status ?? "",
    patientMemberId: insurance?.patient_member_id ?? "",
    patientRxBin: insurance?.patient_rx_bin ?? "",
    patientRxGroup: insurance?.patient_rx_group ?? "",
    patientRxPcn: insurance?.patient_rx_pcn ?? "",
    planName: insurance?.active_insurance?.insurance?.plan_name ?? "",
    insuranceState: insurance?.patient_insurance_state ?? "",
    drugConfidenceScore: String(drug?.drug_confidence_score ?? ""),
    drugFetchedFrom: drug?.drug_fetched_from ?? "",
    drugPickedThinking: drug?.drug_picked_thinking ?? "",
    drugQuantity: drug?.quantity ?? 0,
    drugQuantityQualifier: drug?.quantity_qualifier ?? "",
    drugDaysSupply: drug?.days_supply ?? 0,
    primaryDiagnoses: primaryDiag
      ? `${primaryDiag.icd10_code ?? ""} - ${primaryDiag.description ?? ""}`.trim()
      : "",
    primaryDiagnosesData: {
      confidence_score: String(primaryDiag?.confidence_score ?? ""),
      source: primaryDiag?.source ?? "",
    },
    primaryDiagnosesDescription: primaryDiag?.description ?? "",
    secondaryDiagnoses: secondaryDiag
      ? `${secondaryDiag.icd10_code ?? ""} - ${secondaryDiag.description ?? ""}`.trim()
      : "",
    secondaryDiagnosesData: {
      confidence_score: String(secondaryDiag?.confidence_score ?? ""),
      source: secondaryDiag?.source ?? "",
    },
    secondaryDiagnosesDescription: secondaryDiag?.description ?? "",
    activeInsurance: {
      pbm: { insurer: insurance?.active_insurance?.pbm?.insurer ?? "" },
    },
    // fields not needed for modals but required by the interface
    button: "",
    cmmOrderDeleteIcon: "",
    dateOfService: prescription?.prescription_date ?? "",
    expandableRowIcon: tableRow?.expandableRowIcon ?? {
      borderColor: "transparent",
      borderWidth: 0,
      id: "",
      isExpanded: false,
    },
    noDataFields: tableRow?.noDataFields ?? {
      text: "",
      color: "",
      bgColor: "",
      displayText: "",
    },
    providerDetails: "",
    status: tableRow?.status ?? { text: "", color: "", bgColor: "" },
  } as CmmOrderTableRowData;
}

type Tone = "good" | "warn" | "info" | "muted";
const toneCls: Record<Tone, string> = {
  good: "bg-[#E6F3F0] text-[#005D49]",
  warn: "bg-[#FFF3E0] text-[#C24400]",
  info: "bg-[#EAF2FF] text-[#0056D6]",
  muted: "bg-primaryGray-16 text-primaryGray-7",
};

interface AiStage {
  stpLabel: string;
  stpTone: Tone;
  touchless: boolean;
  mnLabel: string;
  mnTone: Tone;
  needsReview: string;
  needsReviewTone: Tone;
  predictionSummary: string;
  predictionConfidence: string;
}

/**
 * Derive the RISA workflow story from REAL BigQuery fields.
 *
 * Model the user described:
 *  - Before QA is fetched, the case sits at "Form Filled" (demographics/form
 *    filled) — this is the FIRST STP. If the engine auto-sends it ("Sent to
 *    Plan") that first STP was done TOUCHLESS; if not, a human must do the STP
 *    (Needs Review = Yes).
 *  - Once QA is fetched (clinicals answered) the MEDICAL NECESSITY stage is
 *    active and Needs Review = No.
 */
function deriveAiStage(raw: Record<string, any>): AiStage {
  const status = get(raw, "workflow.status").toLowerCase().replace(/\s+/g, "_");
  const reviewTypeRaw = (
    get(raw, "workflow.review_type") ||
    get(raw, "workflow.type") ||
    ""
  ).toLowerCase();

  const filledBy = (
    get(raw, "qa_filled_by") ||
    get(raw, "workflow.qa_filled_by") ||
    ""
  ).toLowerCase();
  const humanAgent = notEmpty(get(raw, "record_closed_by.human_agent"));
  const assignee = notEmpty(get(raw, "workflow.assignee_id"));
  // Touchless = no human touched it. A human is involved if a human agent /
  // assignee is set, or QA was filled by a named person (not the AI/system).
  const filledByHuman =
    !!filledBy && !/ai|system|risa|auto|bot|touchless|engine/.test(filledBy);
  const isHuman = !!humanAgent || !!assignee || filledByHuman;

  const hasQA = /qa_fetched|qa_incomplete|qa_not_found|clinical/.test(status);
  const sentToPlan = /sent_to_plan|send_to_plan/.test(status) && !/error/.test(status);
  const formFilled = /form_filled|first_stp|demographic/.test(status);
  const needsReviewFlag = /review|manual|human/.test(reviewTypeRaw);

  // ── 1st STP ──
  let stpLabel: string;
  let stpTone: Tone;
  let touchless = false;
  if (sentToPlan || hasQA || /first_stp_outcome/.test(status)) {
    touchless = !isHuman;
    stpLabel = touchless ? "Done touchlessly" : "Done (human review)";
    stpTone = touchless ? "good" : "warn";
  } else if (formFilled) {
    stpLabel = "Form filled · STP pending";
    stpTone = "warn";
  } else {
    stpLabel = status ? "In progress" : "Not started";
    stpTone = "muted";
  }

  // ── Medical Necessity (starts at the questionnaire / QA) ──
  const mnActive = hasQA;
  const mnLabel = mnActive
    ? "Active · clinicals answered"
    : "Starts at questionnaire";
  const mnTone: Tone = mnActive ? "info" : "muted";

  // ── Needs Review ──
  let needsReview: string;
  let needsReviewTone: Tone;
  if (hasQA) {
    needsReview = "No";
    needsReviewTone = "good";
  } else if (formFilled && !sentToPlan) {
    needsReview = "Yes · human STP";
    needsReviewTone = "warn";
  } else {
    needsReview = needsReviewFlag ? "Yes" : "No";
    needsReviewTone = needsReviewFlag ? "warn" : "good";
  }

  return {
    stpLabel,
    stpTone,
    touchless,
    mnLabel,
    mnTone,
    needsReview,
    needsReviewTone,
    predictionSummary: notEmpty(get(raw, "denial_prediction.prediction_summary")),
    predictionConfidence: roundTo2(
      notEmpty(get(raw, "denial_prediction.prediction_confidence")),
    ),
  };
}

const BqExpandableRow: React.FC<BqExpandableRowProps> = ({ rowData }) => {
  const [mnOpen, setMnOpen] = useState(false);
  let raw: Record<string, any> = rowData;
  try {
    if (rowData?.rowData && typeof rowData.rowData === "string") {
      raw = JSON.parse(rowData.rowData);
    }
  } catch {
    // fall back to transformed row
  }

  // Build a properly-shaped rowData for the modal content components
  const modalRowData = buildModalRowData(rowData, raw);

  // ── Medication ────────────────────────────────────────────────────────────
  const prescDate = notEmpty(get(raw, "prescription.prescription_date"));
  const prescDesc = notEmpty(get(raw, "prescription.description"));
  const drugName = notEmpty(get(raw, "drug.drug_name"));

  const medPrimary = [prescDate, prescDesc].filter(Boolean);
  const medSecondary = [drugName].filter(Boolean);

  // ── Insurance ─────────────────────────────────────────────────────────────
  const formFlag = notEmpty(get(raw, "insurance.form_picked_flag"));
  const rxBin = notEmpty(get(raw, "insurance.patient_rx_bin"));
  const memberId = notEmpty(get(raw, "insurance.patient_member_id"));
  const formPicked = notEmpty(get(raw, "form_picked"));

  const rxBinLabel =
    formFlag.toLowerCase() === "pbm eligibility" ? "PBM Name" : "RxBin";
  const insPrimary = [formFlag, rxBin ? `${rxBinLabel}: ${rxBin}` : ""].filter(
    Boolean,
  );
  const insSecondary = [memberId, formPicked].filter(Boolean);

  // ── Dosage ────────────────────────────────────────────────────────────────
  const confidenceScore = roundTo2(
    notEmpty(get(raw, "drug.drug_confidence_score")),
  );
  const fetchedFrom = notEmpty(get(raw, "drug.drug_fetched_from"));
  const qty = notEmpty(get(raw, "drug.quantity"));
  const qtyQual = notEmpty(get(raw, "drug.quantity_qualifier"));
  const daysSupply = notEmpty(get(raw, "drug.days_supply"));

  const dosagePrimary = [confidenceScore, fetchedFrom].filter(Boolean);
  const dosageSecondary = [
    qty && qtyQual ? `${qty} ${qtyQual}` : qty || qtyQual,
    daysSupply ? `${daysSupply} days` : "",
  ].filter(Boolean);

  // ── ICD codes from diagnosis.diagnosis_codes ──────────────────────────────
  const diagCodes: any[] = Array.isArray(raw?.diagnosis?.diagnosis_codes)
    ? raw.diagnosis.diagnosis_codes
    : [];

  const primaryDiag = diagCodes.find(
    (d) => d?.is_primary === true || d?.is_primary === "true",
  );
  const secondaryDiag = diagCodes.find(
    (d) => d?.is_secondary === true || d?.is_secondary === "true",
  );

  function diagPrimary(d: any, isSecondary = false): string[] {
    if (!d) return isSecondary ? [] : ["—"];
    const score = roundTo2(notEmpty(String(d?.confidence_score ?? "")));
    const source = notEmpty(d?.source ?? "");
    return [score, source].filter(Boolean);
  }
  function diagSecondary(d: any): string[] {
    if (!d) return [];
    const code = notEmpty(d?.icd10_code ?? "");
    const desc = notEmpty(d?.description ?? "");
    return [code, desc].filter(Boolean);
  }

  // ── RISA AI workflow story (all from real BQ fields) ──────────────────────
  const ai = deriveAiStage(raw);
  const aiDrug = notEmpty(get(raw, "drug.drug_name_onco_emr")) || drugName;
  const aiPayer =
    notEmpty(get(raw, "insurance.active_insurance.insurance.plan_name")) ||
    notEmpty(get(raw, "insurance.active_insurance.pbm.insurer")) ||
    notEmpty(get(raw, "insurance.active_insurance.insurance.insurer"));
  // Real chart evidence to feed the necessity engine.
  const aiSupportive = [
    primaryDiag
      ? `Primary Dx: ${notEmpty(primaryDiag.icd10_code)} ${notEmpty(primaryDiag.description)}`.trim()
      : "",
    secondaryDiag
      ? `Secondary Dx: ${notEmpty(secondaryDiag.icd10_code)} ${notEmpty(secondaryDiag.description)}`.trim()
      : "",
    aiDrug ? `Ordered drug: ${aiDrug}` : "",
    daysSupply ? `Days supply: ${daysSupply}` : "",
  ].filter(Boolean);

  const Pill = ({ label, value, tone }: { label: string; value: string; tone: Tone }) => (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-bold uppercase tracking-wide text-primaryGray-9">{label}</span>
      <span className={`inline-block w-fit rounded-md px-2 py-0.5 text-x-tiny font-bold ${toneCls[tone]}`}>
        {value}
      </span>
    </div>
  );

  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
      <div className="border-primaryGray13 flex w-full min-w-0 flex-row items-stretch rounded-md bg-tertiaryBlue-12">
        {/* Medication — 1.5x */}
        <div style={{ flex: 1.5 }} className="min-w-0 overflow-hidden">
          <InternalChildCardMedical
            title="Medication"
            primaryDescription={medPrimary.length ? medPrimary : ["—"]}
            secondaryDescription={medSecondary.length ? medSecondary : ["—"]}
            showIcon={true}
            modalId={ModalId.EXPANDABLE_TABLE_ROW_MEDICATION_MODAL}
            rowData={modalRowData}
          />
        </div>

        {/* Insurance — 2x */}
        <div style={{ flex: 2 }} className="min-w-0 overflow-hidden">
          <InternalChildCard
            title="Insurance"
            primaryDescription={insPrimary.length ? insPrimary : ["—"]}
            secondaryDescription={insSecondary.length ? insSecondary : ["—"]}
            showIcon={true}
            isPrimaryInformation={false}
            modalId={ModalId.EXPANDABLE_TABLE_ROW_INSURANCE_MODAL}
            rowData={modalRowData}
          />
        </div>

        {/* Dosage — 1x */}
        <div style={{ flex: 1 }} className="min-w-0 overflow-hidden">
          <InternalChildCard
            title="Dosage"
            primaryDescription={dosagePrimary.length ? dosagePrimary : ["—"]}
            secondaryDescription={
              dosageSecondary.length ? dosageSecondary : ["—"]
            }
            showIcon={true}
            isPrimaryInformation={false}
            modalId={ModalId.EXPANDABLE_TABLE_ROW_DOSAGE_MODAL}
            rowData={modalRowData}
          />
        </div>

        {/* Primary ICD — 1.5x */}
        <div style={{ flex: 1.5 }} className="min-w-0 overflow-hidden">
          <InternalChildCard
            title="Primary ICD"
            primaryDescription={diagPrimary(primaryDiag)}
            secondaryDescription={diagSecondary(primaryDiag)}
            showIcon={true}
            isPrimaryInformation={false}
            modalId={ModalId.EXPANDABLE_TABLE_ROW_DIAGNOSIS_MODAL}
            rowData={modalRowData}
          />
        </div>

        {/* Secondary ICD — 1.5x (only if data exists) */}
        {secondaryDiag && (
          <div style={{ flex: 1.5 }} className="min-w-0 overflow-hidden">
            <InternalChildCard
              title="Secondary ICD"
              primaryDescription={diagPrimary(secondaryDiag, true)}
              secondaryDescription={diagSecondary(secondaryDiag)}
              showIcon={true}
              isPrimaryInformation={false}
              modalId={ModalId.EXPANDABLE_TABLE_ROW_SECONDARY_DIAGNOSIS_MODAL}
              rowData={modalRowData}
            />
          </div>
        )}
      </div>

      {/* ── RISA AI workflow + insights (real fields) ──────────────────────── */}
      <div className="flex w-full min-w-0 flex-col gap-3 rounded-md border border-[#d9e6ff] bg-white px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[#CC0300] px-2 py-0.5 text-[10px] font-bold text-white">
              RISA AI
            </span>
            <span className="text-xs font-semibold text-primaryGray-2">
              Workflow &amp; medical-necessity insight
            </span>
          </div>
          <button
            onClick={() => setMnOpen(true)}
            disabled={!aiDrug}
            className="rounded-md bg-[#005D49] px-3 py-1.5 text-x-tiny font-bold text-white hover:opacity-90 disabled:opacity-40"
            title={aiDrug ? "Run the multi-agent medical-necessity engine on this case" : "No drug on this case"}
          >
            Medical Necessity AI
          </button>
        </div>

        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <Pill label="1st STP" value={ai.stpLabel} tone={ai.stpTone} />
          <Pill label="Touchless" value={ai.touchless ? "Yes" : "No"} tone={ai.touchless ? "good" : "warn"} />
          <Pill label="Medical Necessity" value={ai.mnLabel} tone={ai.mnTone} />
          <Pill label="Needs Review" value={ai.needsReview} tone={ai.needsReviewTone} />
          {ai.predictionConfidence && (
            <Pill
              label="AI denial prediction"
              value={`${ai.predictionSummary || "Scored"} · ${ai.predictionConfidence}`}
              tone="info"
            />
          )}
        </div>

        <p className="text-[11px] leading-relaxed text-primaryGray-7">
          The first STP is automatic — demographics/form are filled and, when eligible, sent to plan
          touchlessly. Medical-necessity reasoning starts at the clinical questionnaire, where the AI agents
          answer the form to maximize approval probability.
        </p>
      </div>

      <ModalContainer rowData={modalRowData} />

      <MedicalNecessityAgents
        open={mnOpen}
        onClose={() => setMnOpen(false)}
        drug={aiDrug}
        payer={aiPayer}
        supportiveTexts={aiSupportive}
        contradictoryTexts={[]}
        questions={[]}
      />
    </div>
  );
};

export default BqExpandableRow;
