import React from "react";

interface ClickableTextWithDisabledStatusCellProps {
  value: { status: string; data: any };
  handleClickableTextWithDisabledStatusClick?: (data: any) => void;
  [key: string]: any;
}

export const ClickableTextWithDisabledStatusCell: React.FC<
  ClickableTextWithDisabledStatusCellProps
> = ({ value, handleClickableTextWithDisabledStatusClick }) => {
  return (
    <>
      <div
        onClick={() =>
          value?.status === "disabled"
            ? null
            : handleClickableTextWithDisabledStatusClick?.(value.data)
        }
        className={` ${value.status === "disabled" ? "text-h12 font-semibold text-tertiaryBlue-12 hover:cursor-none" : "text-h12 font-semibold text-tertiaryBlue-5 hover:cursor-pointer"}`}
      >
        {value.data}
      </div>
    </>
  );
};

export default ClickableTextWithDisabledStatusCell;
