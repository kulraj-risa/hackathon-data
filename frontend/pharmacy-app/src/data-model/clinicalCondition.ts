export interface ClinicalEntry {
  icd10_code?: string;
  icd10_desc?: string;
  recorded_date?: string;
}

export interface ClinicalData {
  entries?: ClinicalEntry[];
}
