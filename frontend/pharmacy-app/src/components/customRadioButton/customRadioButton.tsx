import { ChangeEvent } from "react";
interface CustomRadioButtonProps {
  name: string;
  value: string;
  checked: boolean;
  label: string;
  className?: string;
  groupName?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

const CustomRadioButton = (props: CustomRadioButtonProps) => {
  return (
    <label className={`custom-radio ${props?.className}`}>
      <input
        type="radio"
        name={props.name}
        value={props.value}
        checked={props.checked}
        onChange={props.onChange}
        className="custom-radio__input"
        radioGroup={props.groupName ?? ""}
      />
      <span className="custom-radio__checkmark"></span>
      <span
        className="custom-radio__label"
        dangerouslySetInnerHTML={{ __html: props.label }}
      />
    </label>
  );
};

export default CustomRadioButton;
