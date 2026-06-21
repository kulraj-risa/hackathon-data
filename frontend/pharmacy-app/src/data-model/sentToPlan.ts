export interface SentToPlanModel {
  created_at?: string;
  updated_at?: string;
  insurance_providers: string[];
  medication_names: string[];
  plan_name: string[];
  insurance_card_effective_year: string[];
  updated_by?: string;
}
