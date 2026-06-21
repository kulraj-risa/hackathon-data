import { API_ENDPOINTS } from "../../enums/apiUrls";
import { getBearerToken } from "./bearerToken";

interface FetchPasswordResponse {
  status: string;
  secret_id: string;
  secret_value: string;
  message: string;
}

export const fetchPortalPassword = async (
  credentialId: string,
): Promise<FetchPasswordResponse> => {
  const token = await getBearerToken();

  if (!token) {
    throw new Error("Bearer token not available");
  }

  const response = await fetch(API_ENDPOINTS.FETCH_PORTAL_PASSWORD, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      credential_id: credentialId,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Failed to fetch password: ${errorData.message || response.statusText}`,
    );
  }

  return response.json();
};
