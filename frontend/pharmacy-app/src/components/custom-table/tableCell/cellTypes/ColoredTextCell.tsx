import React from "react";

interface ColoredTextCellProps {
  value: { text?: string; value?: string; color?: string };
  [key: string]: any;
}

export const ColoredTextCell: React.FC<ColoredTextCellProps> = ({ value }) => {
  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  };

  return (
    <div
      className={`table-cell-colored-text ${value?.value || ""}`}
      style={{ color: value?.color || "black" }}
    >
      {capitalizeFirstLetter(value?.text || value?.value || "")}
    </div>
  );
};

export default ColoredTextCell;
