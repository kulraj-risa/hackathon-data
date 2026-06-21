import { useEffect } from "react";
import { useSelector } from "react-redux";
import { openModal } from "risa-oasis-ui_v2";
import { ModalId } from "../enums/modalId";
import { RootState } from "../redux/store/store";

interface ModalOpenerConfig {
  openDeleteModal?: boolean;
  openSendToPlanModal?: boolean;
  openRerunModal?: boolean;
  openReportPrescriptionModal?: boolean;
  openReportMedicationModal?: boolean;
}

export const useModalOpener = (config?: ModalOpenerConfig) => {
  const { openedModalId } = useSelector(
    (state: RootState) => state.modalSliceNew,
  );
  useEffect(() => {
    if (openedModalId === ModalId.IMAGE_VIEWER_MODAL) {
      openModal(ModalId.IMAGE_VIEWER_MODAL);
    }
    if (openedModalId === ModalId.PUSH_TO_SFTP_MODAL) {
      openModal(ModalId.PUSH_TO_SFTP_MODAL);
    }
    if (openedModalId === ModalId.SFTP_STATUS_MODAL) {
      openModal(ModalId.SFTP_STATUS_MODAL);
    }
    if (openedModalId === ModalId.SUBMISSION_SUMMARY_MODAL) {
      openModal(ModalId.SUBMISSION_SUMMARY_MODAL);
    }
    if (openedModalId === ModalId.CMM_INPUT_VIEWER_MODAL) {
      openModal(ModalId.CMM_INPUT_VIEWER_MODAL);
    }
    if (openedModalId === ModalId.DOC_VIEWER_MODAL) {
      openModal(ModalId.DOC_VIEWER_MODAL);
    }

    if (config) {
      if (config.openDeleteModal) {
        openModal("order-delete-confirmation");
      }
      if (config.openSendToPlanModal) {
        openModal("send-to-plan-confirm-modal");
      }
      if (config.openRerunModal) {
        openModal("rerun-confirm-modal");
      }
      if (config.openReportPrescriptionModal) {
        openModal(ModalId.REPORT_PRESCRIPTION_MODAL);
      }
      if (config.openReportMedicationModal) {
        openModal(ModalId.REPORT_MEDICATION_INACCURACY_MODAL);
      }
    }
  }, [
    openedModalId,
    config?.openDeleteModal,
    config?.openSendToPlanModal,
    config?.openRerunModal,
    config?.openReportPrescriptionModal,
    config?.openReportMedicationModal,
  ]);
  return { openedModalId };
};
