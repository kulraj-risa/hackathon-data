import { TableCellType } from "../../../../components/custom-table/table";

export interface FieldMapping {
  columnKey: string;
  label: string;
  cellType: TableCellType;
  mainField: string;
  secondaryField?: string;
  prefix?: string;
  suffix?: string;
  concatFields?: string[];
  secondaryPrefix?: string;
  secondarySuffix?: string;
  secondaryConcatFields?: string[];
  mappable: boolean;
}

export const ALL_BQ_FIELD_PATHS: string[] = [
  // Top-level
  "identifier",
  "org_id",
  "portal_id",

  // Workflow
  "workflow.status",
  "workflow.final_outcome",
  "workflow.comment",
  "workflow.error_text",
  "workflow.type",
  "workflow.review_type",
  "workflow.assignee_id",
  "workflow.cmm_result_key",
  "workflow.patient_eligibility_check_status",
  "workflow.is_substitution_allowed",
  "workflow.date_of_service",

  // Drug
  "drug.drug_name",
  "drug.drug_name_onco_emr",
  "drug.drug_fetched_from",
  "drug.drug_confidence_score",
  "drug.drug_picked_thinking",
  "drug.ndc_number",
  "drug.quantity",
  "drug.quantity_qualifier",
  "drug.days_supply",

  // Prescription
  "prescription.description",
  "prescription.prescription_date",
  "prescription.instructions",
  "prescription.dispense_qty",
  "prescription.dispense_qty_string",
  "prescription.refill_qty",
  "prescription.refill_qty_string",
  "prescription.is_related_drug_match",

  // Patient
  "patient.patient_mrn",
  "patient.first_name",
  "patient.last_name",
  "patient.full_name",
  "patient.dob",
  "patient.age",
  "patient.gender",
  "patient.phone_number",
  "patient.address.street1",
  "patient.address.street2",
  "patient.address.city",
  "patient.address.state",
  "patient.address.zip",
  "patient.address.full_address",
  "patient.address.city_state_zip",

  // Provider
  "provider.first_name",
  "provider.last_name",
  "provider.full_name",
  "provider.npi",
  "provider.credentials",
  "provider.practice_name",
  "provider.speciality",
  "provider.phone",
  "provider.fax",
  "provider.address.street1",
  "provider.address.street2",
  "provider.address.city",
  "provider.address.state",
  "provider.address.zip",

  // Insurance
  "insurance.form_picked_flag",
  "insurance.patient_member_id",
  "insurance.patient_rx_bin",
  "insurance.patient_rx_group",
  "insurance.patient_rx_pcn",
  "insurance.patient_insurance_state",
  "insurance.sftp_rx_bin",
  "insurance.sftp_member_id",
  "insurance.active_insurance.insurance.insurer",
  "insurance.active_insurance.insurance.plan_name",
  "insurance.active_insurance.insurance.plan_number",
  "insurance.active_insurance.insurance.policy_number",
  "insurance.active_insurance.insurance.group_number",
  "insurance.active_insurance.insurance.effective",
  "insurance.active_insurance.insurance.term",
  "insurance.active_insurance.insurance.phone",
  "insurance.active_insurance.insurance.type",

  // Denial Prediction
  "denial_prediction.prediction_summary",
  "denial_prediction.prediction_confidence",

  // Response Status Information
  "response_status_information.denial_reason",
  "response_status_information.denial_summary",
  "response_status_information.auth_date",

  // Metadata
  "metadata.pay_method",
  "metadata.filename",
  "metadata.metadata.portal_name",

  // Flat legacy fields (current pa_request_entries table)
  "patient_name",
  "patient_mrn",
  "dob",
  "provider_name",
  "drug",
  "pharmacy_type",
  "covermymed_id",
  "response_status",
  "second_stp_status",
  "poc",
  "rx_due_date",
  "seq",
  "insuranceid",
  "pharmacy",
  "bin",
  "pharmacy_phone",
  "filename",
  "dumped_at",
  "sftp_status",
  "qa_filled_by",
  "text_note_status",
  "prescriber_npi",
];

export const DEFAULT_FIELD_MAPPING: FieldMapping[] = [
  {
    columnKey: "expandableRowIcon",
    label: "",
    cellType: TableCellType.EXPANDABLE_ROW_ICON,
    mainField: "identifier",
    mappable: false,
  },
  {
    columnKey: "patientDetails",
    label: "Patient Details",
    cellType: TableCellType.MULTILINE,
    mainField: "patient.full_name",
    secondaryField: "patient.patient_mrn",
    secondaryPrefix: "MRN : ",
    mappable: true,
  },
  {
    columnKey: "dateOfBirth",
    label: "Date of Birth",
    cellType: TableCellType.MULTILINE,
    mainField: "patient.dob",
    secondaryField: "patient.age",
    secondarySuffix: " yrs",
    mappable: true,
  },
  {
    columnKey: "dateOfService",
    label: "DOS",
    cellType: TableCellType.STRING,
    mainField: "workflow.date_of_service",
    mappable: true,
  },
  {
    columnKey: "providerDetails",
    label: "Provider Details",
    cellType: TableCellType.STRING,
    mainField: "provider.full_name",
    mappable: true,
  },
  {
    columnKey: "drug",
    label: "Medication",
    cellType: TableCellType.STRING,
    mainField: "drug.drug_name_onco_emr",
    mappable: true,
  },
  {
    columnKey: "cmmKey",
    label: "CoverMyMeds ID",
    cellType: TableCellType.COPY_DATA,
    mainField: "workflow.cmm_result_key",
    mappable: true,
  },
  {
    columnKey: "noDataFields",
    label: "Missing Data",
    cellType: TableCellType.BADGE,
    mainField: "missing_data.missing_data_status",
    mappable: true,
  },
  {
    columnKey: "status",
    label: "Status",
    cellType: TableCellType.BADGE,
    mainField: "workflow.status",
    mappable: true,
  },
  {
    columnKey: "outcome",
    label: "Outcome",
    cellType: TableCellType.BADGE,
    mainField: "workflow.final_outcome",
    mappable: true,
  },
  {
    columnKey: "button",
    label: "Action",
    cellType: TableCellType.BUTTON_WITH_THREE_DOTS,
    mainField: "identifier",
    mappable: false,
  },
  {
    columnKey: "recordClosedBy",
    label: "POC",
    cellType: TableCellType.RECORD_CLOSED_BY,
    mainField: "record_closed_by.human_agent",
    mappable: true,
  },
];
