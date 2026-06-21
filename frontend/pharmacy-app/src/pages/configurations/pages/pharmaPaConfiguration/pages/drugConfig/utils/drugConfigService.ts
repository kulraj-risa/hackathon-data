import { FirestoreService } from "../../../../../../../api/firebase/firestoreService";
import { FirestoreCollectionReference } from "../../../../../../../api/firebase/references";

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

export interface ClinicalQuestionnaireRulesResponse {
  environment: string;
  related_drugs: string[];
  clinical_questionnaire_rules: string[];
  clinical_questionnaire_rules_updated_at: string;
  updated_by: string;
  id: string;
  source: string;
}

export const fetchIcdInstructionsrespnse = async (
  organization: string,
  drugName: string,
): Promise<IcdInstructionsResponse> => {
  try {
    const reponse =
      await FirestoreService.getAllDocuments<IcdInstructionsResponse>(
        FirestoreCollectionReference.getIcdInstructions(organization, drugName),
      );
    if (reponse && reponse.length > 0 && reponse[0].icd_instructions) {
      const result: IcdInstructionsResponse = {
        icd_instructions: reponse[0].icd_instructions,
        clinical_questionnaire_rules: reponse[0].clinical_questionnaire_rules,
        related_drugs: reponse[0].related_drugs,
        environment: reponse[0].environment,
        clinical_questionnaire_rules_updated_at:
          reponse[0].clinical_questionnaire_rules_updated_at,
        icd_instructions_updated_at: reponse[0].icd_instructions_updated_at,
        updated_by: reponse[0].updated_by,
        id: reponse[0].id,
        source: reponse[0].source,
      };
      return result;
    }
    return {
      icd_instructions: [],
      clinical_questionnaire_rules: [],
      related_drugs: [],
      environment: "",
      clinical_questionnaire_rules_updated_at: "",
      icd_instructions_updated_at: "",
      updated_by: "",
      id: "",
      source: "",
    };
  } catch (error) {
    console.error("Error fetching ICD instructions response:", error);
    return {
      icd_instructions: [],
      clinical_questionnaire_rules: [],
      related_drugs: [],
      environment: "",
      clinical_questionnaire_rules_updated_at: "",
      icd_instructions_updated_at: "",
      updated_by: "",
      id: "",
      source: "",
    };
  }
};

export const fetchClininaclQuestionnaireRules = async (
  organization: string,
  drugName: string,
): Promise<ClinicalQuestionnaireRulesResponse> => {
  try {
    const reponse =
      await FirestoreService.getAllDocuments<ClinicalQuestionnaireRulesResponse>(
        FirestoreCollectionReference.getClinicalQuestionnaireRules(
          organization,
          drugName,
        ),
      );
    if (
      reponse &&
      reponse.length > 0 &&
      reponse[0].clinical_questionnaire_rules
    ) {
      const result: ClinicalQuestionnaireRulesResponse = {
        clinical_questionnaire_rules: reponse[0].clinical_questionnaire_rules,
        related_drugs: reponse[0].related_drugs,
        environment: reponse[0].environment,
        clinical_questionnaire_rules_updated_at:
          reponse[0].clinical_questionnaire_rules_updated_at,
        updated_by: reponse[0].updated_by,
        id: reponse[0].id,
        source: reponse[0].source,
      };
      return result;
    }
    return {
      clinical_questionnaire_rules: [],
      related_drugs: [],
      environment: "",
      clinical_questionnaire_rules_updated_at: "",
      updated_by: "",
      id: "",
      source: "",
    };
  } catch (error) {
    console.error(
      "Error fetching Clinical Questionnaire Rules response:",
      error,
    );
    return {
      clinical_questionnaire_rules: [],
      related_drugs: [],
      environment: "",
      clinical_questionnaire_rules_updated_at: "",
      updated_by: "",
      id: "",
      source: "",
    };
  }
};
