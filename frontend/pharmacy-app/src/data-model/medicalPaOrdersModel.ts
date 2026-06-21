import { AuthStatusChange } from "../components/modals/StatusUpdateModal/StatusUpdateModal";
import { BusniessOfficeNote } from "./busniessOfficeNote";

export interface Address {
  country?: string;
  city?: string;
  street1?: string;
  state?: string;
  street2?: string;
  postal_code?: string;
}

export interface Demographics {
  address?: Address;
  patient_fhir_identifier?: string;
  date_of_birth?: string;
  patient_mrn?: string;
  sex?: string;
  last_name?: string;
  phone_number?: string;
  first_name?: string;
}

export interface Payload {
  service_type?: string;
  location?: string;
  facility_id?: string;
  patient_id?: string;
  drug_name?: string;
  date_of_service?: string;
  regimen_name?: string;
  practitioner_name?: string;
}

export interface PatientResponsibility {
  individual_out_of_pocket?: string;
  individual_deductibles?: string;
  service_year_from?: string;
  family_deductibles?: string;
  family_out_of_pocket_met?: string;
  deductibles_network_type?: string;
  individual_deductibles_met?: string;
  co_pay?: string;
  family_out_of_pocket?: string;
  out_of_pocket_network_type?: string;
  updated_at?: string;
  status?: string;
  co_insurance?: string;
  coverage_status?: string;
  service_year_to?: string;
  individual_out_of_pocket_met?: string;
  family_deductibles_met?: string;
}

export interface SingleCoverage {
  member_id?: string;
  payer_name?: string;
  patient_responsibility?: PatientResponsibility;
  active?: boolean;
  status?: string;
  updated_at?: string;
  fetch_coverage_attempt?: number;
  payer_id?: string;
  service_year_from?: string;
  plan_name?: string;
  coverage_status?: string;
}

export interface Coverage {
  secondary?: SingleCoverage;
  primary?: SingleCoverage;
  tertiary?: SingleCoverage;
}

export interface Status {
  auth_on_file?: AuthOnFileStatus;
  order_creation?: string;
  clinical_data?: Record<string, number>;
  ev_bv?: Record<string, string>;
  submission?: string;
  approval?: string;
  auth_on_file_check?: string;
  financial_review?: string;
  final_status?: string;
  bo_status?: string;
  mark_as_completed?: boolean;
  ev_write_back_status?: string;
  document_upload_status?: string;
  master_auth_status?: string;
  health_first_nar_rpa_status?: string;
  fax_submission_status?: string;
}

export interface AuthOnFileStatus {
  status: string;
  updated_at: string;
  error_type?: string;
  error_message?: string;
}

export interface AssignedTo {
  facility_id?: string;
  provider_id?: string;
  provider_name?: string;
}

export interface DrugDosageDetails {
  authored_on?: string;
  cycles?: string;
  dose_quantity_unit?: string;
  dose_quantity_value?: number;
  drug_name?: string;
  frequency?: string;
  hcpcs_code?: string;
  hcpcs_code_description?: string;
  number_of_repeats_allowed?: number;
  route?: string;
  status?: string;
  text?: string;
  facility_id?: string;
  order_id?: string;
  patient_id?: string;
}

export interface RequestingPractitionerDetails {
  address?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  npi?: string;
  phone?: string;
  practitioner_fhir_identifier?: string;
  tax_id?: string;
}

export interface PrimaryDiagnosisDetails {
  diagnosis?: string;
  icd_code?: string;
  icd_description?: string;
  selected_type?: string;
  height?: string;
  weight?: string;
}

export interface SubmissionRequiredDetails {
  point_of_care_fax_number?: string;
  point_of_care_phone_number?: string;
  purchase_type?: string;
  select_network?: string;
}

export interface VisitDetails {
  address?: {
    city?: string;
    country?: string;
    line?: string;
    postal_code?: string;
    state?: string;
    type?: string;
  };
  location_fhir_identifier?: string;
  name?: string;
  phone?: string;
  visit_count?: number;
}

export interface ClinicalDocument {
  created_at?: string;
  document_name?: string;
  document_type?: string;
  file_path?: string;
  identifier?: string;
  patient_mrn?: string;
  signed_status_text?: string;
  visit_date?: string;
}

export interface AuthOnFileModel {
  auth_needed?: boolean;
  cig_box_data?: string;
  total_visits_allowed?: number;
  total_visits_latest_auth_duration?: number;
  auth_range_response?: AuthRangeDetails;
  no_auth_required?: boolean;
}

export interface AuthRangeRequest {
  mrn?: string[];
  identifier?: string[];
  reports?: Report[];
}

export interface AuthRangeDetails {
  auth_range_end?: string;
  auth_range_start?: string;
  error?: string | null;
  no_auth_required?: boolean;
  num_visits?: number;
}

export interface StatusHistory {
  assigned_at?: string;
  evbv_at?: string;
}

export interface Report {
  report_identifier?: string;
  media_type?: string;
  pre_text?: string;
  post_text?: string;
}

