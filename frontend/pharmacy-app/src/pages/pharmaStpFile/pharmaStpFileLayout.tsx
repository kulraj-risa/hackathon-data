import { useDispatch, useSelector } from "react-redux";
import { Outlet } from "react-router-dom";
import CmmStatusCheckModal from "../../components/modals/cmmStatusCheckModal/cmmStatusCheckModal";
import DocViewerModal from "../../components/modals/docViewerModal/docViewerModalNew";
import PushToSftpModal from "../../components/modals/pushToSftpModal/pushToSftpModal";
import SftpStatus from "../../components/modals/SftpStatus/SftpStatus";
import SubmissionSummary from "../../components/modals/submissionSummary/submissionSummary";
import { useTablesContext } from "../../context/tablesContextProvider";
import { ModalId } from "../../enums/modalId";
import { TableNames } from "../../enums/tableNames";
import { useModalOpener } from "../../hooks/useModalOpener";
import { closeModal } from "../../redux/slice/modalSliceNew";
import { AppDispatch, RootState } from "../../redux/store/store";

const PharmaStpFileLayout = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { metaData } = useSelector((state: RootState) => state.modalSliceNew);
  const { openedModalId } = useModalOpener();
  const { setTableDataForContext } = useTablesContext();

  const handleCloseModal = () => {
    dispatch(closeModal());
  };

  const handleSave = () => {
    dispatch(closeModal());
  };

  const handleSubmissionSuccess = () => {
    // Trigger refetch by setting shouldRefetch flag
    setTableDataForContext(TableNames.PHARMA_STP_FILE_ORDERS, {
      shouldRefetch: true,
    });
  };

  return (
    <div className="pharma-stp-file__container flex h-full w-full overflow-hidden">
      <div className="pharma-stp-file__outlet w-full flex-1">
        <Outlet />
      </div>
      {openedModalId === ModalId.PUSH_TO_SFTP_MODAL && <PushToSftpModal />}
      {openedModalId === ModalId.SFTP_STATUS_MODAL && <SftpStatus />}
      {openedModalId === ModalId.CMM_STATUS_CHECK_MODAL && (
        <CmmStatusCheckModal />
      )}
      {openedModalId === ModalId.DOC_VIEWER_MODAL && (
        <DocViewerModal onClose={handleCloseModal} type="clinical_attachment" />
      )}
      {openedModalId === ModalId.SUBMISSION_SUMMARY_MODAL &&
        metaData &&
        "data" in metaData && (
          <SubmissionSummary
            onClose={handleCloseModal}
            metaData={metaData as { data: any }}
            onSuccess={handleSubmissionSuccess}
          />
        )}
    </div>
  );
};

export default PharmaStpFileLayout;
