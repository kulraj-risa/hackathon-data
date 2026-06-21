import { useEffect, useState } from "react";
import CustomRadioButton from "../customRadioButton/customRadioButton";

interface IsReadOnlyRadioButtonProps {
  value?: boolean;
  onChange?: (value: boolean) => void;
}

export const IsReadOnlyRadioButton = (props: IsReadOnlyRadioButtonProps) => {
  const [value, setValue] = useState<string>("");

  useEffect(() => {
    setValue(props.value ? "true" : "false");
  }, [props.value]);

  return (
    <div className="is-read-only-radio-button">
      <div className="is-read-only-radio-button--label mb-2 text-tiny text-primaryGray-2">
        Is Read Only ?{" "}
      </div>
      <div className="is-read-only-radio-button--options flex gap-4">
        <CustomRadioButton
          name={"readOnly"}
          value={"true"}
          checked={value === "true"}
          label={"Yes"}
          onChange={(event) => {
            event.target.checked && props.onChange?.(true);
            event.target.checked && setValue("true");
          }}
        />
        <CustomRadioButton
          name={"readOnly"}
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
