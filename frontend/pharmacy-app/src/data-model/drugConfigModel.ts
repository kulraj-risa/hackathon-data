export interface DrugConfigModel {
  id: string;
  name?: string[];
  related_drugs?: any[];
  dx_code_rules?: any[];
  icd_instructions?: string[];

  created_at?: string;
  updated_at?: string;
  updated_by?: string;
  icd_data?: any[];
  icd_instructions_updated_at?: string;
}

export interface MedicationItem {
  display_name: string;
  environment: string;
  instructions_count: number;
  last_updated: string;
  name: string;
  source: string;
  related_drugs?: string[];
  icd_instructions?: string[];
  icd_instructions_updated_at?: string;
}

export interface DrugConfigResponse {
  environment: string;
  id: string;
  last_sync: string;
  medications: MedicationItem[];
  total_count: number;
  version: number;
}

export interface IcdInstructionsResponse {
  environment: string;
  related_drugs: string[];
  icd_instructions: string[];
  clinical_questionnaire_rules: string[];
  clinical_questionnaire_rules_updated_at: string;
  icd_instructions_updated_at: string;
  updated_by: string;
  id: string;
  source: string;
}
