import { useState } from "react";
import { controlToastState, Toast } from "risa-oasis-ui_v2";
import { getFileDownloadUrl } from "../../../../../../api/firebase/firestoreService";
import DragDropUpload from "../../../../../../components/dragDropUpload/dragDropUpload";
import DownloadIcon from "../../../../../../svg/download-icon";
import { getOrgIdForFetchExternalWorklist } from "../../../../../../utils/organizationHelper";

const ProviderList = () => {
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const orgId = getOrgIdForFetchExternalWorklist();

  const handleDownload = async () => {
    try {
      const filePath = `payer-utils/${orgId}/Provider_List.xlsx`;
      const downloadUrl = await getFileDownloadUrl(filePath);

      if (!downloadUrl) {
        throw new Error("Download URL not found");
      }

      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error("Download failed");
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "Provider_List.xlsx";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error downloading file:", error);
      controlToastState("provider-list-download-error");
    }
  };

  const handleFileUpload = (urls: string[]) => {
    if (urls.length > 0) {
      setUploadedFileName("Provider_List.xlsx");
      controlToastState("provider-list-upload-success");
    }
  };

  return (
    <div className="pharma-pa-configuration__provider-list h-full w-full bg-primaryGray-16 p-4">
      <div className="pharma-pa-configuration__provider-list-inner-container flex h-full flex-col gap-6 overflow-hidden rounded-lg bg-white p-6">
        {/* Header Section */}
        <div className="pharma-pa-configuration__provider-list-header border-b border-primaryGray-16 pb-4">
          <h1 className="text-h11 font-bold text-primaryGray-1">
            Provider List
          </h1>
        </div>

        {/* Main Content Section */}
        <div className="pharma-pa-configuration__provider-list-content flex flex-1 flex-col gap-6">
          {/* Download Section */}
          <div className="provider-list__download-section flex flex-col gap-3">
            <div className="text-h12 font-semibold text-primaryGray-1">
              Download Provider List
            </div>
            <div className="flex items-center gap-3">
              <div
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-primaryGray-16 bg-white px-4 py-2 hover:bg-primaryGray-16"
                onClick={handleDownload}
              >
                <DownloadIcon />
                <span className="text-small font-medium text-primaryGray-1">
                  Download Excel
                </span>
              </div>
              <div className="text-small text-primaryGray-4">
                Download the current provider list in Excel format
              </div>
            </div>
          </div>

          {/* Upload Section */}
          <div className="provider-list__upload-section flex flex-col gap-3">
            <div className="text-h12 font-semibold text-primaryGray-1">
              Upload Provider List
            </div>
            <div className="flex flex-col gap-3">
              <DragDropUpload
                id="provider-list-upload"
                subText="Supported file format .xlsx not exceeding 10MB"
                multipleFilesAllowed={false}
                maxFileSize={10 * 1024 * 1024}
                downloadedURL={handleFileUpload}
                allowedFileTypes={[".xlsx"]}
                filePath={`payer-utils/${orgId}/Provider_List.xlsx`}
              />
              {uploadedFileName && (
                <div className="text-small text-primaryGray-4">
                  Last uploaded: {uploadedFileName}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Toast
        type="success"
        header="Provider list uploaded successfully!"
        id="provider-list-upload-success"
      />
      <Toast
        type="error"
        header="Error downloading provider list"
        id="provider-list-download-error"
      />
    </div>
  );
};

export default ProviderList;
