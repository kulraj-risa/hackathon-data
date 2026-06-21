import { useSelector } from "react-redux";
import { closeModal, controlToastState, Modal } from "risa-oasis-ui_v2";
import { reRunWorkflows } from "../../../api/bigQuery/nycbsPharmaOrders";
import { OrganizationType } from "../../../enums/organizationTypes";
import { ReRunModalType } from "../../../enums/reRunModalType";
import { RootState } from "../../../redux/store/store";
import WarningIcon from "../../../svg/warningIcon";

interface ReRunOncoEmrModalProps {
  onClose: () => void;
  onSave?: () => void;
  disableSave: boolean;
  id: string;
  reRunModalType: string;
}

const ReRunOncoEmrModal = (props: ReRunOncoEmrModalProps) => {
  const { data } = useSelector((state: RootState) => state.cmmProcessedOrders);
  const orderData = data?.find((item) => item?.identifier === props.id);

  const rerunWorkflow = () => {
    let payloadBasedOnType = {};
    if (orderData?.type === "Internal") {
      payloadBasedOnType = {
        type: "Internal",
        prescriber_name: orderData?.prescriberName,
        sftp_rx_bin: orderData?.sftpRxBin,
        sftp_member_id: orderData?.sftpMemberId,
      };
    } else if (orderData?.type === "External") {
      payloadBasedOnType = {
        type: "External",
        prescriber_name: orderData?.prescriberName,
      };
    }
    if (props.reRunModalType === ReRunModalType.ONCO_EMR) {
      if (orderData?.orgId === OrganizationType.NYCBS_PHARMA) {
        reRunWorkflows({
          drug_name: orderData?.drugName,
          identifier: orderData?.identifier,
          patient_mrn: orderData?.patientMrn,
          org_id: orderData?.orgId,
          is_new_request: true,
          ...payloadBasedOnType,
        });
      } else if (orderData?.orgId === OrganizationType.ASTERA) {
        reRunWorkflows({
          drug_name: orderData?.drugName,
          identifier: orderData?.identifier,
          patient_dob: orderData?.patientDob,
          patient_last_name: orderData?.patientLastName,
          external_source_identifier: orderData?.externalSourceIdentifier,
          org_id: orderData?.orgId,
          is_new_request: true,
          ...payloadBasedOnType,
        });
      }
      controlToastState("re-run-success-onco-emr");
    } else if (props.reRunModalType === ReRunModalType.CMM) {
      reRunWorkflows({
        drug_name: orderData?.drugName,
        identifier: orderData?.identifier,
        patient_dob: orderData?.patientDob,
        patient_last_name: orderData?.patientLastName,
        external_source_identifier: orderData?.externalSourceIdentifier,
        org_id: orderData?.orgId,
        is_new_request: false,
      });
      controlToastState("re-run-success-cmm");
    }
    props.onClose();
    closeModal("onco-emr-re-run-confirmation");
  };
  return (
    <Modal
      dialogId={"onco-emr-re-run-confirmation"}
      title={
        props.reRunModalType === ReRunModalType.ONCO_EMR
          ? "Rerun Onco EMR"
          : "Rerun CMM"
      }
      saveButtonText={"Rerun"}
      cancelText={"Cancel"}
      onClose={props.onClose}
      onCancel={props.onClose}
      onSave={rerunWorkflow}
      disableSave={false}
    >
      <div className="cmm-order-delete-modal--container flex flex-col items-center justify-center gap-4">
        <div className="cmm-order-delete-moal--wairning-icon">
          <WarningIcon />
        </div>
        <div className="cmm-order-delete-modal--warning-text">
          {props.reRunModalType === ReRunModalType.ONCO_EMR
            ? "Are you sure you want to re run from the Onco EMR Workflow?"
            : "Are you sure you want to re run from the CMM Workflow?"}
        </div>
        <div className="cmm-order-delete-modal--details flex w-full flex-col items-center justify-center gap-2 rounded-md bg-primaryGray-16 p-4">
          <div className="cmm-order-delete-modal--mrn text-small font-normal">
            Patient MRN :{" "}
            <span className="cmm-order-delete-modal--mrn-value text-small font-bold">
              {orderData?.patientMrn ?? "--"}
            </span>
          </div>
          <div className="cmm-order-delete-modal--drug text-small font-normal">
            Drug :{" "}
            <span className="cmm-order-delete-modal--mrn-value text-small font-bold">
              {orderData?.drugName ?? "--"}
            </span>
          </div>
          <div className="cmm-order-delete-modal--drug text-small font-normal">
            Org ID :{" "}
            <span className="cmm-order-delete-modal--mrn-value text-small font-bold">
              {orderData?.orgId ?? "--"}
            </span>
          </div>
          {props.reRunModalType === ReRunModalType.CMM && (
            <div className="cmm-order-delete-modal--mrn text-small font-normal">
              Identifier :{" "}
              <span className="cmm-order-delete-modal--mrn-value text-small font-bold">
                {orderData?.identifier ?? "--"}
              </span>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ReRunOncoEmrModal;
