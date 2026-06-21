import { useEffect, useState } from "react";
import { Button, controlToastState } from "risa-oasis-ui_v2";
import { getFileDownloadUrl } from "../../../../../../api/firebase/firestoreService";
import { checkAvailityPayerId } from "../../../../../../api/postCall/checkAvailityPayerId";
import DragDropUpload from "../../../../../../components/dragDropUpload/dragDropUpload";

const FILE_PATH = "payer-utils/availity_payer_list_2.xlsx";

const PayerConfiguration = () => {
  const [downloading, setDownloading] = useState(false);
  const [apiCallInProgress, setApiCallInProgress] = useState(false);
  const [downloadedURL, setDownloadedURL] = useState<string>("");

  useEffect(() => {
    console.log("downloadedURL", downloadedURL);
    if (downloadedURL && downloadedURL !== "") {
      handleUploadSuccess();
    }
  }, [downloadedURL]);

  const handleUploadSuccess = async () => {
    setApiCallInProgress(true);
    try {
      const result = await checkAvailityPayerId();
      if (result.success) {
        controlToastState(`payer-id-check-success`);
      } else {
        console.error("Availity payer ID check failed:", result.error);
        controlToastState(`payer-id-check-failed`);
      }
    } catch (error) {
      console.error("Error during availity payer ID check:", error);
    } finally {
      setApiCallInProgress(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const url = await getFileDownloadUrl(FILE_PATH);
      if (url) {
        const link = document.createElement("a");
        link.href = url;
        link.download = "availity_payer_list_2.xlsx";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert("File not found or download URL could not be retrieved.");
      }
    } catch (err) {
      alert("Error downloading file.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <div className="payer-config-header self-start border-b border-primaryGray-16 py-2 text-h11 font-semibold">
        Payer Configuration
      </div>
      <div className="flex flex-col items-center gap-4 p-4">
        <DragDropUpload
          id="payer-excel-upload"
          subText="Drag and drop or click to upload a new Excel file (.xlsx) for the payer list. Only one file allowed."
          multipleFilesAllowed={false}
          allowedFileTypes={[".xlsx"]}
          maxFileSize={10 * 1024 * 1024}
          filePath={FILE_PATH}
          downloadedURL={(url) => setDownloadedURL(url[0])}
        />
        <div className="flex w-full items-center justify-end gap-4">
          <Button
            buttonType="secondary"
            size="medium"
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? "Downloading..." : "Download Availity Payer List"}
          </Button>
        </div>
      </div>
    </>
  );
};

export default PayerConfiguration;
