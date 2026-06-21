/**
 * Canonical BigQuery schema definition for rapids-platform.pharma_demo.demo_env_single_table
 * Derived from schema.json — covers all scalar/editable leaf fields.
 * REPEATED arrays are marked readonly and shown as JSON viewers.
 */

export interface BqFieldDef {
  path: string;
  label: string;
  type: "STRING" | "FLOAT" | "INTEGER" | "BOOLEAN" | "TIMESTAMP";
  section: string;
  readonly?: boolean;
}

export const BQ_SECTIONS: { key: string; label: string; readonly?: boolean }[] =
  [
    { key: "top", label: "Top-Level" },
    { key: "patient", label: "Patient" },
    { key: "patient_address", label: "Patient Address" },
    { key: "provider", label: "Provider" },
    { key: "provider_address", label: "Provider Address" },
    { key: "workflow", label: "Workflow" },
    { key: "drug", label: "Drug" },
    { key: "prescription", label: "Prescription" },
    { key: "insurance", label: "Insurance" },
    { key: "insurance_active", label: "Active Insurance" },
    { key: "denial_prediction", label: "Denial Prediction" },
    { key: "response_status", label: "Response Status" },
    { key: "questionnaire", label: "Questionnaire" },
    { key: "metadata", label: "Metadata" },
    { key: "diagnosis", label: "Diagnosis (read-only)", readonly: true },
    { key: "documents", label: "Documents (read-only)", readonly: true },
    {
      key: "insurance_records",
      label: "Insurance Records (read-only)",
      readonly: true,
    },
  ];

