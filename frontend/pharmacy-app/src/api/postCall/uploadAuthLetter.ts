import { API_ENDPOINTS } from "../../enums/apiUrls";
import { logError } from "../../utils/customLogger";
import { getBearerToken } from "./bearerToken";

export interface UploadDocument {
  document_type?: string;
  document_name: string;
  document_path: string;
}

export interface UploadAuthLetterPayload {
  identifier: string;
  patient_mrn: string;
  documents: UploadDocument[];
  org_id: string;
  portal_id?: string;
  emr_name?: string;
}

export const uploadAuthLetter = async (
  payload: UploadAuthLetterPayload,
): Promise<any> => {
  try {
    const token = await getBearerToken();

    if (!token) {
      throw new Error("No token found");
    }
    const response = await fetch(API_ENDPOINTS.UPLOAD_AUTH_LETTER, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (response.status >= 400) {
      throw new Error("Failed to upload auth letter");
    } else {
      const result = await response.json();
      return {
        success: true,
        message: "Auth letter uploaded successfully",
      };
    }
  } catch (error) {
    logError(error as Error, "Error in uploadAuthLetter");
    throw error;
  }
};
