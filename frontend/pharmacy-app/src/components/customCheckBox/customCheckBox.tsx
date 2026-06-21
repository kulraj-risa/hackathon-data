import { ChangeEvent } from "react";

interface CustomCheckBoxProps {
  id: string;
  label: string;
  isChecked: boolean;
  isDisabled?: boolean;
  removeGap?: boolean;
  onCheckBoxValueChange: (data: { name: string; value: boolean }) => void;
  className?: string;
  height?: string;
  width?: string;
}

const CustomCheckBox = (props: CustomCheckBoxProps) => {
  function handleCheckboxChange(event: ChangeEvent<HTMLInputElement>): void {
    const dataToEmit = { name: props.id, value: event.target.checked };
    props.onCheckBoxValueChange(dataToEmit);
  }

  return (
    <div
      className={`checkbox-container flex cursor-auto items-start ${
        props.removeGap ? "gap-0" : "gap-2"
      }`}
    >
      <input
        type="checkbox"
        id={props.id}
        name={props.id}
        value={props.id}
        checked={props.isChecked}
        onChange={handleCheckboxChange}
        disabled={props.isDisabled}
        className={`checkbox-input mt-[6px] rounded border border-primaryGray-15 bg-white accent-black hover:cursor-pointer ${
          props.height ? `h-[${props.height}]` : "h-4"
        } ${props.width ? `w-[${props.width}]` : "w-4"}`}
      />
      <label
        htmlFor={props.id}
        className={`text-samll flex-1 font-normal text-primaryGray-2 hover:cursor-pointer ${
          props.className
        }`}
      >
        {props.label}
      </label>
    </div>
  );
};

export default CustomCheckBox;
