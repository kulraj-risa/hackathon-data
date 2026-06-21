export interface CredentialConfigModel {
  client_name?: string;
  client_id: string;
  org_name: string;
  org_id: string;
  portal_name: string;
  facility_name: string;
  portal_id: string;
  email: string;
  username: string;
  password: string;
  mfa_present?: boolean;
  is_active: boolean;
  is_queue?: boolean;
  is_available?: boolean;
  body_regex?: string;
  subject_regex?: string;
  portal_url?: string;
  credential_id?: string;
  created_at?: string;
  updated_at?: string;
  updated_by?: string;
}
