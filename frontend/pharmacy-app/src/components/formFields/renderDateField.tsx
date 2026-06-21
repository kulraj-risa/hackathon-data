import moment from "moment";
import { useSelector } from "react-redux";
import { DateInput } from "risa-oasis-ui_v2";
import { usePharmaFormFields } from "../../context/pharmaFormFieldsContext";
import { DateField } from "../../data-model/pharmaPaFormModel";
import { checkIfErrorExists } from "../../pages/pharmaPaForm/utils/checkIfErrorExists";
import { RootState } from "../../redux/store/store";
import { getNestedValue } from "../../utils/getNestedValue";

interface DateFieldProps {
  field: DateField;
  fieldDetails?: Record<string, any>;
  data?: any;
  originalData?: any;
  shouldEmitLogEvent?: boolean;
}

const RenderDateField = (props: DateFieldProps) => {
  const { formFieldsData, setFormFieldsData, resetFormFieldsData } =
    usePharmaFormFields();

  const { user } = useSelector(
    (state: RootState) => state.firebaseAuthentication,
  );

  const initialDataValue = getNestedValue(props?.data, props.field.key) ?? "";

  const computeDefaultDateValue = () => {
    if (props?.field?.readOnly) {
      return formFieldsData?.[props?.field?.key]?.filledValue ?? "";
    }
    if (initialDataValue && initialDataValue !== "") {
      return initialDataValue;
    } else {
      return props?.field?.default || "";
    }
  };
  const handleDateFieldOnChange = (data) => {
    const originalDataValue =
      getNestedValue(props?.originalData, props.field.key) ?? "";
    const isFieldDirty = data.value != originalDataValue;
    setFormFieldsData({
      ...formFieldsData,
      [props?.field?.key]: {
        ...formFieldsData[props?.field?.key],
        filledValue: data.value !== "" ? data.value : "",
        isFieldDirty,
      },
    });
  };

  return (
    <>
      <div
        key={props?.field?.key}
        className={`date-field__container flex-1`}
        style={{
          maxWidth: props?.field?.width ? `${props.field.width}%` : "100%",
        }}
      >
        <DateInput
          id={props?.field?.key}
          label={props?.field?.label}
          defaultValue={
            computeDefaultDateValue()
              ? moment(computeDefaultDateValue()).format("MM/DD/YYYY")
              : ""
          }
          required={props?.field?.isRequired}
          format={"MM/DD/YYYY"}
          error={
            checkIfErrorExists(
              formFieldsData,
              props.field.key,
              props?.field?.readOnly,
            )
              ? `${props?.field?.validationMessage ?? "This field is required"}`
              : ""
          }
          onChange={(data) =>
            handleDateFieldOnChange({
              ...data,
              value: moment(data.value).format("MM/DD/YYYY"),
            })
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
    </>
  );
};

export default RenderDateField;
