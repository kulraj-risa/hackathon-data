export interface QuestionForUI {
  question: string;
  type: string;
  options: string[];
}

export interface Question {
  question: string;
  question_type: string;
  options: string[];
}

export interface Prescription {
  drug_days_supply: number;
  drug_name: string;
  drug_quantity: number;
}

export interface Diagnosis {
  code: string;
  description: string;
}

export interface OncoEmrMedicineSummary {
  identifier: string;
  patient_mrn: string;
  drug_name: string;
  regimen_description: string;
  created_at: string;
  drug_quantity: string | null;
  drug_refill_quantity: string | null;
  regimen_instruction: string | null;
  is_best_match: string;
  is_substitution_allowed: string | null;
}

export interface SampleDataModel {
  mrn: string;
  identifier: string;
  prescription: Prescription;
  diagnosis: Diagnosis;
  questions: Question[];
  questions_for_ui: QuestionForUI[];
  pdf_path: string;
  oncoemr_medicine_summary: OncoEmrMedicineSummary[];
  is_substitution_allowed: boolean;
}
