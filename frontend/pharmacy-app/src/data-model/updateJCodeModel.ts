export interface JCodeDataModel {
  id?: string;
  j_code?: string;
  start_date?: string;
  end_date?: string;
  num_visits?: number;
  auth_status?: string;
  medicine_name?: string;
  description?: string;
  visits_happened?: number;
  visits_remaining?: number;
  comment_date?: string;
}

export interface UpdateJCodeDataModel {
  identifier?: string;
  j_codes?: JCodeDataModel[];
  org_id?: string;
}
