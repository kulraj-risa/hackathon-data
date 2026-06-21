import { ChangeEvent } from "react";
import { useSelector } from "react-redux";
import { usePharmaFormFields } from "../../context/pharmaFormFieldsContext";
import { RadioButtonField } from "../../data-model/pharmaPaFormModel";
import { checkIfErrorExists } from "../../pages/pharmaPaForm/utils/checkIfErrorExists";
import { RootState } from "../../redux/store/store";
import { getNestedValue } from "../../utils/getNestedValue";
import CustomRadioButton from "../customRadioButton/customRadioButton";

interface RadioButtonProps {
  field: RadioButtonField;
  fieldDetails?: Record<string, any>;
  data?: any;
  originalData?: any;
  shouldEmitLogEvent?: boolean;
}

const RenderRadioButtonField = (props: RadioButtonProps) => {
  const { formFieldsData, setFormFieldsData, resetFormFieldsData } =
    usePharmaFormFields();
  const { user } = useSelector(
    (state: RootState) => state.firebaseAuthentication,
  );

  const initialDataValue = getNestedValue(props?.data, props.field.key) ?? "";

  const computeDefaultRadioButtonValue = () => {
    if (props?.field?.readOnly) {
      return formFieldsData?.[props?.field?.key]?.filledValue ?? "";
    }
    if (initialDataValue && initialDataValue !== "") {
      return initialDataValue;
    } else {
      return props?.field?.default || "";
    }
  };
  const handleRadioButtonOnChange = (data) => {
    const originalDataValue =
      getNestedValue(props?.originalData, props.field.key) ?? "";
    setFormFieldsData({
      ...formFieldsData,
      [props?.field?.key]: {
        ...formFieldsData[props?.field?.key],
        filledValue: data.value !== "" ? data.value : "",
        isFieldDirty: originalDataValue != data.value,
      },
    });
  };

  return (
    <div
      key={props?.field?.key}
      className={`radioButton__container flex-1`}
      style={{
        maxWidth: props?.field?.width ? `${props.field.width}%` : "100%",
      }}
    >
      <div className="radioButton__label mb-2 flex gap-1 text-h12 font-semibold">
        {props?.field?.label}
        {props?.field?.isRequired && (
          <div className="radioButton__label--required text-tertiaryRed-5">
            *
          </div>
        )}
      </div>
      <div className="radioButton_options flex gap-2">
        {props?.field?.options?.map((option) => (
          <CustomRadioButton
            name={props?.field?.key}
            value={option?.value}
            key={props?.field?.key + option.value}
            groupName={props?.field?.key}
            checked={
              formFieldsData?.[props?.field?.key]?.filledValue ===
                option.value ||
              computeDefaultRadioButtonValue() === option.value
            }
            label={option?.label}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              handleRadioButtonOnChange({ value: e.target.value });
            }}
          />
        ))}
      </div>
      <div className="radioButton__error text-tiny font-normal text-[#cd0202]">
        {checkIfErrorExists(
          formFieldsData,
          props.field.key,
          props?.field?.readOnly,
        )
          ? `${props.field.validationMessage ?? "This field is required"}`
          : ""}
      </div>
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

export default RenderRadioButtonField;
