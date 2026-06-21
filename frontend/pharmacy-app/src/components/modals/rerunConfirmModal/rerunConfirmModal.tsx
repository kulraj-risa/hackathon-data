import { useState } from "react";
import { Modal } from "risa-oasis-ui_v2";
import WarningIcon from "../../../svg/warningIcon";

interface RerunConfirmModalProps {
  onClose: () => void;
  onSaveClick: () => void;
  rerunType: "onco-emr" | "cmm";
  orderData?: {
    patientMrn?: string;
    drugName?: string;
    orgId?: string;
    identifier?: string;
  };
}

const RerunConfirmModal = (props: RerunConfirmModalProps) => {
  const [isRerunning, setIsRerunning] = useState(false);

  const onSaveClick = () => {
    setIsRerunning(true);
    props.onSaveClick();

    setTimeout(() => {
      props.onClose();
    }, 2000);
  };

  return (
    <Modal
      dialogId="rerun-confirm-modal"
      title={
        props.rerunType === "onco-emr" ? "Rerun Onco EMR" : "Rerun from CMM"
      }
      saveButtonText={isRerunning ? "Rerunning..." : "Yes, Rerun"}
      cancelText="Cancel"
      onSave={onSaveClick}
      onCancel={props.onClose}
      onClose={props.onClose}
      disableSave={isRerunning}
    >
      <div className="rerun-confirm-modal--container flex flex-col items-center justify-center gap-4">
        <div className="rerun-confirm-modal--icon">
          <WarningIcon />
        </div>
        <div className="rerun-confirm-modal--main-text text-primaryGray3 text-center text-h12 font-normal">
          {props.rerunType === "onco-emr"
            ? "Are you sure you want to re-run from the Onco EMR Workflow?"
            : "Are you sure you want to re-run from the CMM Workflow?"}
        </div>
        {props.orderData && (
          <div className="rerun-confirm-modal--details flex w-full flex-col items-center justify-center gap-2 rounded-md bg-primaryGray-16 p-4">
            <div className="rerun-confirm-modal--mrn text-small font-normal">
              Patient MRN:{" "}
              <span className="rerun-confirm-modal--mrn-value text-small font-bold">
                {props.orderData.patientMrn ?? "--"}
              </span>
            </div>
            <div className="rerun-confirm-modal--drug text-small font-normal">
              Drug:{" "}
              <span className="rerun-confirm-modal--drug-value text-small font-bold">
                {props.orderData.drugName ?? "--"}
              </span>
            </div>
            <div className="rerun-confirm-modal--org text-small font-normal">
              Org ID:{" "}
              <span className="rerun-confirm-modal--org-value text-small font-bold">
                {props.orderData.orgId ?? "--"}
              </span>
            </div>
            {props.rerunType === "cmm" && props.orderData.identifier && (
              <div className="rerun-confirm-modal--identifier text-small font-normal">
                Identifier:{" "}
                <span className="rerun-confirm-modal--identifier-value text-small font-bold">
                  {props.orderData.identifier}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default RerunConfirmModal;
