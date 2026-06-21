import React from "react";
import { openModal } from "risa-oasis-ui_v2";
import ChevronDown from "../../../../svg/chevron-down";
import AuthStatusChangeModal from "../../../modals/authStatusChangeModal/authStatusChangeModal";

interface ClickableBadgeModalCellProps {
  value: {
    id: string;
    text: string;
    color?: string;
    bgColor?: string;
    displayText?: string;
    currentStatusId: string;
    onStatusChange: (data: any) => void;
    modalTitle?: string;
    jCode?: string;
    description?: string;
  };
  rowIndex: number;
  header: string;
  onTableRowUpdate?: (data: any) => void;
  onValueChange?: (data: any) => void;
  [key: string]: any;
}

export const ClickableBadgeModalCell: React.FC<
  ClickableBadgeModalCellProps
> = ({ value, rowIndex, header, onTableRowUpdate, onValueChange }) => {
  return (
    <>
      <div className="table-cell-clickable-badge">
        <div
          className="table-cell-badge flex cursor-pointer flex-row items-center gap-2"
          style={{
            color: value.color || "#000000",
            backgroundColor: value.bgColor || "#F5F5F5",
          }}
          title={value.displayText}
          onClick={() =>
            openModal(`auth-status-change-modal-${value.id}-${rowIndex}`)
          }
        >
          {value.text}
          <ChevronDown />
        </div>
        <AuthStatusChangeModal
          id={value.id}
          currentStatus={{
            id: value.currentStatusId,
            text: value.text,
            bgColor: value.bgColor || "#F5F5F5",
            textColor: value.color || "#000000",
          }}
          onStatusChange={value.onStatusChange}
          onClose={() => {}}
          title={value.modalTitle || "Change Auth Status"}
          rowIndex={rowIndex}
          fieldKey={header}
          onTableRowUpdate={onTableRowUpdate}
          onValueChange={onValueChange}
          jCode={value.jCode}
          description={value.description}
        />
      </div>
    </>
  );
};

export default ClickableBadgeModalCell;
