import {
  FinalWorklistApiResponse,
  FinalWorklistPayload,
} from "../../data-model/finalWorklistModel";
import { API_ENDPOINTS } from "../../enums/apiUrls";
import { logDataToConsole, logError } from "../../utils/customLogger";
import { getBearerToken } from "../postCall/bearerToken";

interface FinalWorklistResponse {
  data?: any;
}

export const getFinalWorklistData = async (
  payload: FinalWorklistPayload,
): Promise<FinalWorklistApiResponse<any>> => {
  try {
    const token = await getBearerToken();

    if (!token) {
      throw new Error("Bearer token not available");
    }

    logDataToConsole("Final worklist payload", payload);

    const response = await fetch(API_ENDPOINTS.GET_FINAL_WORKLIST_DATA, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Final worklist data fetch failed with status ${response.status}: ${errorData.message || response.statusText}`,
      );
    }
    const result = await response.json();
    logDataToConsole("Final worklist data fetch successful", result);
    return result;
  } catch (error) {
    logError(error as Error, "Error in getFinalWorklistData");
    throw error;
  }
};
