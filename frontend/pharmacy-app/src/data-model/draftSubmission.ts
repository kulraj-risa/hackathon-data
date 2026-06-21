export interface DraftSubmission {
  auth_id: string;
  payer_portal: string;
  created_at: string;
  updated_at: string;
  plan_name: string;
  member_id: string;
  provider_name: string;
  comments: string;
  file_path: string;
  j_codes: JCode[];
  url: string;
  payer_name: string;
  id?: string;
}

export interface JCode {
  j_code: string;
  description: string;
}
