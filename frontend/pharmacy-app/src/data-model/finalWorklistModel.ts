export interface FinalWorklistPayload {
  org_id: string;
  upload_date_from?: string;
  upload_date_to?: string;
  sort_by: string;
  sort_order: "ASC" | "DESC";
  page: number;
  page_size: number;
}

export interface FinalWorklistApiResponse<T> {
  data: T[];
  execution_time_ms: number;
  pagination: Pagination;
  query_info: QueryInfo;
  status: "success" | "error" | string;
}

export interface Pagination {
  current_page: number;
  page_size: number;
  total_records: number;
  total_pages: number;
  has_next: boolean;
  has_previous?: boolean; // Optional in case it's included
}

export interface QueryInfo {
  total_records: number;
  returned_records: number;
  query_complexity: "LOW" | "MEDIUM" | "HIGH" | string;
  filters_applied: string[]; // Can be an array of strings or filter objects depending on implementation
  cache_used: boolean;
}

export interface FinalWorklistDataResponse {
  active: string;
  active_secondary: string;
  added_in_pm: string;
  additional_remarks: string;
  any_exclusions: string;
  assigned: string;
  auth_status: string;
  bo_value: string;
  call_ref_number: string;
  co_ins: string;
  copay: string;
  cpt_code: string;
  created_at: string;
  date_of_service: string;
  date_of_work: string;
  ded_met_total: string;
  denial_comments: string;
  dob: string;
  dosage: string;
  effective_date: string;
  effective_date_secondary: string;
  icd_10: string;
  id: string;
  ins_id: string;
  location: string;
  md: string;
  medical_pa_order_id: string | null;
  mrn: string;
  oop_met_total: string;
  order_creation_date: string;
  patient_name: string;
  plan_type: string;
  pre_d_req: string;
  primary_insurance: string;
  prior_auth_req: string;
  provider_npi: string;
  provider_par: string;
  ref_req: string;
  regimen: string;
  rep_name: string;
  secondary_ins: string;
  source_gs_path: string;
  status_tracking_rpa: string;
  units: string;
  upload_id: string;
  upload_timestamp: string;
  will_cover: string;
  auth_issue_comments: string;
}
