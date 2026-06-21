import React from "react";
import { controlToastState } from "risa-oasis-ui_v2";
import { CopyIcon } from "../../../../svg/copy-icon";

interface MultilineCellProps {
  value: { mainText: any; secondaryText: any; hideCopyIcon?: boolean };
  [key: string]: any;
  shouldShowLeftBorder?: boolean;
  leftBorderColor?: string;
}

export const MultilineCell: React.FC<MultilineCellProps> = ({
  value,
  shouldShowLeftBorder,
  leftBorderColor,
}) => {
  const isMRN = value.secondaryText && value.secondaryText.includes("MRN :");
  let copyValue = "";

  if (isMRN) {
    copyValue = value.secondaryText.split("MRN :")[1]?.trim() || "";
  }

  const shouldShowCopyIcon = !value.hideCopyIcon;
  return (
    <>
      <div
        className={`table-cell-multiline-text ${shouldShowLeftBorder ? "h-[100%] border-l-4 p-3" : ""}`}
        style={
          shouldShowLeftBorder
            ? { borderLeftColor: leftBorderColor }
            : { borderLeftColor: "transparent" }
        }
      >
        <div className="table-cell-multiline-text__main" title={value.mainText}>
          {value.mainText}
        </div>
        <div className="flex items-center gap-2">
          <div className="table-cell-multiline-text__secondary">
            {value.secondaryText}
          </div>
          {shouldShowCopyIcon && (
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
          )}
        </div>
      </div>
    </>
  );
};

export default MultilineCell;
