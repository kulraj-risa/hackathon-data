import React, { useRef, useState } from "react";
import { InfoIcon } from "../../../../svg/info-icon";
import ToolTipUsingPortal from "../../../toolTipUsingPortal/toolTipUsingPortal";

interface BadgeWithICellProps {
  value: {
    text: string;
    color?: string;
    bgColor?: string;
    displayText?: string;
    showInfoIcon?: boolean;
  };
  [key: string]: any;
}

export const BadgeWithICell: React.FC<BadgeWithICellProps> = ({ value }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);
  return (
    <>
      <div
        className="flex flex-row items-center gap-2"
        onMouseEnter={() => setShowTooltip(value?.showInfoIcon ?? false)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div
          className="table-cell-badge"
          style={{
            color: value.color || "#000000",
            backgroundColor: value.bgColor || "#F5F5F5",
          }}
          title={value.displayText}
        >
          {value.text}
        </div>
        <div ref={parentRef}>{value.showInfoIcon && <InfoIcon />}</div>
        {showTooltip && (
          <ToolTipUsingPortal
            title={value.displayText}
            placement="left"
            showTooltip={showTooltip}
            parentRef={parentRef}
            children={<div>{value.displayText}</div>}
            wrapText
          />
        )}
      </div>
    </>
  );
};

export default BadgeWithICell;
