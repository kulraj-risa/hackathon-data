import { useEffect, useState } from "react";
import { Modal, openModal } from "risa-oasis-ui_v2";
import WarningIcon from "../../../svg/warningIcon";

interface SendToPlanConfirmModalProps {
  onClose: () => void;
  onSaveClick: () => void;
  modalType?: "send_to_plan" | "retry_qa" | "fetch_qa";
}

const SendToPlanConfirmModal = (props: SendToPlanConfirmModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { modalType = "send_to_plan" } = props;

  // Open modal when component mounts
  useEffect(() => {
    openModal("send-to-plan-confirm-modal");
  }, []);
  const onSaveClick = () => {
    setIsSubmitting(true);
    props.onSaveClick();

    setTimeout(() => {
      props.onClose();
    }, 2000);
  };

  const getModalConfig = () => {
    switch (modalType) {
      case "fetch_qa":
        return {
          title: "Fetch QA Confirmation",
          saveButtonText: isSubmitting ? "Fetching..." : "Yes, Fetch QA",
          message: (
            <>
              This will fetch the QA results for the selected order. <br /> Are
              you sure you want to proceed?
            </>
          ),
        };
      case "retry_qa":
        return {
          title: "Retry QA Confirmation",
          saveButtonText: isSubmitting ? "Retrying..." : "Yes, Retry",
          message: (
            <>
              This will trigger a QA retry for the selected order. <br /> Are
              you sure you want to proceed?
            </>
          ),
        };
      case "send_to_plan":
      default:
        return {
          title: "Submission Confirmation",
          saveButtonText: isSubmitting ? "Submitting..." : "Yes, Submit",
          message: (
            <>
              The details in the form <strong>can't be edited</strong> after
              submitting the form. <br /> Are you sure you want to submit?
            </>
          ),
        };
    }
  };

  const config = getModalConfig();
  return (
    <Modal
      dialogId="send-to-plan-confirm-modal"
      title={config.title}
      saveButtonText={config.saveButtonText}
      cancelText="Cancel"
      onSave={onSaveClick}
      onCancel={props.onClose}
      onClose={props.onClose}
      disableSave={isSubmitting}
    >
      <div className="send-to-plan-modal--container flex flex-col items-center justify-center gap-3">
        <div className="send-to-plan-modal--icon">
          <WarningIcon />
        </div>
        <div className="send-to-plan--main-text text-primaryGray3 text-center text-h12 font-normal">
          {config.message}
        </div>
      </div>
    </Modal>
  );
};

export default SendToPlanConfirmModal;
