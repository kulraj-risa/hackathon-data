import React from "react";
import RedWarningIcon from "../../../../svg/redWarningIcon";

interface StringWithIconCellProps {
  value: any;
  [key: string]: any;
}

export const StringWithIconCell: React.FC<StringWithIconCellProps> = ({
  value,
}) => {
  return (
    <>
      <div className="table-cell-multiline-text">
        <div className="flex items-center gap-2">
          <div title={value} className="truncate">
            {value}
          </div>
          <RedWarningIcon />
        </div>
        {/* <div className="flex items-center gap-2">
          <div className="table-cell-multiline-text__secondary">
            {value.secondaryText}
          </div>
          {
            <div
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(
                  isMRN ? copyValue : value.secondaryText,
                );
                controlToastState("key-copy-success");
              }}
              className="cursor-pointer"
            >
              <CopyIcon />
            </div>
          }
        </div> */}
      </div>
    </>
  );
};

export default StringWithIconCell;
