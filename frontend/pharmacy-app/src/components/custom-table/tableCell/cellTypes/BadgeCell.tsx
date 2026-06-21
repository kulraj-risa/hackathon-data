import React from "react";
import { InfoIcon } from "../../../../svg/info-icon";

interface BadgeCellProps {
  value: {
    text: string;
    color?: string;
    bgColor?: string;
    displayText?: string;
    showInfoIcon?: boolean;
    hoverText?: string;
    onClick?: () => void;
  };
  [key: string]: any;
}

export const BadgeCell: React.FC<BadgeCellProps> = ({ value }) => {
  return (
    <div className="flex flex-row items-center gap-1">
      <div
        className={`table-cell-badge ${value.onClick ? "cursor-pointer" : ""}`}
        style={{
          color: value.color || "#000000",
          backgroundColor: value.bgColor || "#F5F5F5",
        }}
        onClick={(e) => {
          if (value.onClick) {
            e.stopPropagation();
            value.onClick();
          }
        }}
        title={
          !value.showInfoIcon
            ? value.hoverText || value.displayText
            : value.displayText
        }
      >
        {value.text}
      </div>
      {value.showInfoIcon && (
        <div title={value.hoverText} className="cursor-pointer">
          <InfoIcon />
        </div>
      )}
    </div>
  );
};

export default BadgeCell;
