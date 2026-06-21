import React from "react";
import { useSelector } from "react-redux";
import { openModal } from "risa-oasis-ui_v2";
import { logEventToBigQuery } from "../../../../api/postCall/logEventToBigQueryNew";
import { ScreenNamesForBigQuery } from "../../../../enums/eventsData";
import { EventsName } from "../../../../enums/eventsName";
import { RootState } from "../../../../redux/store/store";
import { getOrgIdForFetchExternalWorklist } from "../../../../utils/organizationHelper";
import ClickableBatch from "../../../clickableBatch/clickableBatch";
import ReAssignModal from "../../../modals/reAssignModal/reAssignModal";

interface ClickableBadgeCellProps {
  value: {
    id: string;
    text: string;
    shouldLogEvent?: boolean;
    assignedToId: string;
  };
  onComplete?: () => void;
  [key: string]: any;
}

export const ClickableBadgeCell: React.FC<ClickableBadgeCellProps> = ({
  value,
  onComplete,
  shouldLogEvent,
}) => {
  const { user } = useSelector(
    (state: RootState) => state.firebaseAuthentication,
  );
  const orgId = getOrgIdForFetchExternalWorklist();
  return (
    <>
      <div className="table-cell-clickable-badge">
        <ClickableBatch
          text={value.text}
          onClick={() => {
            openModal(`reAssign-modal-${value.id}`);
            if (value.shouldLogEvent) {
              logEventToBigQuery({
                event_name: EventsName.ASSIGNED_TO_CLICKED,
                patient_id: "",
                order_id: value.id,
                user_id: user?.id ?? "",
                user_email: user?.email ?? "",
                org_id: orgId ?? "",
                additional_data: {
                  screen_name: ScreenNamesForBigQuery.WORKLIST,
                  current_assigned_to: value.assignedToId,
                },
              });
            }
          }}
        />
        <ReAssignModal
          id={value.id}
          assignedTo={value.text}
          assignedToId={value.assignedToId}
          assignedToEmail={value.text}
          onComplete={onComplete}
          shouldLogEvent={value.shouldLogEvent}
        />
      </div>
    </>
  );
};

export default ClickableBadgeCell;
