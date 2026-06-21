import { API_ENDPOINTS } from "../../enums/apiUrls";
import { getBearerToken } from "./bearerToken";

export interface ClinicalQuestionnaireDeterminationPayload {
  medicine_name: string;
  identifier: string;
  org_id: string;
}

export interface ClinicalQuestionnaireDeterminationResponse {
  data: any;
}

export const determineClinicalQuestionnaire = async (
  payload: ClinicalQuestionnaireDeterminationPayload,
): Promise<ClinicalQuestionnaireDeterminationResponse> => {
  try {
    const token = await getBearerToken();
    if (!token) {
      throw new Error("No token found");
    }
    const response = await fetch(
      API_ENDPOINTS.DETERMINE_CLINICAL_QUESTIONNAIRE_LLM,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          medicine_name: payload.medicine_name.trim(),
          identifier: payload.identifier.trim(),
          org_id: payload.org_id.trim(),
        }),
      },
    );
    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};
