import React from "react";

interface ButtonLinkCellProps {
  value: any;
  onReviewClick?: () => void;
  [key: string]: any;
}

export const ButtonLinkCell: React.FC<ButtonLinkCellProps> = ({
  value,
  onReviewClick,
}) => {
  const handleReviewClick = () => {
    if (onReviewClick) {
      onReviewClick();
    }
  };

  return (
    <>
      <button
        className="table-cell-btn__link w-full"
        onClick={handleReviewClick}
      >
        <div className="button-text truncate">{value}</div>
      </button>
    </>
  );
};

export default ButtonLinkCell;
