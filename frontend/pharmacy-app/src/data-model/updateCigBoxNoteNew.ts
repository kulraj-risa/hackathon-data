export interface UpdateCigBoxNoteNew {
  patient_mrn: string;
  drug_name: string;
  write_back_reports: {
    note: string;
    report_status: string;
    report_identifier: string;
  }[];
  identifier: string;
  visit_date?: string;
  org_id: string;
  bo_status: string;
}
