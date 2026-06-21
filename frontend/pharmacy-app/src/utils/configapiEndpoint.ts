export const API_ENDPOINTS = {
  PROVIDER_LIST: {
    DOWNLOAD: {
      BASE_URL:
        "https://cloudrun-rpa-service-939421517637.us-east1.run.app/rpa-service/v1/utility_apis/provider-file/download",
      PARAMS: {
        PROJECT: "rapids-platform",
        BUCKET: "rapids-platform.firebasestorage.app",
        BLOB: "onco_emr/Provider_List.xlsx",
      },
    },
    UPLOAD: {
      BASE_URL:
        "https://cloudrun-rpa-service-939421517637.us-east1.run.app/rpa-service/v1/utility_apis/provider-file/upload",
      PARAMS: {
        PROJECT: "rapids-platform",
        BUCKET: "rapids-platform.firebasestorage.app",
        BLOB: "onco_emr/Provider_List.xlsx",
      },
    },
  },
} as const;

export const getProviderListDownloadUrl = () => {
  const { BASE_URL, PARAMS } = API_ENDPOINTS.PROVIDER_LIST.DOWNLOAD;
  return `${BASE_URL}?project=${PARAMS.PROJECT}&bucket=${PARAMS.BUCKET}&blob=${encodeURIComponent(PARAMS.BLOB)}`;
};

export const getProviderListUploadConfig = () => {
  const { BASE_URL, PARAMS } = API_ENDPOINTS.PROVIDER_LIST.UPLOAD;
  return {
    url: BASE_URL,
    project: PARAMS.PROJECT,
    bucket: PARAMS.BUCKET,
    blob: PARAMS.BLOB,
  };
};
