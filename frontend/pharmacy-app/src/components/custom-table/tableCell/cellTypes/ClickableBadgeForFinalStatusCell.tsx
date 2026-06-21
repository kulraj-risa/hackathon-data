import React from "react";
import { openModal } from "risa-oasis-ui_v2";
import ClickableBatch from "../../../clickableBatch/clickableBatch";
import FinalStatusModal from "../../../modals/finalStatusModal/finalStatusModal";

interface ClickableBadgeForFinalStatusCellProps {
  value: { id: string; text: string };
  onComplete?: () => void;
  [key: string]: any;
}

export const ClickableBadgeForFinalStatusCell: React.FC<
  ClickableBadgeForFinalStatusCellProps
> = ({ value, onComplete }) => {
  return (
    <>
      <div className="table-cell-clickable-badge">
        <ClickableBatch
          text={value.text}
          onClick={() => openModal(`final-status-modal-${value.id}`)}
        />
        <FinalStatusModal id={value.id} onComplete={onComplete} />
      </div>
    </>
  );
};

export default ClickableBadgeForFinalStatusCell;
