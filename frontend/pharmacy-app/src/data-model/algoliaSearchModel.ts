export interface AlgoliaSearchResponse {
  success?: boolean;
  hits?: Hit[];
  nb_hits?: number;
  nb_pages?: number;
  page?: number;
  hits_per_page?: number;
  processing_time_ms?: number;
  query?: string;
  params?: string;
  message?: string;
  error?: any;
}

export interface Hit {
  objectID?: string;
  id?: string;
  created_at?: number;
  created_at_iso?: string;
  indexed_at?: number;
  indexed_at_iso: string;
  date_of_work?: number;
  date_of_work_iso?: string;
  auth_status?: string;
  primary_member_id?: string;
  primary_payer_name?: string;
  primary_active?: string;
  primary_status?: string;
  service_type?: string;
  location?: string;
  order_id?: string;
  practitioner_name?: string;
  regimen_name?: string;
  date_of_service?: number;
  date_of_service_iso?: string;
  org_id?: string;
  patient_id?: string;
  mark_as_completed?: boolean;
  ev_bv_secondary?: string;
  ev_bv_primary?: string;
  bo_status?: string;
  ev_write_back_status?: string;
  financial_review?: string;
  auth_on_file_check?: string;
  order_creation?: string;
  document_upload_status?: string;
  patient_fhir_identifier?: string;
  date_of_birth?: string;
  last_name?: string;
  first_name?: string;
  ev_bv_tertiary?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  master_auth_status?: string;
  alerts?: string[];
  alert_badges?: string[];
}
