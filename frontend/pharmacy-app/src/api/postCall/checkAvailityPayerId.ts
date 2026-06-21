import { API_ENDPOINTS } from "../../enums/apiUrls";
import { logError } from "../../utils/customLogger";
import { getBearerToken } from "./bearerToken";

export const checkAvailityPayerId = async (): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> => {
  try {
    const payload = {
      payer_name: "Fidelis Care Ny (533)",
      refresh_embedding: true,
    };

    const token = await getBearerToken();

    const response = await fetch(API_ENDPOINTS.CHECK_AVAILITY_PAYER_ID, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorMessage = `API call failed with status ${response.status}: ${response.statusText}`;
      logError(new Error(errorMessage), "checkAvailityPayerId");
      return {
        success: false,
        error: errorMessage,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    logError(error as Error, "checkAvailityPayerId");
    return {
      success: false,
      error: errorMessage,
    };
  }
};
