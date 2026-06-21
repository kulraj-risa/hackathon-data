import { API_ENDPOINTS } from "../../enums/apiUrls";
import { getBearerToken } from "./bearerToken";

interface PortalCredentialData {
  portal_name: string;
  org_id: string;
  portal_id?: string;
  email: string;
  username: string;
  password: string;
  is_active: boolean;
  is_queue?: boolean;
  body_regex?: string;
  subject_regex?: string;
  portal_url?: string;
  credential_id?: string;
  updated_by?: string | null;
}

interface AddEditCredentialResponse {
  status: string;
  credential_id: string;
  message: string;
}

export const addEditPortalCredential = async (
  credentialData: PortalCredentialData,
): Promise<AddEditCredentialResponse> => {
  const token = await getBearerToken();

  if (!token) {
    throw new Error("Bearer token not available");
  }

  const response = await fetch(API_ENDPOINTS.ADD_EDIT_PORTAL_CREDENTIAL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(credentialData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Failed to save credential: ${errorData.message || response.statusText}`,
    );
  }

  return response.json();
};
