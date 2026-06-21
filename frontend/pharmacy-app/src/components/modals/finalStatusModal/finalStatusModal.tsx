import { useState } from "react";
import {
  closeModal,
  controlToastState,
  Modal,
  Select,
  Toast,
} from "risa-oasis-ui_v2";
import { FirestoreService } from "../../../api/firebase/firestoreService";
import { FirestoreCollectionReference } from "../../../api/firebase/references";
import { FinalWorklistStatus } from "../../../enums/finalWorklistStatus";
import { logError } from "../../../utils/customLogger";

interface FinalStatusModalProps {
  id: string;
  onComplete?: () => void;
}
const FinalStatusModal = (props: FinalStatusModalProps) => {
  const [finalStatus, setFinalStatus] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const onSelctedOptionChange = (data) => {
    setFinalStatus(data.value);
  };

  const finalStatusLabels = {
    [FinalWorklistStatus.AUTHORIZED_WITH_AUTH_ON_FILE]:
      "Authorized with Auth on File",
    [FinalWorklistStatus.AUTHORIZED_WITH_NO_AUTH_REQUIRED]:
      "Authorized with No Auth Required",
    [FinalWorklistStatus.AUTHORIZED_WITH_APPROVAL]: "Authorized with Approval",
    [FinalWorklistStatus.AUTHMATE_PENDING]: "Authmate Pending",
    [FinalWorklistStatus.AUTH_ISSUE_ONSITE]: "Auth Issue Onsite",
    [FinalWorklistStatus.DENIED]: "Denied",
  };

  const finalStatusOptions = Object.values(finalStatusLabels).map((status) => {
    return {
      value: status, // Keep the enum value for backend
      label: finalStatusLabels[status], // Use friendly label for display
    };
  });

  const assignFinalStatus = async () => {
    setIsUpdating(true);
    const updatedDoc = {
      "status.final_status": finalStatus,
    };
    try {
      await FirestoreService.updateDocument(
        FirestoreCollectionReference.medicalPaOrders(),
        props.id,
        {
          ...updatedDoc,
        },
      );
      controlToastState("assign-final-status-success");
      props.onComplete?.();
    } catch (error) {
      logError(error as Error, "Error while assigning final status");
      controlToastState("assign-final-status-failed");
      throw new Error("Error while assigning final status");
    } finally {
      setIsUpdating(false);
      closeModal(`final-status-modal-${props.id}`);
    }
  };
  return (
    <>
      <Modal
        dialogId={`final-status-modal-${props.id}`}
        onSave={assignFinalStatus}
        title={"Final Status"}
        saveButtonText={"Save"}
        cancelText={"Cancel"}
        disableSave={finalStatus === "" || isUpdating}
      >
        <div className="reassign-modal--layout overflow-inherit z-100 relative mb-2">
          <Select
            id={"final-status"}
            onOptionChange={onSelctedOptionChange}
            label={"Final Status"}
            placeholder={"Select Final Status"}
            defaultValue={""}
            options={finalStatusOptions}
          />
        </div>
      </Modal>
      <Toast
        type={"success"}
        header={"Final status assigned sucessfully!"}
        id={"assign-final-status-success"}
      />
      <Toast
        type={"error"}
        header={"Final status assignment failed!"}
        id={"assign-final-status-failed"}
      />
    </>
  );
};

export default FinalStatusModal;
