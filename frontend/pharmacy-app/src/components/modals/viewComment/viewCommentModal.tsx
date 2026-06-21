import { controlToastState, Modal, SpinningLoader } from "risa-oasis-ui_v2";

import { useSelector } from "react-redux";
import {
  uploadAuthLetter,
  UploadAuthLetterPayload,
} from "../../../api/postCall/uploadAuthLetter";
import { RootState } from "../../../redux/store/store";
import DownloadIcon from "../../../svg/download-icon";
import { logDataToConsole } from "../../../utils/customLogger";
import { getOrgIdForFetchExternalWorklist } from "../../../utils/organizationHelper";
import PdfRender from "../../pdfRender/pdfRender";
interface ViewCommentModalProps {
  comment?: string;
  onClose?: () => void;
  isLoading?: boolean;
  status?: string;
  pdfUrl?: string;
  isPdfLoading?: boolean;
}

const ViewCommentModal = (props: ViewCommentModalProps) => {
  const modalTitle =
    props?.status?.toLowerCase() === "denied"
      ? "Denial Letter"
      : "More Information";
  const handleDownload = () => {
    window.open(props.pdfUrl, "_blank");
    props?.onClose?.();
  };

  const singleOrderDocs = useSelector(
    (state: RootState) => state.nycbsDocuments,
  );

  const handleUploadAuthLetter = async () => {
    const org_id = getOrgIdForFetchExternalWorklist();
    let selectedDocument: any = null;
    let documentType = "";
    if (singleOrderDocs?.data && Array.isArray(singleOrderDocs?.data)) {
      selectedDocument = singleOrderDocs?.data?.find(
        (doc: any) => doc?.document_name === "clinical_approval_letter",
      );
      if (selectedDocument) {
        documentType = "Pharmacy Approval Letter";
      } else {
        selectedDocument = singleOrderDocs?.data?.find(
          (doc: any) => doc?.document_name === "clinical_denial_letter",
        );
        if (selectedDocument) {
          documentType = "Pharmacy Denial Letter";
        }
      }
    }
    const payload: UploadAuthLetterPayload = {
      identifier: selectedDocument?.identifier || "",
      documents: [
        {
          document_name: documentType,
          document_path: selectedDocument?.file_path || "",
        },
      ],
      patient_mrn: selectedDocument?.patient_mrn || "",
      org_id: org_id,
      portal_id: "cmm",
      emr_name: "oncoemr",
    };

    try {
      const response = await uploadAuthLetter(payload);
      if (response?.success) {
        controlToastState(`upload-success`);
      } else {
        controlToastState(`upload-error`);
      }
      props?.onClose?.();
    } catch (error) {
      logDataToConsole("error in uploadAuthLetter", error);
      controlToastState(`upload-error`);
    }
  };

  const isDenied = props?.status?.toLowerCase() === "denied";

  const loadCheck =
    props?.status?.toLowerCase() === "denied" ||
    props?.status?.toLowerCase() === "verified";

  return (
    <Modal
      dialogId={"view-comment-modal"}
      onSave={() => {}}
      onClose={props?.onClose}
      title={modalTitle}
      saveButtonText={""}
      cancelText={""}
      hideFooter={true}
      heightPercentage={props?.pdfUrl ? 80 : undefined}
    >
      <div className="view-comment-modal mb-2 flex justify-end">
        {props?.pdfUrl && (
          <div className="flex flex-row items-center justify-end">
            <div
              className="m-2 flex cursor-pointer items-center gap-1 text-xs font-semibold text-tertiaryBlue-4"
              onClick={handleUploadAuthLetter}
            >
              Upload Auth Letter
            </div>
            <div
              className="m-2 flex cursor-pointer items-center gap-1 text-xs font-semibold text-tertiaryBlue-4"
              onClick={handleDownload}
            >
              <DownloadIcon />
              <span>Download PDF</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex h-auto flex-col">
        <div
          className={`mb-4 flex flex-col overflow-auto rounded-md p-3 ${isDenied ? "bg-red-50" : "border border-primaryGray-15 bg-white"}`}
        >
          {props?.isLoading && (
            <div className="flex h-full w-full items-center justify-center gap-2">
              <SpinningLoader />
              Fetching Comment...
            </div>
          )}

          {!props?.isLoading && (
            <div className="overflow-y-auto">
              <div className={`mb-1 text-sm font-semibold`}>
                {`${isDenied ? "Denial Reason" : "Comment"}`}
              </div>
              <div className="h-auto text-xs font-normal">{props?.comment}</div>
            </div>
          )}
        </div>
        {loadCheck && (
          <div className="relative mb-3 overflow-hidden rounded-md border border-primaryGray-15">
            {props.isPdfLoading && (
              <div className="flex h-full w-full items-center justify-center gap-2">
                <SpinningLoader />
                Loading PDF...
              </div>
            )}
            {!props.isPdfLoading &&
              (props.pdfUrl ? (
                <PdfRender file={props.pdfUrl} />
              ) : (
                <div className="flex h-full w-full items-center justify-center gap-2">
                  <span>No Valid Document Available</span>
                </div>
              ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ViewCommentModal;
