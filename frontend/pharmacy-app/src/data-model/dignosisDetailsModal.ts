import { DiagnosisSource } from "../enums/diagnosisSource";

export interface DiagnosesDetailsModel {
  identifier?: string;
  patientMrn?: string;
  createdAt?: string;
  icd10Code?: string;
  description?: string;
  drugName?: string;
  diagDate?: string;
  lastVerifiedDate?: string;
  isPrimary?: boolean;
  isSecondary?: boolean;
  isFoundByPriorityOrder?: boolean;
  source?: DiagnosisSource;
  llmThinking?: string;
  confidenceScore?: number;
}

export function mapDiagnosesDetails(apiResponse: any): DiagnosesDetailsModel {
  return {
    identifier: apiResponse.identifier ?? undefined,
    patientMrn: apiResponse.patient_mrn ?? undefined,
    createdAt: apiResponse.created_at ?? undefined,
    icd10Code: apiResponse.icd10_code ?? undefined,
    description: apiResponse.description ?? undefined,
    drugName: apiResponse.drug_name ?? undefined,
    diagDate: apiResponse.diag_date ?? undefined,
    lastVerifiedDate: apiResponse.last_verified_date ?? undefined,
    isPrimary:
      apiResponse.is_primary === true ||
      apiResponse.is_primary === "true" ||
      false,
    isSecondary:
      apiResponse.is_secondary === true ||
      apiResponse.is_secondary === "true" ||
      false,
    isFoundByPriorityOrder:
      apiResponse.is_found_by_priority_order === true ||
      apiResponse.is_found_by_priority_order === "true" ||
      false,
    source: Object.values(DiagnosisSource).includes(apiResponse.source)
      ? (apiResponse.source as DiagnosisSource)
      : undefined,
    llmThinking: apiResponse.llm_thinking ?? undefined,
    confidenceScore: apiResponse.confidence_score ?? undefined,
  };
}
