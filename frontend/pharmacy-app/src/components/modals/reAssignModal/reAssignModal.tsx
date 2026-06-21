import moment from "moment";
import { useState } from "react";
import { useSelector } from "react-redux";
import {
  closeModal,
  controlToastState,
  Modal,
  Select,
  Toast,
} from "risa-oasis-ui_v2";
import { FirestoreService } from "../../../api/firebase/firestoreService";
import { FirestoreCollectionReference } from "../../../api/firebase/references";
import { logEventToBigQuery } from "../../../api/postCall/logEventToBigQueryNew";
import { ScreenNamesForBigQuery } from "../../../enums/eventsData";
import { EventsName } from "../../../enums/eventsName";
import { RootState } from "../../../redux/store/store";
import { logError } from "../../../utils/customLogger";
import { generateFullName } from "../../../utils/generateOrderDataForTable";
import { getOrgIdForFetchExternalWorklist } from "../../../utils/organizationHelper";

interface ReAssignModalProps {
  id: string;
  assignedTo?: string;
  assignedToId?: string;
  assignedToEmail?: string;
  onComplete?: () => void;
  shouldLogEvent?: boolean;
}
const ReAssignModal = (props: ReAssignModalProps) => {
  const [providerId, setProviderId] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const { user } = useSelector(
    (state: RootState) => state.firebaseAuthentication,
  );

  const orgId = getOrgIdForFetchExternalWorklist();
  const { data: providersDetails } = useSelector(
    (state: RootState) => state.allProviders,
  );
  const onSelctedOptionChange = (data) => {
    setProviderId(data.value);
  };

  const options = providersDetails?.map((provider) => {
    return {
      value: provider?.DocID || "",
      label: generateFullName(
        provider.FirstName || "",
        "",
        provider?.LastName || "",
      ),
    };
  });

  const assignOrderToProvider = async () => {
    if (props.shouldLogEvent) {
      logEventToBigQuery({
        event_name: EventsName.ASSIGNED_TO_SAVE_CLICKED,
        patient_id: "",
        order_id: props.id,
        user_id: user?.id ?? "",
        user_email: user?.email ?? "",
        org_id: orgId ?? "",
        additional_data: {
          screen_name: ScreenNamesForBigQuery.WORKLIST,
          current_assigned_to: props.assignedToId,
          new_assigned_to: providerId,
          assignee_user_email:
            providersDetails?.find((provider) => provider.DocID === providerId)
              ?.EmailAddresses?.[0] ?? "",
        },
      });
    }
    setIsUpdating(true);
    const providerName = providersDetails?.filter(
      (provider) => provider.DocID === providerId,
    );
    const updatedDoc = {
      "assigned_to.provider_name": generateFullName(
        providerName?.[0]?.FirstName || "",
        "",
        providerName?.[0]?.LastName || "",
      ),
      "assigned_to.provider_id": providerId,
      "timestamps.assigned_at": moment().format(
        "YYYY-MM-DDTHH:mm:ss.SSSSSS[+00:00]",
      ),
    };
    try {
      await FirestoreService.updateDocument(
        FirestoreCollectionReference.medicalPaOrders(),
        props.id,
        {
          ...updatedDoc,
        },
      );
      controlToastState("assign-order-success");
      props.onComplete?.();
    } catch (error) {
      logError(error as Error, "Error while assigning order to provider");
      controlToastState("assign-order-failed");
      throw new Error("Error while assigning order to provider");
    } finally {
      setIsUpdating(false);
      closeModal(`reAssign-modal-${props.id}`);
    }
  };
  return (
    <>
      <Modal
        dialogId={`reAssign-modal-${props.id}`}
        onSave={assignOrderToProvider}
        title={"Re-Assign"}
        saveButtonText={"Save"}
        cancelText={"Cancel"}
        disableSave={providerId === "" || isUpdating}
      >
        <div className="reassign-modal--layout">
          {props.assignedTo && (
            <div className="reassign-modal--assigned">
              This Auth is assigned to <span>{props?.assignedTo}</span>
            </div>
          )}
          <div className="reassign-modal--reassign-to">
            <Select
              id={"reassign-to"}
              onOptionChange={onSelctedOptionChange}
              label={"Re-assign To"}
              placeholder={"Select Member"}
              defaultValue={""}
              options={options || []}
            />
          </div>
        </div>
      </Modal>
      <Toast
        type={"success"}
        header={"Order assignment sucessfull!"}
        id={"assign-order-success"}
      />
      <Toast
        type={"error"}
        header={"Order assignment failed!"}
        id={"assign-order-failed"}
      />
    </>
  );
};

export default ReAssignModal;
