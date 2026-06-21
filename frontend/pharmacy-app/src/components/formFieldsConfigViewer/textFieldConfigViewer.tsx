import { useEffect, useState } from "react";
import { TextInput } from "risa-oasis-ui_v2";
import { TextField } from "../../data-model/pharmaPaFormModel";
import { IsReadOnlyRadioButton } from "./readOnlyRadioButton";
import { IsRequiredRadioButton } from "./requiredFieldRadioButton";

interface TextFieldConfigViewerProps {
  data?: TextField;
  onDataChange?: (data: TextField) => void;
  setDisabled?: (disabled: boolean) => void;
}

export const TextFieldConfigViewer = (props?: TextFieldConfigViewerProps) => {
  const [data, setData] = useState<TextField>({
    label: "",
    type: "text",
    key: "",
    isRequired: false,
    readOnly: false,
    placeholder: "",
    order: undefined,
    width: undefined,
    rowIndex: undefined,
    default: "",
    validationMessage: "",
    regex: "",
    additionalInfoHeader: "",
    additionalInfoContent: "",
  });

  const [errorMessages, setErrorMessages] = useState<{
    label: string;
    key: string;
    rowIndex: string;
    order: string;
  }>({
    label: "",
    key: "",
    rowIndex: "",
    order: "",
  });

  useEffect(() => {
    if (props?.data) {
      setData(props.data);
    }
  }, []);

  const handleChange = (data: {
    name: string;
    required: boolean;
    value: string;
  }) => {
    if (["order", "width", "rowIndex"].includes(data.name)) {
      const numValue = Number(data.value);
      if (data.value !== "" && !isNaN(numValue)) {
        setData((prev) => ({ ...prev, [data.name]: numValue }));
      } else {
        setData((prev) => ({ ...prev, [data.name]: undefined }));
      }
    } else {
      setData((prev) => ({ ...prev, [data.name]: data.value }));
    }
  };

  useEffect(() => {
    if (
      errorMessages.label ||
      errorMessages.key ||
      errorMessages.rowIndex ||
      errorMessages.order
    ) {
      props?.setDisabled?.(true);
    } else {
      props?.setDisabled?.(false);
    }
  }, [errorMessages]);
  useEffect(() => {
    setErrorMessages({
      label: data.label ? "" : "Label is required",
      key: data.key ? "" : "Key is required",
      rowIndex:
        typeof data.rowIndex === "number"
          ? ""
          : "Row Index is required and must be a number",
      order:
        typeof data.order === "number"
          ? ""
          : "Order is required and must be a number",
    });
  }, [data]);

  useEffect(() => {
    props?.onDataChange?.(data);
  }, [data]);

  return (
    <div className="text-filed-config--container flex flex-col gap-3">
      <div>
        <TextInput
          label="Enter Text Field Label"
          id="label"
          required
          placeholder="e.g. First Name, Email Address, Phone Number"
          onChange={handleChange}
          error={errorMessages.label}
          defaultValue={data.label}
        />
      </div>
      <div>
        <TextInput
          label="Enter Key"
          id="key"
          required
          placeholder="e.g. firstName, email, phoneNumber"
          onChange={handleChange}
          error={errorMessages.key}
          defaultValue={data.key}
        />
      </div>
      <div>
        <TextInput
          label="Enter Order Number"
          id="order"
          required
          placeholder="e.g. 1, 2, 3 (determines field order)"
          onChange={handleChange}
          error={errorMessages.order}
          defaultValue={data.order?.toString()}
        />
      </div>
      <div>
        <TextInput
          label="Enter Row Index"
          id="rowIndex"
          required
          placeholder="e.g. 0, 1, 2 (determines row position)"
          onChange={handleChange}
          error={errorMessages.rowIndex}
          defaultValue={data.rowIndex?.toString()}
        />
      </div>
      <div>
        <IsRequiredRadioButton
          value={data.isRequired}
          onChange={(value) => {
            setData((prev) => ({ ...prev, isRequired: value }));
          }}
        />
      </div>
      <div>
        <IsReadOnlyRadioButton
          value={data.readOnly}
          onChange={(value) => {
            setData((prev) => ({ ...prev, readOnly: value }));
          }}
        />
      </div>
      <div>
        <TextInput
          label="Enter Placeholder"
          id="placeholder"
          placeholder="e.g. Enter your email address"
          onChange={handleChange}
          defaultValue={data.placeholder}
        />
      </div>
      <div>
        <TextInput
          label="Enter Width In Number"
          id="width"
          placeholder="e.g. 100 (in percentage)"
          onChange={handleChange}
          defaultValue={data.width?.toString()}
        />
      </div>
      <div>
        <TextInput
          label="Enter Default Value"
          id="default"
          placeholder="e.g. john@example.com"
          onChange={handleChange}
          defaultValue={data.default}
        />
      </div>
      <div>
        <TextInput
          label="Enter Validation Message"
          id="validationMessage"
          placeholder="e.g. Please enter a valid email address"
          onChange={handleChange}
          defaultValue={data.validationMessage}
        />
      </div>
      <div>
        <TextInput
          label="Enter Validation Regex"
          id="regex"
          placeholder="e.g. ^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$"
          onChange={handleChange}
          defaultValue={data.regex}
        />
      </div>
      <div>
        <TextInput
          label="Enter Additional Info Header"
          id="additionalInfoHeader"
          placeholder="e.g. Additional Information"
          onChange={handleChange}
          defaultValue={data.additionalInfoHeader}
        />
      </div>
      <div>
        <TextInput
          label="Enter Additional Info Content"
          id="additionalInfoContent"
          placeholder="e.g. This field is used for..."
          onChange={handleChange}
          defaultValue={data.additionalInfoContent}
        />
      </div>
    </div>
  );
};
