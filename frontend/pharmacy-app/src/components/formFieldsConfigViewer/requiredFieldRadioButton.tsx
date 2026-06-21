import { useEffect, useState } from "react";
import CustomRadioButton from "../customRadioButton/customRadioButton";

interface IsRequiredRadioButtonProps {
  value?: boolean;
  onChange?: (value: boolean) => void;
}

export const IsRequiredRadioButton = (props: IsRequiredRadioButtonProps) => {
  const [value, setValue] = useState<string>("");

  useEffect(() => {
    setValue(props.value ? "true" : "false");
  }, [props.value]);

  return (
    <div className="is-required-radio-button">
      <div className="is-required-radio-button--label mb-2 text-tiny text-primaryGray-2">
        Is Required ?{" "}
      </div>
      <div className="is-required-radio-button--options flex gap-4">
        <CustomRadioButton
          name={"isRequired"}
          value={"true"}
          checked={value === "true"}
          label={"Yes"}
          onChange={(event) => {
            event.target.checked && props.onChange?.(true);
            event.target.checked && setValue("true");
          }}
        />
        <CustomRadioButton
          name={"isRequired"}
          value={"false"}
          checked={value === "false"}
          label={"No"}
          onChange={(event) => {
            event.target.checked && props.onChange?.(false);
            event.target.checked && setValue("false");
          }}
        />
      </div>
    </div>
  );
};
