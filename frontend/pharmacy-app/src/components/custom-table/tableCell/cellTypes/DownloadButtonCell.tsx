import React from "react";
import EyeIcon from "../../../../svg/eye";

interface DownloadButtonCellProps {
  value: { id: string };
  onDownloadButtonClick?: (id: string) => void;
  [key: string]: any;
}

export const DownloadButtonCell: React.FC<DownloadButtonCellProps> = ({
  value,
  onDownloadButtonClick,
}) => {
  const handleDownloadButtonClick = (id: string) => {
    if (onDownloadButtonClick) {
      onDownloadButtonClick(id);
    }
  };

  return (
    <>
      <div className="flex flex-row items-center gap-2 overflow-hidden text-tertiaryBlue-4 hover:text-tertiaryBlue-5 hover:underline">
        <div
          onClick={(e) => {
            handleDownloadButtonClick(value.id);
          }}
          className="truncate"
        >
          Audit Trail
        </div>
        <div
          onClick={() => {
            handleDownloadButtonClick(value.id);
          }}
        >
          <EyeIcon />
        </div>
      </div>
    </>
  );
};

export default DownloadButtonCell;
