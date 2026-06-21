import { v4 as uuidv4 } from "uuid";
import { API_ENDPOINTS } from "../../enums/apiUrls";
import { logDataToConsole, logError } from "../../utils/customLogger";
import { getBearerToken } from "../postCall/bearerToken";

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const token = await getBearerToken();
  return {
    Authorization: `Bearer ${token}`,
  };
};

const createRequestOptions = (header?: Record<string, string>): RequestInit => {
  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  if (header) {
    for (const key in header) {
      headers.append(key, header[key]);
    }
  }

  const options: RequestInit = {
    method: "POST",
    headers,
    redirect: "follow",
  };

  return options;
};

const handleApiResponse = async (response: Response): Promise<any> => {
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  return await response.json();
};

export interface FilenameSummaryItem {
  filename: string;
  unique_patient_mrn_count: number;
  dumped_at: string;
}

export interface FilenameSummaryApiResponse {
  success: boolean;
  message: string;
  items: FilenameSummaryItem[];
  page: number;
  page_size: number;
  total_pages: number;
  total_count: number;
}

export interface FetchFilenameSummaryParams {
  page?: number;
  page_size?: number;
}

export const fetchFilenameSummary = async (
  params?: FetchFilenameSummaryParams,
): Promise<FilenameSummaryApiResponse> => {
  const body = {
    page: params?.page,
    page_size: params?.page_size,
    request_id: uuidv4(),
  };
  const headers = await getAuthHeaders();
  const requestOptions = createRequestOptions(headers);
  requestOptions.body = JSON.stringify(body);

  try {
    const response = await fetch(
      API_ENDPOINTS.GET_FILENAME_SUMMARY,
      requestOptions,
    );
    const result = await handleApiResponse(response);
    logDataToConsole("fetchFilenameSummary", result);
    return result;
  } catch (error) {
    logError(error as Error, "Error in fetchFilenameSummary");
    throw error;
  }
};
