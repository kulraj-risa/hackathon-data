import { v4 as uuidv4 } from "uuid";
import { API_ENDPOINTS } from "../../enums/apiUrls";
import { getBearerToken } from "./bearerToken";

interface PushToSftpPayload {
  file_names: string[];
  remote_dir: string;
  request_id: string;
}

const getRemoteDir = (): string => {
  return process.env.REACT_APP_ENV === "production"
    ? "to_nycbs"
    : "risa_internal";
};

export interface SftpFileResult {
  status: string;
  message: string;
  filename: string;
  remote_path: string | null;
  file_size: number | null;
}

export interface PushToSftpResponse {
  success: boolean;
  message: string;
  files_validated?: number;
  files_with_missing_cmm_id?: string[];
  total_rows_checked?: number;
  rows_missing_cmm_id?: number;
  sftp_push_result?: {
    [originalFileName: string]: SftpFileResult;
  } | null;
  trace_id?: string;
}

export const pushFilesToSftp = async (
  fileNames: string[],
): Promise<PushToSftpResponse> => {
  const payload: PushToSftpPayload = {
    file_names: fileNames,
    remote_dir: getRemoteDir(),
    request_id: uuidv4(),
  };
  try {
    const token = await getBearerToken();
    if (!token) {
      throw new Error("Bearer token not available");
    }

    const response = await fetch(API_ENDPOINTS.PUSH_FILES_TO_SFTP, {
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
    console.error("Error pushing files to SFTP:", error);
    throw error;
  }
};
