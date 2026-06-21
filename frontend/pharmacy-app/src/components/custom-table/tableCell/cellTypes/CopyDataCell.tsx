import React from "react";
import { controlToastState } from "risa-oasis-ui_v2";
import { CopyIcon } from "../../../../svg/copy-icon";

interface CopyDataCellProps {
  value: string;
  [key: string]: any;
}

export const CopyDataCell: React.FC<CopyDataCellProps> = ({ value }) => {
  return (
    <>
      <div
        className="copy-data-container flex max-w-full items-center gap-2 overflow-hidden"
        onClick={(e) => {
          e.stopPropagation(); // Prevent event bubbling to parent table cell
          navigator.clipboard.writeText(value);
          controlToastState("key-copy-success");
        }}
      >
        <div className="copy-text overflow-hidden truncate">
          {value === "" ? "--" : value}
        </div>
        {value && <CopyIcon />}
      </div>
    </>
  );
};

export default CopyDataCell;
