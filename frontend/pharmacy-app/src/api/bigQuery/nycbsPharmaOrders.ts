import { PharmaQuestionsModel } from "../../data-model/pharmaQuestion";
import { API_ENDPOINTS } from "../../enums/apiUrls";
import { CmmEvents } from "../../enums/cmmEvents";

import { logDataToConsole, logError } from "../../utils/customLogger";
import { addCmmEvent } from "../firebase/firestoreService";
import { getBearerToken } from "../postCall/bearerToken";
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
  signal?: AbortSignal,
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
    signal,
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
  urlParams?: {
    pathParams?: Record<string, string>;
    queryParams?: Record<string, string | number | boolean>;
  },
  signal?: AbortSignal,
): Promise<any> => {
  let finalUrl = url;

  if (requestType === "GET" && urlParams) {
    if (urlParams.pathParams) {
      Object.entries(urlParams.pathParams).forEach(([key, value]) => {
        finalUrl = finalUrl.replace(`:${key}`, encodeURIComponent(value));
      });
    }

    if (urlParams.queryParams) {
      const queryString = Object.entries(urlParams.queryParams)
        .map(
          ([key, value]) =>
            `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
        )
        .join("&");

      finalUrl += finalUrl.includes("?")
        ? `&${queryString}`
        : `?${queryString}`;
    }
  }

  const requestOptions = createRequestOptions(
    body,
    headers ?? {},
    requestType,
    signal,
  );

  try {
    const response = await fetch(finalUrl, requestOptions);
    const result = await handleApiResponse(response);
    logDataToConsole(logKey, result);
    return result;
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      throw error;
    }
    logError(error as Error, `Error in ${logKey}`);
  }
};

export const fetchUnassignedCmmFormData = async (page = 1, limit = 40) => {
  const headers = await getAuthHeaders();

  return await fetchApiData(
    API_ENDPOINTS.GET_UNASSIGNED_ORDERS,
    "fetchUnassignedCmmFormData",
    undefined,
    headers,
    "GET",
    {
      queryParams: {
        page,
        limit,
        order_by: "created_at",
        direction: "DESC",
      },
    },
  );
};

export const fetchAssignedCmmFormDataWithStatus = async (
  page = 1,
  limit = 40,
) => {
  const body = {
    page,
    limit,
    order_by: [{ field: "created_at", direction: "DESC" }],
  };
  return await fetchApiData(
    API_ENDPOINTS.GET_ASSIGNED_ORDERS,
    "fetchAssignedCmmFormDataWithStatus",
    body,
  );
};

export const updateCmmInputTableData = async (
  ref_field: string,
  ref_value: string,
  data: { field: string; value: string }[],
) => {
  const body = {
    ref_field,
    ref_value,
    new_data: data,
  };
  return await fetchApiData(
    API_ENDPOINTS.UPDATE_CMM_TABLE,
    "updateCmmInputTableData",
    body,
  );
};

export const getCmmInputDataForOrder = async (id: string) => {
  const body = { identifier: id };
  const headers = await getAuthHeaders();
  return await fetchApiData(
    API_ENDPOINTS.GET_SINGLE_ORDER,
    "getCmmInputDataForOrder",
    body,
    headers,
  );
};

export const getAllQuestionsForOrder = async (id: string) => {
  const tokenHeader = await getAuthHeaders();

  const baseUrl = API_ENDPOINTS.GET_ALL_QUESTIONS_FOR_ORDER.split(
    "/questionnaire-data",
  )[0];
  const url = `${baseUrl}/questionnaire-data/:id`;
  const headers = { accept: "application/json", ...tokenHeader };

  return await fetchApiData(
    url,
    "getAllQuestionsForOrder",
    undefined,
    headers,
    "GET",
    {
      pathParams: { id },
    },
  );
};

export const getAllDocumentsForOrder = async (
  id: string,
  signal?: AbortSignal,
) => {
  const body = { identifier: id };
  const tokenHeader = await getAuthHeaders();
  const baseUrl =
    API_ENDPOINTS.GET_ALL_DOCUMENTS_FOR_ORDER.split("/documents")[0];
  const url = `${baseUrl}/documents/:id`;
  const headers = { accept: "application/json", ...tokenHeader };

  return await fetchApiData(
    url,
    "getAllDocumentsForOrder",
    body,
    headers,
    "GET",
    {
      pathParams: { id },
    },
    signal,
  );
};

export const updateQuestionaireResponse = async (
  data: PharmaQuestionsModel,
  orderId?: string,
  screenName?: string,
  email?: string,
) => {
  const body = { ...data };
  const headers = await getAuthHeaders();
  addCmmEvent(orderId ?? "", {
    event: CmmEvents.SEND_TO_PLAN_INITIATED,
    screen_name: screenName ?? "Unknown",
    created_at: new Date(),
    email: email ?? "",
  });
  return await fetchApiData(
    API_ENDPOINTS.UPDATE_QUESTIONAIRE_RESPONSE,
    "updateQuestionaireResponse",
    body,
    headers,
  );
};

export const fetchUniqueNycbsOrders = async (
  page = 1,
  limit = 40,
  filters?: any,
  org_id?: string,
) => {
  if (filters) {
    const { date_of_filing } = filters;
    if (date_of_filing) {
      const [startDate, endDate] = date_of_filing;
      filters.date_of_filing = {
        start_date: startDate,
        end_date: endDate,
      };
    }
  }
  const body = {
    page,
    limit,
    filters: filters ?? {},
    org_id: org_id ?? "",
  };

  const headers = await getAuthHeaders();
  return await fetchApiData(
    API_ENDPOINTS.GET_UNIQUE_CMM_ORDERS,
    "fetchUniqueNycbsOrders",
    body,
    headers,
  );
};

export const editCoverMyMedsRequest = async (
  body,
  orderId: string,
  screenName?: string,
  email?: string,
) => {
  const headers = await getAuthHeaders();
  addCmmEvent(orderId, {
    event: CmmEvents.EDIT_REQUEST_INITIATED,
    screen_name: screenName ?? "Unknown",
    created_at: new Date(),
    email: email ?? "",
  });
  return await fetchApiData(
    API_ENDPOINTS.EDIT_COVER_MY_MEDS_REQUEST,
    "editCoverMyMedsRequest",
    body,
    headers,
  );
};

export const searchCmmOrdersTable = async (
  page = 1,
  limit = 40,
  keyword: string,
) => {
  const body = {
    page,
    limit,
    keyword: keyword,
  };

  const headers = await getAuthHeaders();
  return await fetchApiData(
    API_ENDPOINTS.SEARCH_IN_CMM_INPUT_TABLE,
    "searchInCmmInputTable",
    body,
    headers,
  );
};

export const getPrescriptionData = async (id: string) => {
  const body = { identifier: id };
  const tokenHeader = await getAuthHeaders();
  const baseUrl =
    API_ENDPOINTS.GET_PRESCRIPTION_DATA.split("/prescription-data")[0];
  const url = `${baseUrl}/prescription-data/:id`;
  const headers = { accept: "application/json", ...tokenHeader };

  return await fetchApiData(url, "getPrescriptionData", body, headers, "GET", {
    pathParams: { id },
  });
};

export const getAllInsuranceDataForOrder = async (id: string) => {
  const body = { identifier: id };
  const tokenHeader = await getAuthHeaders();
  const baseUrl = API_ENDPOINTS.GET_ALL_INSURANCE_DATA_FOR_ORDER.split(
    "/get-insurance-details",
  )[0];
  const url = `${baseUrl}/get-insurance-details/:id`;
  const headers = { accept: "application/json", ...tokenHeader };

  return await fetchApiData(
    url,
    "getAllInsuranceDataForOrder",
    body,
    headers,
    "GET",
    {
      pathParams: { id },
    },
  );
};

export const sendtoPlanRequest = async (
  body,
  orderId: string,
  screenName?: string,
  email?: string,
) => {
  const headers = await getAuthHeaders();
  addCmmEvent(orderId, {
    event: CmmEvents.SEND_TO_PLAN_INITIATED,
    screen_name: screenName ?? "Unknown",
    created_at: new Date(),
    email: email ?? "",
  });
  return await fetchApiData(
    API_ENDPOINTS.SEND_TO_PLAN_IN_CMM,
    "sendtoPlanRequest",
    body,
    headers,
  );
};

export const getAllDiagnosisCodesForOrder = async (id: string) => {
  const body = { identifier: id };
  const tokenHeader = await getAuthHeaders();
  const baseUrl = API_ENDPOINTS.GET_ALL_DIAGNOSIS_CODES_FOR_ORDER.split(
    "/get-diagnosis-details",
  )[0];
  const url = `${baseUrl}/get-diagnosis-details/:id`;
  const headers = { accept: "application/json", ...tokenHeader };

  return await fetchApiData(
    url,
    "getAllDiagnosisCodesForOrder",
    body,
    headers,
    "GET",
    {
      pathParams: { id },
    },
  );
};

export const getPatientEligibilityDetails = async (id: string) => {
  const body = { identifier: id };
  const tokenHeader = await getAuthHeaders();
  const baseUrl = API_ENDPOINTS.GET_PATIENT_ELIGIBILITY_DETAILS.split(
    "/get-patient-eligibility-details",
  )[0];
  const url = `${baseUrl}/get-patient-eligibility-details/:id`;
  const headers = { accept: "application/json", ...tokenHeader };

  return await fetchApiData(
    url,
    "getPatientEligibilityDetails",
    body,
    headers,
    "GET",
    {
      pathParams: { id },
    },
  );
};

export const deleteCmmOrder = async (body) => {
  const headers = await getAuthHeaders();
  return await fetchApiData(
    API_ENDPOINTS.DELETE_CMM_ORDER,
    "deleteCmmOrder",
    body,
    headers,
  );
};

export const getInternalProcessedOrderStatus = async (
  page = 1,
  limit = 40,
  org_id?: string,
) => {
  const body = {
    page,
    limit,
    order_by: [{ field: "created_at", direction: "DESC" }],
    org_id: org_id ?? "",
  };
  const headers = await getAuthHeaders();
  return await fetchApiData(
    API_ENDPOINTS.GET_INTERNAL_PROCESSED_ORDER_STATUS,
    "getInternalProcessedOrderStatus",
    body,
    headers,
  );
};

export const reRunWorkflows = async (body) => {
  const headers = await getAuthHeaders();
  const updatedBody = { ...body, org_id: body.org_id ?? "" };
  return await fetchApiData(
    API_ENDPOINTS.RE_RUN_ONCO_EMR_WORKFLOW,
    "rerunOncoEmrWorkflow",
    updatedBody,
    headers,
  );
};

export const runStatusTracking = async (
  startDate: string,
  endDate: string,
  org_id?: string,
) => {
  const body = {
    filters: {
      date_of_filing: {
        start_date: startDate,
        end_date: endDate,
      },
    },
    org_id: org_id ?? "",
  };
  const headers = await getAuthHeaders();
  return await fetchApiData(
    API_ENDPOINTS.RUN_STATUS_TRACKING,
    "runStatusTracking",
    body,
    headers,
  );
};
