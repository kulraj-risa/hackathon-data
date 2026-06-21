import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Modal, SpinningLoader } from "risa-oasis-ui_v2";
import { getRapidsFileDownloadUrl } from "../../../api/firebase/rapidsFirestore";
import { RootState } from "../../../redux/store/store";
import { InfoIcon } from "../../../svg/info-icon";
import { getOrgIdForFetchExternalWorklist } from "../../../utils/organizationHelper";
import PdfRender from "../../pdfRender/pdfRender";

interface DocViewerModalProps {
  fileUrl?: string;
  onClose: () => void;
  type: "clinical_attachment" | "cmm_screenshot";
  shouldLogEvent?: boolean;
  screenName?: string;
  formName?: string;
  isExternalLoading?: boolean;
  showNoScreenshotMessage?: boolean;
}

const DocViewerModal = ({
  fileUrl,
  onClose,
  type,
  shouldLogEvent,
  screenName,
  formName,
  isExternalLoading = false,
  showNoScreenshotMessage = false,
}: DocViewerModalProps) => {
  const { metaData } = useSelector((state: RootState) => state.modalSliceNew);
  const [currentFileUrl, setCurrentFileUrl] = useState<string>(fileUrl || "");
  const [isInternalLoading, setIsInternalLoading] = useState<boolean>(false);

  const isLoading = isExternalLoading || isInternalLoading;

  const { user } = useSelector(
    (state: RootState) => state.firebaseAuthentication,
  );
  const orgID = getOrgIdForFetchExternalWorklist();

  const isEventLogged = useRef(false);

  useEffect(() => {
    const fetchFileUrl = async () => {
      if (!metaData?.filePath) return;

      const filePath = metaData.filePath;
      if (filePath.startsWith("/") || filePath.startsWith("http")) {
        setCurrentFileUrl(filePath);
        setIsInternalLoading(false);
        return;
      }

      setIsInternalLoading(true);
      try {
        const downloadUrl = await getRapidsFileDownloadUrl(filePath);
        if (downloadUrl) {
          setCurrentFileUrl(downloadUrl);
        }
      } catch (error) {
        console.error("Error fetching file URL:", error);
      } finally {
        setIsInternalLoading(false);
      }
    };

    if (metaData?.filePath) {
      fetchFileUrl();
    } else if (fileUrl) {
      setCurrentFileUrl(fileUrl);
      setIsInternalLoading(false);
    }
  }, [metaData?.filePath, fileUrl]);

  const handleDownload = () => {
    if (currentFileUrl) {
      window.open(currentFileUrl, "_blank");

      onClose();
    }
  };

  return (
    <Modal
      dialogId={"doc-viewer-modal"}
      onSave={handleDownload}
      title={
        metaData?.title
          ? metaData?.title
          : type === "clinical_attachment"
            ? "Clinical Document"
            : "Screenshot"
      }
      saveButtonText={"Download"}
      cancelText={"Cancel"}
      heightPercentage={90}
      onCancel={onClose}
      onClose={onClose}
      hideFooter={metaData?.hideFooter ?? type === "cmm_screenshot"}
    >
      <div className="doc-viewer-modal--container h-full w-full overflow-scroll">
        {isLoading ? (
          <div className="flex h-full w-full items-center justify-center gap-2">
            <SpinningLoader />
            <p className="text-gray-600">Loading document...</p>
          </div>
        ) : showNoScreenshotMessage ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3">
            <InfoIcon width="48" height="48" stroke="#6B7280" strokeWidth="1" />
            <p className="text-lg text-gray-600">
              No Screenshot found for this order
            </p>
          </div>
        ) : currentFileUrl ? (
          <PdfRender file={currentFileUrl} />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <p className="text-gray-600">No document available</p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default DocViewerModal;
