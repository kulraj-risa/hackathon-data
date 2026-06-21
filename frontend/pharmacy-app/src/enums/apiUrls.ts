const RPA_SERVICE_CLOUDRUN =
  process.env.REACT_APP_ENV === "production"
    ? "https://api.risalabs.ai/rpa-service/"
    : "https://api-dev.risalabs.ai/rpa-service/";

const EV_BV_SERVICE =
  process.env.REACT_APP_ENV === "production"
    ? "https://apis.risalabs.ai/backend-service/medical/"
    : "https://apis-dev.risalabs.ai/backend-service/medical/";

const PA_ORDER_CREATION_SERVICE =
  process.env.REACT_APP_ENV === "production"
    ? "https://apis.risalabs.ai/pa-order-creation/"
    : "https://apis-dev.risalabs.ai/pa-order-creation/";

const RPA_SERVICE_KUBERNATES =
  process.env.REACT_APP_ENV === "production"
    ? "https://api.risalabs.ai/rpa-service/"
    : "https://api-dev.risalabs.ai/rpa-service/";

const BACKEND_SERVICE =
  process.env.REACT_APP_ENV === "production"
    ? "https://apis.risalabs.ai/backend-service/"
    : "https://apis-dev.risalabs.ai/backend-service/";

const BASE_URL =
  process.env.REACT_APP_ENV === "production"
    ? "https://apis.risalabs.ai/"
    : "https://apis-dev.risalabs.ai/";

export const ApiBaseUrls = {
  AUTH_URL: "https://authentication.risalabs.ai/api/v1/user-auth",
  EV_BV_SERVICE: EV_BV_SERVICE,
  LOCAL_HOST: "http://127.0.0.1:8000/rpa-service/",
  RPA_SERVICE_CLOUDRUN: RPA_SERVICE_CLOUDRUN,
  RPA_SERVICE_KUBERNATES: RPA_SERVICE_KUBERNATES,
  PA_ORDER_CREATION_SERVICE: PA_ORDER_CREATION_SERVICE,
  BACKEND_SERVICE: BACKEND_SERVICE,
  BASE_URL: BASE_URL,
  PROXY_BASE_URL: "",
  DEV_SUBMI_PA_FORM:
    "https://apis.risalabs.ai/prior-auth-submission/api/v1/pa-submission/submit-pa-form",
  PROD_SUBMI_PA_FORM:
    "https://apis.risalabs.ai/prior-auth-submission/api/v1/pa-submission/submit-pa-form",
} as const;

