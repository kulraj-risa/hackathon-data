import React from "react";
import { openModal } from "risa-oasis-ui_v2";
import CheckErrorModal from "../../../modals/checkErrorModal/checkErrorModal";

interface ErrorModalCellProps {
  value: { id: string; text: string };
  [key: string]: any;
}

export const ErrorModalCell: React.FC<ErrorModalCellProps> = ({ value }) => {
  return (
    <>
      <div
        className="error-modal-container"
        onClick={() => {
          openModal(`${value.id}-check_error`);
          navigator.clipboard.writeText(value.id);
        }}
      >
        Check Error
      </div>
      <CheckErrorModal id={`${value.id}`} reasons={value.text} />
    </>
  );
};

export default ErrorModalCell;
