export interface CmmOrderModel {
  created_at?: string;
  drug_name?: string;
  patient_mrn?: string;
  diagnosis_codes?: { description?: string; icd10_code?: string }[];
  form?: CmmFormDataModel;
  id?: string;
}

export interface CmmFormDataModel {
  form_data?: Record<string, any>;
  pa_form_options?: {
    description?: string;
    name?: string;
  }[];
}
