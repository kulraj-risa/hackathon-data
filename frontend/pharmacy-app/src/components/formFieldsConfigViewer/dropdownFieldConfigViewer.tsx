import { useEffect, useState } from "react";
import { InfoIconWithTooltip, TextInput } from "risa-oasis-ui_v2";
import { DropdownField } from "../../data-model/pharmaPaFormModel";
import { OptionsInputBox } from "../optionsInputBox/optionsInputBox";
import { IsReadOnlyRadioButton } from "./readOnlyRadioButton";
import { IsRequiredRadioButton } from "./requiredFieldRadioButton";

interface DropdownFieldConfigViewerProps {
  data?: DropdownField;
  onDataChange?: (data: DropdownField) => void;
  setDisabled?: (disabled: boolean) => void;
  fieldType: "dropdown" | "autoselect";
}

const DropdownFieldConfigViewer = (props: DropdownFieldConfigViewerProps) => {
  const [data, setData] = useState<DropdownField>({
    label: "",
    type: props?.fieldType,
    key: "",
    isRequired: false,
    placeholder: "",
    order: undefined,
    width: undefined,
    rowIndex: undefined,
    default: "",
    validationMessage: "",
    regex: "",
    additionalInfoHeader: "",
    additionalInfoContent: "",
    options: [],
    refDocId: "",
    minSearchLength: undefined,
  });

  useEffect(() => {
    if (props?.fieldType) {
      setData((prev) => ({ ...prev, type: props?.fieldType }));
    }
  }, [props?.fieldType]);

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
    if (["order", "width", "rowIndex", "minSearchLength"].includes(data.name)) {
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
    <div className="dropdown-field-config--container flex flex-col gap-3">
      <div>
        <TextInput
          label="Enter Dropdown Field Label"
          id="label"
          required
          placeholder="e.g. Country, State, City, Department"
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
          placeholder="e.g. country, state, city, department"
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
        <OptionsInputBox
          options={props?.data?.options ?? []}
          emittedOptions={(options) => {
            setData((prev) => ({ ...prev, options }));
          }}
        />
      </div>
      <div>
        <TextInput
          label="Enter Ref Doc ID"
          id="refDocId"
          placeholder="e.g. countries_list, states_list, departments_list"
          onChange={handleChange}
          defaultValue={data.refDocId}
          labelSuffix={
            <InfoIconWithTooltip content="If options not provided, this field will be used to fetch options from the reference document" />
          }
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
          placeholder="e.g. Select a country, Choose your department"
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
          placeholder="e.g. USA, California, Engineering"
          onChange={handleChange}
          defaultValue={data.default}
        />
      </div>
      <div>
        <TextInput
          label="Enter Validation Message"
          id="validationMessage"
          placeholder="e.g. Please select a valid option"
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
          placeholder="e.g. Location Information"
          onChange={handleChange}
          defaultValue={data.additionalInfoHeader}
        />
      </div>
      <div>
        <TextInput
          label="Enter Additional Info Content"
          id="additionalInfoContent"
          placeholder="e.g. Please select your current location from the list"
          onChange={handleChange}
          defaultValue={data.additionalInfoContent}
        />
      </div>
      <div>
        <TextInput
          label="Enter Minimum Search Length"
          id="minSearchLength"
          placeholder="e.g. 2 (minimum characters to start search)"
          onChange={handleChange}
          defaultValue={data.minSearchLength?.toString()}
        />
      </div>
    </div>
  );
};

export default DropdownFieldConfigViewer;
