import { useEffect, useState } from "react";
import { Button, Select, TextInput } from "risa-oasis-ui_v2";
import {
  ArrayField,
  DateField,
  DropdownField,
  FormField,
  GroupField,
  RadioButtonField,
  TextField,
} from "../../../data-model/pharmaPaFormModel";
import { CrossIcon } from "../../../svg/cross-icon";
import ArrayFieldConfigViewer from "../../formFieldsConfigViewer/arrayFieldConfigViewer";
import { DateFieldConfigViewer } from "../../formFieldsConfigViewer/dateFieldConfigViewer";
import DropdownFieldConfigViewer from "../../formFieldsConfigViewer/dropdownFieldConfigViewer";
import GroupFieldConfigViewer from "../../formFieldsConfigViewer/groupFieldConfigViewer";
import RadioButtonFieldConfigViewer from "../../formFieldsConfigViewer/radioButtonFieldConfigViewer";
import { TextFieldConfigViewer } from "../../formFieldsConfigViewer/textFieldConfigViewer";

interface FormFieldSideViewModalProps {
  type: "add" | "edit";
  onSubmit?: (data: any) => void;
  onClose?: () => void;
  initialData?: FormField;
}
const FormFieldSideViewModal = (props: FormFieldSideViewModalProps) => {
  const [fieldType, setFieldType] = useState("text");
  const [finalFieldData, setFinalFieldData] = useState<any>({});
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    if (props.initialData) {
      setFieldType(props.initialData.type);
    }
  }, []);

  const fieldTypeOptions = [
    {
      label: "Text",
      value: "text",
    },
    {
      label: "Date",
      value: "date",
    },
    {
      label: "Radio Button",
      value: "radio",
    },
    {
      label: "Dropdown",
      value: "dropdown",
    },
    {
      label: "Sub Section",
      value: "group",
    },
    {
      label: "Autocomplete Search",
      value: "autoselect",
    },
    {
      label: "Array of Fields",
      value: "array",
    },
  ];
  return (
    <>
      <div className="add-field-container fixed flex h-full w-full flex-col overflow-hidden">
        <div className="add-field-header border-primaryGray14 flex items-center justify-between gap-4 border-b px-4 py-3 text-large font-bold text-primaryGray-1">
          <div className="add-field-header--text">
            {props.type === "add" ? "Add Field" : "Edit Field"}
          </div>
          <div
            className="add-field-header--icon hover:cursor-pointer"
            onClick={() => props.onClose?.()}
          >
            <CrossIcon />
          </div>
        </div>
        <div className="add-field-body flex flex-1 flex-col gap-3 overflow-hidden p-4">
          <div className="add-field field-type">
            {props.type === "add" ? (
              <>
                <Select
                  options={fieldTypeOptions}
                  value={fieldTypeOptions[0].value}
                  onOptionChange={(e) => {
                    setFieldType(e.value);
                  }}
                  label="Select Field Type"
                  id="type"
                  placeholder="Select Field Type"
                  defaultValue={props.initialData?.type ?? "text"}
                />
              </>
            ) : (
              <>
                <TextInput
                  label="Field Type"
                  id="type"
                  placeholder="Enter Field Type"
                  defaultValue={props.initialData?.type ?? "text"}
                  onChange={(e) => {}}
                  readOnly={true}
                />
              </>
            )}
          </div>
          <div className="add-field-body--type-specific overflow-auto bg-[#F7F9FA] p-3">
            {fieldType === "text" && (
              <>
                <TextFieldConfigViewer
                  onDataChange={(data) => {
                    setFinalFieldData(data);
                  }}
                  setDisabled={(disabled) => {
                    setDisabled(disabled);
                  }}
                  data={props.initialData as TextField}
                />
              </>
            )}
            {fieldType === "date" && (
              <>
                <DateFieldConfigViewer
                  onDataChange={(data) => {
                    setFinalFieldData(data);
                  }}
                  setDisabled={(disabled) => {
                    setDisabled(disabled);
                  }}
                  data={props.initialData as DateField}
                />
              </>
            )}

            {(fieldType === "dropdown" || fieldType === "autoselect") && (
              <>
                <DropdownFieldConfigViewer
                  onDataChange={(data) => {
                    setFinalFieldData(data);
                  }}
                  setDisabled={(disabled) => {
                    setDisabled(disabled);
                  }}
                  fieldType={fieldType}
                  data={props.initialData as DropdownField}
                />
              </>
            )}
            {fieldType === "radio" && (
              <>
                <RadioButtonFieldConfigViewer
                  onDataChange={(data) => {
                    setFinalFieldData(data);
                  }}
                  setDisabled={(disabled) => {
                    setDisabled(disabled);
                  }}
                  data={props.initialData as RadioButtonField}
                />
              </>
            )}
            {fieldType === "group" && (
              <>
                <GroupFieldConfigViewer
                  onDataChange={(data) => {
                    setFinalFieldData(data);
                  }}
                  setDisabled={(disabled) => {
                    setDisabled(disabled);
                  }}
                  data={props.initialData as GroupField}
                />
              </>
            )}
            {fieldType === "array" && (
              <>
                <ArrayFieldConfigViewer
                  data={props.initialData as ArrayField}
                  onDataChange={(data) => {
                    setFinalFieldData(data);
                  }}
                  setDisabled={(disabled) => {
                    setDisabled(disabled);
                  }}
                />
              </>
            )}
          </div>
        </div>
        <div className="add-field-footer flex items-center justify-between gap-4 border-t border-primaryGray-15 px-4 py-3">
          <div className="flex-1">
            <Button
              disabled={false}
              children={"Cancel"}
              onClick={() => props.onClose?.()}
              buttonType={"secondary"}
              size={"medium"}
            />
          </div>
          <div className="flex-1">
            <Button
              disabled={disabled}
              children={props.type === "add" ? "Add Field" : "Save Changes"}
              onClick={() => {
                props.onSubmit?.(finalFieldData);
                props.onClose?.();
              }}
              buttonType={"primary"}
              size={"medium"}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default FormFieldSideViewModal;