export const API_ENDPOINTS = {
  GET_UNASSIGNED_ORDERS: `${ApiBaseUrls.RPA_SERVICE_KUBERNATES}v1/nycbs_bg_query/get-unassigned-cmm-orders`,
  GET_ASSIGNED_ORDERS: `${ApiBaseUrls.RPA_SERVICE_KUBERNATES}v1/nycbs_bg_query/get-assigned-cmm-orders-with-status`,
  UPDATE_CMM_TABLE: `${ApiBaseUrls.RPA_SERVICE_KUBERNATES}v1/nycbs_bg_query/update-cmm-table`,
  GET_SINGLE_ORDER: `${ApiBaseUrls.RPA_SERVICE_KUBERNATES}v1/nycbs_pharma/get-single-order-details`,
  GET_ALL_QUESTIONS_FOR_ORDER: `${ApiBaseUrls.RPA_SERVICE_KUBERNATES}v1/nycbs_pharma/questionnaire-data`,
  GET_ALL_DOCUMENTS_FOR_ORDER: `${ApiBaseUrls.RPA_SERVICE_KUBERNATES}v1/nycbs_pharma/documents`,
  UPDATE_QUESTIONAIRE_RESPONSE: `${ApiBaseUrls.RPA_SERVICE_CLOUDRUN}v1/nycbs_pharma/edit-cover-my-meds-questionnaire`,
  GET_UNIQUE_CMM_ORDERS: `${ApiBaseUrls.RPA_SERVICE_KUBERNATES}v1/nycbs_pharma/get-unique-cmm-orders`,
  EDIT_COVER_MY_MEDS_REQUEST: `${ApiBaseUrls.RPA_SERVICE_CLOUDRUN}v1/nycbs_pharma/edit-cover-my-meds_request`,
  SEARCH_IN_CMM_INPUT_TABLE: `${ApiBaseUrls.RPA_SERVICE_KUBERNATES}v1/nycbs_pharma/search-in-cmm-table`,
  GET_PRESCRIPTION_DATA: `${ApiBaseUrls.RPA_SERVICE_KUBERNATES}v1/nycbs_pharma/prescription-data`,
  GET_ALL_INSURANCE_DATA_FOR_ORDER: `${ApiBaseUrls.RPA_SERVICE_KUBERNATES}v1/nycbs_pharma/get-insurance-details`,
  SEND_TO_PLAN_IN_CMM: `${ApiBaseUrls.RPA_SERVICE_CLOUDRUN}v1/nycbs_pharma/send-to-plan`,
  GET_ALL_DIAGNOSIS_CODES_FOR_ORDER: `${ApiBaseUrls.RPA_SERVICE_KUBERNATES}v1/nycbs_pharma/get-diagnosis-details`,
  EV_BV_FROM_EXCEL: `${ApiBaseUrls.EV_BV_SERVICE}coverage/check-coverage-for-csv`,
  GET_EV_BV_REPORT_DETAILS: `${ApiBaseUrls.EV_BV_SERVICE}coverage/prepare-coverage-excl`,
  CHECK_CLAIMS_FOR_CSV: `${ApiBaseUrls.BACKEND_SERVICE}commons/claims/check-claims-for-csv`,
  PREPARE_CLAIMS_EXCEL: `${ApiBaseUrls.BACKEND_SERVICE}commons/claims/prepare-claims-excl`,
  CHECK_AVAILITY_PAYER_ID: `${ApiBaseUrls.BACKEND_SERVICE}commons/availity/check-availity-payer-id`,
  GET_PATIENT_ELIGIBILITY_DETAILS: `${ApiBaseUrls.RPA_SERVICE_KUBERNATES}v1/nycbs_pharma/get-patient-eligibility-details`,
  DELETE_CMM_ORDER: `${ApiBaseUrls.RPA_SERVICE_KUBERNATES}v1/nycbs_pharma/delete-entry-on-cmm`,
  GET_INTERNAL_PROCESSED_ORDER_STATUS: `${ApiBaseUrls.RPA_SERVICE_KUBERNATES}v1/nycbs_pharma/get-processed-pa-orders`,
  RE_RUN_ONCO_EMR_WORKFLOW: `${ApiBaseUrls.RPA_SERVICE_KUBERNATES}v1/nycbs_pharma/submit-pa`,
  APPEND_ROW_TO_GSHEET: `${ApiBaseUrls.BACKEND_SERVICE}commons/gsheet/append-data-to-specified-sheet`,
  AUTH_ON_FILE_CHECK: `${ApiBaseUrls.RPA_SERVICE_CLOUDRUN}v1/utility_apis/auth-on-file-check`,
  RUN_STATUS_TRACKING: `${ApiBaseUrls.RPA_SERVICE_CLOUDRUN}v1/nycbs_pharma/run_status_tracking`,
  BEARER_TOKEN_URL: `${ApiBaseUrls.AUTH_URL}/token`,
  CHECK_RATE_LIMIT_PASSWORD_RESET: `${ApiBaseUrls.AUTH_URL}/check-rate-limit-password-reset`,
  UPDATE_CIG_BOX_DATA: `${ApiBaseUrls.RPA_SERVICE_CLOUDRUN}v1/utility_apis/write_note_oncoemr`,
  MEDICAL_PA_SUBMISSION: `${ApiBaseUrls.PA_ORDER_CREATION_SERVICE}medical/submission-medical-pa/submit-medical-pa-order`,
  FETCH_PORTAL_PASSWORD: `${ApiBaseUrls.PA_ORDER_CREATION_SERVICE}commons/portal/fetch-password`,
  ADD_EDIT_PORTAL_CREDENTIAL: `${ApiBaseUrls.PA_ORDER_CREATION_SERVICE}commons/portal/add-credential`,
  REFETCH_CLINICAL_ATTACHMENT: `${ApiBaseUrls.RPA_SERVICE_KUBERNATES}v1/nycbs_pharma/refetch-clinical-attachment?identifier=Identifier`,
  PROCESS_CSV_PHARMACY_PA: `${ApiBaseUrls.PA_ORDER_CREATION_SERVICE}medical/external-worklist/process-csv`,
  GET_FINAL_WORKLIST_DATA: `${ApiBaseUrls.PA_ORDER_CREATION_SERVICE}medical/external-worklist/get-data`,
  GET_MEDICAL_PA_ANALYTICS: `${ApiBaseUrls.PA_ORDER_CREATION_SERVICE}medical/external-worklist/get-analytics`,
  FETCH_NCCN_GUIDELINES: `${ApiBaseUrls.PA_ORDER_CREATION_SERVICE}medical/utility/fetch-guidelines`,
  UPDATE_J_CODES: `${ApiBaseUrls.RPA_SERVICE_CLOUDRUN}v1/utility_apis/update-j-codes`,
  SEND_INVITE_VIA_EMAIL: `${ApiBaseUrls.AUTH_URL}/invite-user-to-dashboard`,
  DOWNLOAD_AUDIT_TRAIL: `${ApiBaseUrls.RPA_SERVICE_KUBERNATES}v1/utility_apis/download-audit-trail`,
  DETERMINE_ICD_CODE: `${ApiBaseUrls.BASE_URL}medical-necessity/v1/nycbs/determine-icd-code-llm`,
  UPLOAD_AUTH_LETTER: `${ApiBaseUrls.RPA_SERVICE_CLOUDRUN}v1/nycbs_pharma/upload_authorization_letter`,
  POST_STATUS_TRACKING: `${ApiBaseUrls.BASE_URL}ai-service/pharmacy/astera/push-orders`,
  LOG_EVENT_ENDPOINT: `${ApiBaseUrls.BACKEND_SERVICE}commons/audit-trail/log-frontend-event`,
  AUDIT_TRIAL_OVERVIEW: `${ApiBaseUrls.BACKEND_SERVICE}commons/audit-trail/get-audit-trail-overview`,
  GET_AUDIT_TRIAL_DETAILS: `${ApiBaseUrls.BACKEND_SERVICE}commons/audit-trail/get-detailed-audit-trail`,
  DETERMINE_ICD_CODE_LLM: `${ApiBaseUrls.BASE_URL}ai-service/commons/icd-code-detect/determine-icd-code-llm`,
  VIEW_ALL_AUDIT_TRAIL: `${ApiBaseUrls.BACKEND_SERVICE}commons/audit-trail/get-audit-trail`,
  ALGOLIA_SEARCH: `${ApiBaseUrls.PA_ORDER_CREATION_SERVICE}medical/utility/algolia-search`,
  PREPARE_FORM_QUESTIONNAIRE: `${ApiBaseUrls.BACKEND_SERVICE}commons/fax/prepare-form-questionnaire`,
  SUBMIT_FAX_FORM_QUESTIONNAIRE: `${ApiBaseUrls.BACKEND_SERVICE}commons/fax/submit`,
  COMMENT_RPA_MODAL_SAVE: `${ApiBaseUrls.RPA_SERVICE_KUBERNATES}v1/utility_apis/mark-as-completed`,
  DETERMINE_CLINICAL_QUESTIONNAIRE_LLM: `${ApiBaseUrls.BASE_URL}ai-service/commons/medical-necessity/get-medical-necessity-llm`,
  ALGOLIA_FACET_COUNTS: `${ApiBaseUrls.PA_ORDER_CREATION_SERVICE}medical/utility/algolia-facet-counts`,
  ALGOLIA_MULTI_FACET_COUNTS: `${ApiBaseUrls.PA_ORDER_CREATION_SERVICE}medical/utility/algolia-multi-facet-counts`,
  NAR_RPA_TRIGGER: `${ApiBaseUrls.RPA_SERVICE_KUBERNATES}v1/rpa/availity-healthfirst-checknar`,
  FETCH_AUTH_GRID: `${ApiBaseUrls.BASE_URL}ai-service/medical/auth-grid/show-auth-grid`,
  KILL_SWITCH: `${ApiBaseUrls.BASE_URL}ai-service/medical/auth-grid/kill-switch`,
  REFRESH_MEDICAL_PA_ORDERS: `${ApiBaseUrls.PA_ORDER_CREATION_SERVICE}medical/core-medical-pa/start-medical-pa`,
  GET_AUTH_GRID_SOURCE: `${ApiBaseUrls.BASE_URL}ai-service/medical/auth-grid/get-auth-grid-source`,
  SEND_FAX_FROM_CONFIG: `${ApiBaseUrls.BACKEND_SERVICE}commons/fax/send-fax-from-config`,
  GET_FAX_STATUS: `${ApiBaseUrls.BACKEND_SERVICE}commons/fax/get-fax-status`,
  GET_FORM_NAME: `${ApiBaseUrls.EV_BV_SERVICE}priority-health/get-form-name`,
  GET_PHARMA_STP_FILE_DATA: `${ApiBaseUrls.BACKEND_SERVICE}commons/bigquery/get-data-from-bigquery`,
  GET_FILENAME_SUMMARY: `${ApiBaseUrls.BACKEND_SERVICE}commons/bigquery/filename-summary`,
  UPDATE_BIGQUERY_DATA: `${ApiBaseUrls.BACKEND_SERVICE}commons/bigquery/update-data-to-bigquery`,
  PUSH_FILES_TO_SFTP: `${ApiBaseUrls.BACKEND_SERVICE}pharmacy/nycbs/push-files-to-sftp`,
  GET_FILE_FROM_NYCBS_SFTP: `${PA_ORDER_CREATION_SERVICE}pharmacy/nycbs/get-file-from-nycbs-sftp`,
};
