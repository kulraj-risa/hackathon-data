import { API_ENDPOINTS } from "../../enums/apiUrls";
import { getBearerToken } from "./bearerToken";

interface OrderPayload {
  drug: string;
  patient_mrn: string;
  patient_name: string;
  dob: string;
  covermymed_id: string;
}

interface StatusTrackingPayload {
  orders: OrderPayload[];
}

export const postStatusTracking = async (payload: StatusTrackingPayload) => {
  try {
    const token = await getBearerToken();
    if (!token) {
      throw new Error("Bearer token not available");
    }

    const response = await fetch(API_ENDPOINTS.POST_STATUS_TRACKING, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  } catch (error) {
    console.error("Error making API call:", error);
    throw error;
  }
};
