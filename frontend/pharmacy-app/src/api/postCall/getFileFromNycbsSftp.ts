import { API_ENDPOINTS } from "../../enums/apiUrls";
import { getBearerToken } from "./bearerToken";

interface GetFileFromNycbsSftpPayload {
  remote_dir: string;
  file_pattern: string;
}

export interface GetFileFromNycbsSftpResponse {
  success: boolean;
  message: string;
  [key: string]: any;
}

const getRemoteDir = (): string => {
  return process.env.REACT_APP_ENV === "production"
    ? "/to_nycbs"
    : "/risa_internal";
};

export const getFileFromNycbsSftp = async (
  filePattern: string,
): Promise<GetFileFromNycbsSftpResponse> => {
  const payload: GetFileFromNycbsSftpPayload = {
    remote_dir: getRemoteDir(),
    file_pattern: filePattern,
  };

  try {
    const token = await getBearerToken();
    if (!token) {
      throw new Error("Bearer token not available");
    }

    const response = await fetch(API_ENDPOINTS.GET_FILE_FROM_NYCBS_SFTP, {
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

    // Check content type to determine how to parse the response
    const contentType = response.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      // If JSON, parse as JSON
      const data = await response.json();
      return data;
    } else {
      // If text/csv or other, return as text content
      const textContent = await response.text();
      return {
        success: true,
        message: "File retrieved successfully",
        file_content: textContent,
      };
    }
  } catch (error) {
    console.error("Error getting file from NYCBS SFTP:", error);
    throw error;
  }
};
