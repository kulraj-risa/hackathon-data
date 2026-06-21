import { v4 as uuidv4 } from "uuid";
import { API_ENDPOINTS } from "../../enums/apiUrls";
import { logDataToConsole, logError } from "../../utils/customLogger";
import { getBearerToken } from "../postCall/bearerToken";
import { FilingQueueCase, getFilingQueue } from "../denialEngine";

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const token = await getBearerToken();
  return {
    Authorization: `Bearer ${token}`,
  };
};

const createRequestOptions = (
  body?: Record<string, unknown>,
  header?: Record<string, string>,
  requestType: "POST" | "GET" = "POST",
): RequestInit => {
  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  if (header) {
    for (const key in header) {
      headers.append(key, header[key]);
    }
  }

  const options: RequestInit = {
    method: requestType,
    headers,
    redirect: "follow",
  };

  if (requestType === "POST" && body) {
    options.body = JSON.stringify(body);
  }

  return options;
};

const handleApiResponse = async (response: Response): Promise<any> => {
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  return await response.json();
};

const fetchApiData = async (
  url: string,
  logKey: string,
  body?: Record<string, unknown>,
  headers?: Record<string, string>,
  requestType: "POST" | "GET" = "POST",
): Promise<any> => {
  const requestOptions = createRequestOptions(body, headers ?? {}, requestType);

  try {
    const response = await fetch(url, requestOptions);
    const result = await handleApiResponse(response);
    logDataToConsole(logKey, result);
    return result;
  } catch (error) {
    logError(error as Error, `Error in ${logKey}`);
    throw error;
  }
};

export interface FetchPharmaStpFileDataParams {
  date_from_filename_start?: string;
  date_from_filename_end?: string;
  filters?: {
    patient_mrn?: string[] | string;
    [key: string]: any;
  };
  page?: number;
  page_size?: number;
  request_id?: string;
}

export interface PharmaStpFileApiResponse {
  success: boolean;
  message: string;
  rows: PharmaStpFileApiRow[];
  row_count: number;
  page: number;
  page_size: number;
  total_pages: number;
  total_count: number;
}

export interface PharmaStpFileApiRow {
  identifier: string;
  seq: string;
  poc: string;
  pharmacy_type: string;
  patient_mrn: string;
  patient_name: string;
  dob: string;
  insuranceid: string;
  provider_name: string;
  drug: string;
  pharmacy: string;
  bin: string;
  pharmacy_phone: string | null;
  rx_due_date: string;
  covermymed_id: string | null;
  response_status: string | null;
  second_stp_status: string | null;
  sftp_status: string | null;
  filename: string;
  org_id: string;
  dumped_at: string;
}

const PHARMA_FALLBACK_ORG = "L0ju12UjNQ7e2y7zYZm1";

// Map a Denial-Engine filing-queue case to the grid's row shape so the PA Orders
// table can populate from real (de-identified) engine data when BigQuery is
// unavailable (no GCP token / offline / missing creds).
const engineCaseToRow = (c: FilingQueueCase, i: number): PharmaStpFileApiRow => ({
  identifier: c.cmm_id || c.member_id || `ENG-${i + 1}`,
  seq: String(i + 1),
  poc: "",
  pharmacy_type: c.medication_class || "Brand",
  patient_mrn: c.member_id || "",
  patient_name: c.patient || "Filed case",
  dob: c.dob || "",
  insuranceid: c.payer_name || "",
  provider_name: "",
  drug: c.medication || c.drug || "",
  pharmacy: c.payer_name || "",
  bin: "",
  pharmacy_phone: null,
  rx_due_date: "",
  covermymed_id: c.cmm_id || null,
  response_status: null,
  second_stp_status: null,
  sftp_status: null,
  filename: "",
  org_id: PHARMA_FALLBACK_ORG,
  dumped_at: new Date().toISOString(),
});

const buildEngineFallback = async (): Promise<PharmaStpFileApiResponse> => {
  const queue = await getFilingQueue();
  const rows = queue.map(engineCaseToRow);
  return {
    success: true,
    message: "Loaded from RISA Denial Engine (BigQuery unavailable)",
    rows,
    row_count: rows.length,
    page: 1,
    page_size: rows.length,
    total_pages: 1,
    total_count: rows.length,
  };
};

export const fetchPharmaStpFileData = async (
  params: FetchPharmaStpFileDataParams,
): Promise<PharmaStpFileApiResponse> => {
  const body = {
    filters: { ...params.filters, org_id: ["L0ju12UjNQ7e2y7zYZm1"] },
    page: params.page ?? 1,
    page_size: params.page_size ?? 100,
    request_id: uuidv4(),
    dataset: "pharmacy_pa_requests",
    table_name: "pa_request_entries",
    table_id: "pa_request_entries",
    project_id: "rapids-platform",
    org_id: "L0ju12UjNQ7e2y7zYZm1",
    query:
      "SELECT * FROM rapids-platform.pharmacy_pa_requests.pa_request_entries WHERE org_id = 'L0ju12UjNQ7e2y7zYZm1'",
  };

  try {
    const headers = await getAuthHeaders();
    const res: PharmaStpFileApiResponse = await fetchApiData(
      API_ENDPOINTS.GET_PHARMA_STP_FILE_DATA,
      "fetchPharmaStpFileData",
      body,
      headers,
      "POST",
    );
    if (res && res.success && Array.isArray(res.rows) && res.rows.length > 0) {
      return res;
    }
    // BigQuery returned nothing (or failed silently) -> use the engine queue so
    // the demo always shows a populated worklist.
    return await buildEngineFallback();
  } catch (error) {
    logError(error as Error, "fetchPharmaStpFileData -> engine fallback");
    try {
      return await buildEngineFallback();
    } catch (fallbackError) {
      logError(fallbackError as Error, "engine fallback also failed");
      throw error;
    }
  }
};
