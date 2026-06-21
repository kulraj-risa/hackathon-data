import React from "react";

export interface PopOverWithClickableOptionsProps {
  options: {
    text: string;
    icon?: React.ReactNode;
    id: string;
  }[];
  onClick: (id: string) => void;
}

const PopOverWithClickableOptions = (
  props: PopOverWithClickableOptionsProps,
) => {
  return (
    <div className="pop-over-with-clickable-options--container flex w-max flex-col gap-2 rounded bg-white p-4 shadow-lg">
      {props.options.map((option) => (
        <div
          className="single-option--container flex items-center justify-between gap-4 rounded p-2 hover:cursor-pointer hover:bg-primaryGray-16"
          key={option.id}
          onClick={() => props.onClick(option.id)}
        >
          <div className="single-option--text text-small font-regular">
            {option.text}
          </div>
          {option.icon && (
            <div className="single-option--icon">{option.icon}</div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PopOverWithClickableOptions;
