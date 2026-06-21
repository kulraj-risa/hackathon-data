import React from "react";

interface StringCellProps {
  value: any;
  [key: string]: any;
}

export const StringCell: React.FC<StringCellProps> = ({ value }) => {
  return (
    <div
      title={value}
      className="truncate text-small font-medium text-primaryGray-1"
    >
      {value}
    </div>
  );
};

export default StringCell;
