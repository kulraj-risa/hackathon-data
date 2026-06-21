import { API_ENDPOINTS } from "../../enums/apiUrls";
import { getBearerToken } from "./bearerToken";

interface UpdateBigQueryPayload {
  filters: {
    identifier: string;
  };
  update_data: {
    covermymed_id: string;
    response_status: string;
    poc: string;
    second_stp_status: string;
    qa_filled_by: string;
  };
}

export const updateBigQueryData = async (payload: UpdateBigQueryPayload) => {
  try {
    const token = await getBearerToken();
    if (!token) {
      throw new Error("Bearer token not available");
    }

    const response = await fetch(API_ENDPOINTS.UPDATE_BIGQUERY_DATA, {
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

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error updating BigQuery data:", error);
    throw error;
  }
};
