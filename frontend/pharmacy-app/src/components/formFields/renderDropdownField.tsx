import { useSelector } from "react-redux";
import { Select } from "risa-oasis-ui_v2";
import { usePharmaFormFields } from "../../context/pharmaFormFieldsContext";
import { DropdownField } from "../../data-model/pharmaPaFormModel";
import { checkIfErrorExists } from "../../pages/pharmaPaForm/utils/checkIfErrorExists";
import { RootState } from "../../redux/store/store";
import { getNestedValue } from "../../utils/getNestedValue";

interface DropDownFieldProps {
  field: DropdownField;
  fieldDetails?: Record<string, any>;
  data?: any;
  originalData?: any;
  shouldEmitLogEvent?: boolean;
}
const RenderDropdownField = (props: DropDownFieldProps) => {
  const { formFieldsData, setFormFieldsData, resetFormFieldsData } =
    usePharmaFormFields();
  const { user } = useSelector(
    (state: RootState) => state.firebaseAuthentication,
  );

  const initialDataValue = getNestedValue(props?.data, props.field.key) ?? "";

  const computeDefaultSelectValue = () => {
    if (props?.field?.readOnly) {
      return formFieldsData?.[props?.field?.key]?.filledValue ?? "";
    }
    if (initialDataValue && initialDataValue !== "") {
      return initialDataValue;
    } else {
      return props?.field?.default || "";
    }
  };

  const handleSelectFieldOnChange = (data: { value: any }) => {
    let newStateToUpdate = { ...formFieldsData }; // Copy the previous state
    const originalDataValue =
      getNestedValue(props?.originalData, props.field.key) ?? "";
    setFormFieldsData({
      ...newStateToUpdate,
      [props.field.key]: {
        ...newStateToUpdate[props.field.key],
        filledValue: data.value !== "" ? data.value : "",
        isFieldDirty: originalDataValue != data.value,
      },
    });
  };
  return (
    <div
      key={props?.field?.key}
      className={`dropdown__container flex-1`}
      style={{
        maxWidth: props?.field?.width ? `${props.field.width}%` : "100%",
      }}
    >
      <Select
        id={props?.field?.key}
        onOptionChange={(data) => handleSelectFieldOnChange(data)}
        label={props?.field?.label}
        placeholder={props?.field?.placeholder ?? ""}
        options={props?.field?.options}
        required={props?.field?.isRequired}
        defaultValue={
          props?.field?.options?.some(
            (option) => option.value === computeDefaultSelectValue(),
          )
            ? computeDefaultSelectValue()
            : ""
        }
        error={
          checkIfErrorExists(
            formFieldsData,
            props?.field?.key,
            props?.field?.readOnly,
          )
            ? `${props?.field?.validationMessage ?? "This field is required"}`
            : ""
        }
      />
      {(props?.field?.additionalInfoHeader ||
        props?.field?.additionalInfoContent) && (
        <div className="section-additonal-info flex w-full flex-col gap-2 bg-secondaryYellow-11 p-3">
          <div className="section-additonal-info__header text-tiny font-bold">
            {props?.field?.additionalInfoHeader ?? ""}
          </div>
          <div className="section-additonal-info__content text-[0.8125rem] font-normal">
            {props?.field?.additionalInfoContent ?? ""}
          </div>
        </div>
      )}
    </div>
  );
};

export default RenderDropdownField;
