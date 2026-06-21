import { useEffect, useState } from "react";
import { TextInput } from "risa-oasis-ui_v2";
import { GroupField } from "../../data-model/pharmaPaFormModel";

interface GroupFieldConfigViewerProps {
  data?: GroupField;
  onDataChange?: (data: GroupField) => void;
  setDisabled?: (disabled: boolean) => void;
}

const GroupFieldConfigViewer = (props: GroupFieldConfigViewerProps) => {
  const [data, setData] = useState<GroupField>({
    label: "",
    type: "group",
    key: "",
    fields: [],
    order: undefined,
    width: undefined,
    rowIndex: undefined,
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
    <div className="group-field-config--container flex flex-col gap-3">
      <div>
        <TextInput
          label="Enter Group Field Label"
          id="label"
          required
          placeholder="e.g. Primary Diagnosis, Secondary Diagnosis, Medical History"
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
          placeholder="e.g. primaryDiagnosis, secondaryDiagnosis, medicalHistory"
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
    </div>
  );
};

export default GroupFieldConfigViewer;