export interface AuthGrid {
  artifact_timestamp: string;
  auth_status: string;
  created_at: string;
  drug_description: string;
  drug_name: string;
  end_date: string;
  identifier: string;
  j_code: string;
  line_of_business: string;
  metadata: any;
  payer: string;
  plan_name: string;
  remarks: string;
  source: string;
  start_date: string;
}

export interface ClientConfig {
  client: string;
  client_id: string;
  doc_upload: boolean;
  identifier: string;
  mode: string;
}

export interface NarStatus {
  auth_grid: AuthGrid;
  auth_grid_status: string;
  auth_source: string;
  auth_status: string;
  client_config: ClientConfig;
  historical_evidence: any;
}

export interface JCodeDetails {
  id?: string;
  j_code?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  num_visits?: number;
  auth_status?: string;
  nar_status?: NarStatus;
  medicine_name?: string[];
  visits_happened?: number;
  visits_remaining?: number;
  documents?: JCodeDocuments[];
}

export interface JCodeDocuments {
  doc_title?: string;
  doc_type?: string;
  doc_path?: string;
  doc_upload_date?: string;
  doc_upload_by?: string;
  id?: string;
}

export interface DocumentDetails {
  id?: string;
  j_code?: string;
  description?: string;
  start_date?: string;
  auth_status?: string;
  medicine_name?: string[];
}

export interface AuthRangeResponse {
  report_identifier?: string;
  evidences?: string[];
  cig_box_text?: string;
  j_codes?: JCodeDetails[];
}

export interface AuthOnFile {
  auth_entries?: AuthRangeResponse[];
  auth_status?: string;
  error?: any;
  created_at?: string;
  reports?: BusniessOfficeNote[];
  template_text?: string;
  drug_template_text?: string;
  source?: string;
  screenshots?: Screenshot;
  flowsheet_regimen_details?: FlowsheetRegimenDetails;
  visit_data_charts?: VisitDataChartDetails;
}
export interface FlowsheetRegimenDetails {
  cycles?: string;
  extracted_at?: string;
  icd_codes?: string;
  last_tx?: string;
  reason_for_dc?: string;
  regimen?: string;
  regimen_tag: string;
  start_date?: string;
  status?: string;
  tx_intent?: string;
  tx_setting: string;
}
export interface Screenshot {
  treatment_plan_path?: string;
  cig_box_screenshots?: Record<string, string>;
  write_note_cig_box_screenshot?: Record<string, string>;
  document_upload_screenshots?: DocumentUploadScreenshot[];
  write_note_trails?: WriteBackTrail[];
}

export interface DocumentUploadScreenshot {
  created_at: string;
  document_name: string;
  screenshot_path: string;
}

export interface Timestamp {
  date_of_service?: string;
  date_of_work?: string;
  date_of_last_checked?: string;
  date_of_hold_until?: string;
  assigned_at?: string;
}

export interface Metadata {
  alert_badges: string[];
  alerts: string[];
}

export interface MedicalPaOrder {
  id?: string;
  assigned_to?: AssignedTo;
  payload?: Payload;
  facility_id?: string;
  order_id?: string;
  patient_id?: string;
  created_at?: string;
  demographics?: Demographics;
  search_index?: string[];
  status?: Status;
  coverage?: Coverage;
  drug_dosage_details?: DrugDosageDetails;
  requesting_practitioner_details?: RequestingPractitionerDetails;
  primary_diagnosis_details?: PrimaryDiagnosisDetails;
  submission_required_details?: SubmissionRequiredDetails;
  visit_details?: VisitDetails;
  clinical_document?: ClinicalDocument;
  rpa_screenshot_path?: string;
  auth_on_file?: AuthOnFile;
  status_history?: StatusHistory;
  mark_as_completed_trial?: MarkAsCompletedTrial[];
  metadata?: Metadata;
  auth_status_changes?: AuthStatusChange[];
  timestamps?: Timestamp;
  hpcs_codes?: HpcsCode[];
  selected_form_id_for_submission?: string;
}

export interface NarAgentGridData {
  identifier?: string;
  payer?: string;
  line_of_business?: string;
  j_code?: string;
  drug_name?: string;
  updated_at?: string;
  agent_mode?: string;
}

export interface MarkAsCompletedTrial {
  radio_btn_flipped?: boolean;
  bo_value_flipped?: boolean;
  radio_btn_change?: {
    old_value?: string;
    new_value?: string;
  };
}

export interface HpcsCode {
  auth_status?: string;
  description?: string;
  j_code?: string;
}

export interface WriteBackTrail {
  created_at?: string;
  new_auth_status?: string;
  previous_auth_status?: string;
  report_identifier?: string;
  screenshot_path?: string;
  status_updated_at?: string;
}

export interface VisitDataChartDetails {
  [key: string]: VisitDataChartDetail;
}

export interface VisitDataChartDetail {
  data?: RegimenDoseData[];
  extracted_at?: string;
  headers?: string[];
  total_rows?: number;
}

export interface RegimenDoseData {
  Actual: string;
  "Cum. Dose": string;
  Date: string;
  "Dose Density": string;
  Planned: string;
  is_current_period: boolean;
}
