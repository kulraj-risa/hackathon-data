import React from "react";
import StatusText from "../../../statusText/statusText";

interface NycbsStatusCellProps {
  value: { status: number };
  handleStatusClick?: (data: any) => void;
  [key: string]: any;
}

export const NycbsStatusCell: React.FC<NycbsStatusCellProps> = ({
  value,
  handleStatusClick,
}) => {
  const handleStatusClickHandler = (data: any) => {
    if (handleStatusClick) {
      handleStatusClick(data);
    }
  };

  return (
    <div
      className="nycbs-status-text max-w-full truncate"
      onClick={() => handleStatusClickHandler(value)}
    >
      <StatusText status={value.status} />
    </div>
  );
};

export default NycbsStatusCell;