export const BQ_EDITABLE_FIELDS: BqFieldDef[] = [
  // ── Top-level ──────────────────────────────────────────────────────────────
  { path: "identifier", label: "Identifier", type: "STRING", section: "top" },
  { path: "org_id", label: "Org ID", type: "STRING", section: "top" },
  { path: "portal_id", label: "Portal ID", type: "STRING", section: "top" },

  // ── Patient ────────────────────────────────────────────────────────────────
  {
    path: "patient.patient_mrn",
    label: "MRN",
    type: "STRING",
    section: "patient",
  },
  {
    path: "patient.first_name",
    label: "First Name",
    type: "STRING",
    section: "patient",
  },
  {
    path: "patient.last_name",
    label: "Last Name",
    type: "STRING",
    section: "patient",
  },
  {
    path: "patient.full_name",
    label: "Full Name",
    type: "STRING",
    section: "patient",
  },
  {
    path: "patient.dob",
    label: "Date of Birth",
    type: "STRING",
    section: "patient",
  },
  {
    path: "patient.gender",
    label: "Gender",
    type: "STRING",
    section: "patient",
  },
  {
    path: "patient.phone_number",
    label: "Phone Number",
    type: "STRING",
    section: "patient",
  },

  // ── Patient Address ────────────────────────────────────────────────────────
  {
    path: "patient.address.street1",
    label: "Street 1",
    type: "STRING",
    section: "patient_address",
  },
  {
    path: "patient.address.street2",
    label: "Street 2",
    type: "STRING",
    section: "patient_address",
  },
  {
    path: "patient.address.city",
    label: "City",
    type: "STRING",
    section: "patient_address",
  },
  {
    path: "patient.address.state",
    label: "State",
    type: "STRING",
    section: "patient_address",
  },
  {
    path: "patient.address.zip",
    label: "ZIP",
    type: "STRING",
    section: "patient_address",
  },
  {
    path: "patient.address.full_address",
    label: "Full Address",
    type: "STRING",
    section: "patient_address",
  },
  {
    path: "patient.address.city_state_zip",
    label: "City / State / ZIP",
    type: "STRING",
    section: "patient_address",
  },

  // ── Provider ───────────────────────────────────────────────────────────────
  {
    path: "provider.first_name",
    label: "First Name",
    type: "STRING",
    section: "provider",
  },
  {
    path: "provider.last_name",
    label: "Last Name",
    type: "STRING",
    section: "provider",
  },
  {
    path: "provider.full_name",
    label: "Full Name",
    type: "STRING",
    section: "provider",
  },
  {
    path: "provider.npi",
    label: "NPI",
    type: "STRING",
    section: "provider",
  },
  {
    path: "provider.credentials",
    label: "Credentials",
    type: "STRING",
    section: "provider",
  },
  {
    path: "provider.practice_name",
    label: "Practice Name",
    type: "STRING",
    section: "provider",
  },
  {
    path: "provider.speciality",
    label: "Speciality",
    type: "STRING",
    section: "provider",
  },
  {
    path: "provider.phone",
    label: "Phone",
    type: "STRING",
    section: "provider",
  },
  {
    path: "provider.fax",
    label: "Fax",
    type: "STRING",
    section: "provider",
  },

  // ── Provider Address ───────────────────────────────────────────────────────
  {
    path: "provider.address.street1",
    label: "Street 1",
    type: "STRING",
    section: "provider_address",
  },
  {
    path: "provider.address.street2",
    label: "Street 2",
    type: "STRING",
    section: "provider_address",
  },
  {
    path: "provider.address.city",
    label: "City",
    type: "STRING",
    section: "provider_address",
  },
  {
    path: "provider.address.state",
    label: "State",
    type: "STRING",
    section: "provider_address",
  },
  {
    path: "provider.address.zip",
    label: "ZIP",
    type: "STRING",
    section: "provider_address",
  },

  // ── Workflow ───────────────────────────────────────────────────────────────
  {
    path: "workflow.status",
    label: "Status",
    type: "STRING",
    section: "workflow",
  },
  {
    path: "workflow.final_outcome",
    label: "Outcome",
    type: "STRING",
    section: "workflow",
  },
  {
    path: "workflow.comment",
    label: "Comment",
    type: "STRING",
    section: "workflow",
  },
  {
    path: "workflow.error_text",
    label: "Error Text",
    type: "STRING",
    section: "workflow",
  },
  {
    path: "workflow.type",
    label: "Type",
    type: "STRING",
    section: "workflow",
  },
  {
    path: "workflow.review_type",
    label: "Review Type",
    type: "STRING",
    section: "workflow",
  },
  {
    path: "workflow.assignee_id",
    label: "Assignee ID",
    type: "STRING",
    section: "workflow",
  },
  {
    path: "workflow.cmm_result_key",
    label: "CMM Result Key",
    type: "STRING",
    section: "workflow",
  },
  {
    path: "workflow.patient_eligibility_check_status",
    label: "Eligibility Check Status",
    type: "STRING",
    section: "workflow",
  },
  {
    path: "workflow.is_substitution_allowed",
    label: "Substitution Allowed",
    type: "BOOLEAN",
    section: "workflow",
  },
  {
    path: "workflow.date_of_service",
    label: "DOS",
    type: "STRING",
    section: "workflow",
  },

  // ── Drug ───────────────────────────────────────────────────────────────────
  {
    path: "drug.drug_name",
    label: "Drug Name",
    type: "STRING",
    section: "drug",
  },
  {
    path: "drug.drug_name_onco_emr",
    label: "Drug Name (Onco EMR)",
    type: "STRING",
    section: "drug",
  },
  {
    path: "drug.drug_fetched_from",
    label: "Fetched From",
    type: "STRING",
    section: "drug",
  },
  {
    path: "drug.drug_confidence_score",
    label: "Confidence Score",
    type: "FLOAT",
    section: "drug",
  },
  {
    path: "drug.drug_picked_thinking",
    label: "Drug Thinking",
    type: "STRING",
    section: "drug",
  },
  {
    path: "drug.ndc_number",
    label: "NDC Number",
    type: "STRING",
    section: "drug",
  },
  {
    path: "drug.quantity",
    label: "Quantity",
    type: "FLOAT",
    section: "drug",
  },
  {
    path: "drug.quantity_qualifier",
    label: "Quantity Qualifier",
    type: "STRING",
    section: "drug",
  },
  {
    path: "drug.days_supply",
    label: "Days Supply",
    type: "INTEGER",
    section: "drug",
  },

  // ── Prescription ───────────────────────────────────────────────────────────
  {
    path: "prescription.description",
    label: "Description",
    type: "STRING",
    section: "prescription",
  },
  {
    path: "prescription.prescription_date",
    label: "Prescription Date",
    type: "STRING",
    section: "prescription",
  },
  {
    path: "prescription.instructions",
    label: "Instructions",
    type: "STRING",
    section: "prescription",
  },
  {
    path: "prescription.dispense_qty",
    label: "Dispense Qty",
    type: "STRING",
    section: "prescription",
  },
  {
    path: "prescription.dispense_qty_string",
    label: "Dispense Qty (Text)",
    type: "STRING",
    section: "prescription",
  },
  {
    path: "prescription.refill_qty",
    label: "Refill Qty",
    type: "STRING",
    section: "prescription",
  },
  {
    path: "prescription.refill_qty_string",
    label: "Refill Qty (Text)",
    type: "STRING",
    section: "prescription",
  },
  {
    path: "prescription.is_related_drug_match",
    label: "Related Drug Match",
    type: "BOOLEAN",
    section: "prescription",
  },

  // ── Insurance ──────────────────────────────────────────────────────────────
  {
    path: "insurance.form_picked_flag",
    label: "Form Picked Flag",
    type: "STRING",
    section: "insurance",
  },
  {
    path: "insurance.patient_member_id",
    label: "Member ID",
    type: "STRING",
    section: "insurance",
  },
  {
    path: "insurance.patient_rx_bin",
    label: "RxBIN",
    type: "STRING",
    section: "insurance",
  },
  {
    path: "insurance.patient_rx_group",
    label: "RxGroup",
    type: "STRING",
    section: "insurance",
  },
  {
    path: "insurance.patient_rx_pcn",
    label: "RxPCN",
    type: "STRING",
    section: "insurance",
  },
  {
    path: "insurance.patient_insurance_state",
    label: "Insurance State",
    type: "STRING",
    section: "insurance",
  },
  {
    path: "insurance.sftp_rx_bin",
    label: "SFTP RxBIN",
    type: "STRING",
    section: "insurance",
  },
  {
    path: "insurance.sftp_member_id",
    label: "SFTP Member ID",
    type: "STRING",
    section: "insurance",
  },

  // ── Active Insurance ───────────────────────────────────────────────────────
  {
    path: "insurance.active_insurance.insurance.insurer",
    label: "Insurer",
    type: "STRING",
    section: "insurance_active",
  },
  {
    path: "insurance.active_insurance.insurance.type",
    label: "Type",
    type: "STRING",
    section: "insurance_active",
  },
  {
    path: "insurance.active_insurance.insurance.plan_name",
    label: "Plan Name",
    type: "STRING",
    section: "insurance_active",
  },
  {
    path: "insurance.active_insurance.insurance.plan_number",
    label: "Plan Number",
    type: "STRING",
    section: "insurance_active",
  },
  {
    path: "insurance.active_insurance.insurance.policy_number",
    label: "Policy Number",
    type: "STRING",
    section: "insurance_active",
  },
  {
    path: "insurance.active_insurance.insurance.group_number",
    label: "Group Number",
    type: "STRING",
    section: "insurance_active",
  },
  {
    path: "insurance.active_insurance.insurance.effective",
    label: "Effective Date",
    type: "STRING",
    section: "insurance_active",
  },
  {
    path: "insurance.active_insurance.insurance.term",
    label: "Term Date",
    type: "STRING",
    section: "insurance_active",
  },
  {
    path: "insurance.active_insurance.insurance.phone",
    label: "Phone",
    type: "STRING",
    section: "insurance_active",
  },
  {
    path: "insurance.active_insurance.insurance.retail_benefit",
    label: "Retail Benefit",
    type: "STRING",
    section: "insurance_active",
  },
  {
    path: "insurance.active_insurance.insurance.mail_order_benefit",
    label: "Mail Order Benefit",
    type: "STRING",
    section: "insurance_active",
  },
  {
    path: "insurance.active_insurance.insurance.ltc",
    label: "LTC",
    type: "STRING",
    section: "insurance_active",
  },
  {
    path: "insurance.active_insurance.insurance.specialty",
    label: "Specialty",
    type: "STRING",
    section: "insurance_active",
  },

  // ── Denial Prediction ──────────────────────────────────────────────────────
  {
    path: "denial_prediction.prediction_summary",
    label: "Prediction Summary",
    type: "STRING",
    section: "denial_prediction",
  },
  {
    path: "denial_prediction.prediction_confidence",
    label: "Confidence",
    type: "FLOAT",
    section: "denial_prediction",
  },

  // ── Response Status ────────────────────────────────────────────────────────
  {
    path: "response_status_information.denial_reason",
    label: "Denial Reason",
    type: "STRING",
    section: "response_status",
  },
  {
    path: "response_status_information.denial_summary",
    label: "Denial Summary",
    type: "STRING",
    section: "response_status",
  },
  {
    path: "response_status_information.auth_date",
    label: "Auth Date",
    type: "STRING",
    section: "response_status",
  },

  // ── Questionnaire (scalar fields only) ────────────────────────────────────
  {
    path: "questionnaire.document_name",
    label: "Document Name",
    type: "STRING",
    section: "questionnaire",
  },
  {
    path: "questionnaire.qa_confidence",
    label: "QA Confidence",
    type: "FLOAT",
    section: "questionnaire",
  },
  {
    path: "questionnaire.file_path",
    label: "File Path",
    type: "STRING",
    section: "questionnaire",
  },

  // ── Metadata ───────────────────────────────────────────────────────────────
  {
    path: "metadata.pay_method",
    label: "Pay Method",
    type: "STRING",
    section: "metadata",
  },
  {
    path: "metadata.filename",
    label: "Filename",
    type: "STRING",
    section: "metadata",
  },
  {
    path: "metadata.metadata.portal_name",
    label: "Portal Name",
    type: "STRING",
    section: "metadata",
  },
];

/** Repeated (array) fields shown as read-only JSON. Key = section key, value = raw data path */
export const BQ_READONLY_ARRAY_PATHS: Record<string, string> = {
  diagnosis: "diagnosis.diagnosis_codes",
  documents: "documents",
  insurance_records: "insurance.insurance_records",
};

/** Get a nested value from an object by dot-path */
export function getByPath(obj: any, path: string): any {
  return path.split(".").reduce((cur: any, k: string) => cur?.[k], obj);
}

/** Format a raw field key into a readable label */
export function fieldKeyToLabel(key: string): string {
  const last = key.split(".").pop() ?? key;
  return last.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
