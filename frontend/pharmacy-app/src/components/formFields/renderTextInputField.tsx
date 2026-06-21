import { useCallback, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { InfoIconWithTooltip, TextInput } from "risa-oasis-ui_v2";
import { logEventToBigQuery } from "../../api/postCall/logEventToBigQueryNew";
import { usePharmaFormFields } from "../../context/pharmaFormFieldsContext";
import { FormField } from "../../data-model/pharmaPaFormModel";
import { NycbsPharmaOrderKeys } from "../../enums/nycbsPharmaOrder";
import { checkIfErrorExists } from "../../pages/pharmaPaForm/utils/checkIfErrorExists";
import { RootState } from "../../redux/store/store";
import { getNestedValue } from "../../utils/getNestedValue";
import {
  formatPhoneNumber,
  unformatPhoneNumber,
} from "../../utils/stringModifications";

interface RenderFieldsProps {
  field: FormField;
  fieldDetails?: Record<string, any>;
  data?: any;
  originalData?: any;
  shouldEmitLogEvent?: boolean;
}

const RenderTextInputField = (props: RenderFieldsProps) => {
  const { formFieldsData, setFormFieldsData, resetFormFieldsData } =
    usePharmaFormFields();

  const { user } = useSelector(
    (state: RootState) => state.firebaseAuthentication,
  );

  // Ref to store the timeout ID for debouncing
  const logEventTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const initialDataValue = getNestedValue(props?.data, props.field.key) ?? "";

  const shouldFormatText = () => {
    if (
      props?.field?.key.toLowerCase().includes("phone") ||
      props?.field?.key.toLowerCase().includes("fax")
    ) {
      return true;
    }

    return false;
  };

  const debouncedLogEvent = useCallback((eventData: any) => {
    if (logEventTimeoutRef.current) {
      clearTimeout(logEventTimeoutRef.current);
    }
    logEventTimeoutRef.current = setTimeout(() => {
      logEventToBigQuery(eventData);
      logEventTimeoutRef.current = null;
    }, 850);
  }, []);

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (logEventTimeoutRef.current) {
        clearTimeout(logEventTimeoutRef.current);
      }
    };
  }, []);

  const handleTextFieldOnChange = (data) => {
    const originalDataValue =
      getNestedValue(props?.originalData, props.field.key) ?? "";

    const dataToUpdateInBackend = shouldFormatText()
      ? unformatPhoneNumber(data.value)
      : data.value;
    setFormFieldsData({
      ...formFieldsData,
      [props.field.key]: {
        ...formFieldsData[props.field.key],
        filledValue: dataToUpdateInBackend !== "" ? dataToUpdateInBackend : "",
        isFieldDirty: originalDataValue != dataToUpdateInBackend,
      },
    });
  };

  const computeDefaultInputValue = () => {
    if (props?.field?.readOnly) {
      return formFieldsData?.[props?.field?.key]?.filledValue ?? "";
    }
    if (initialDataValue && initialDataValue !== "") {
      return initialDataValue;
    } else {
      return props?.field?.default || "";
    }
  };

  return (
    <div
      key={props?.field?.key}
      className={`text-field__container flex-1`}
      style={{
        maxWidth: props?.field?.width ? `${props.field.width}%` : "100%",
      }}
    >
      <TextInput
        id={props?.field?.key}
        label={props?.field?.label}
        defaultValue={computeDefaultInputValue()}
        required={props?.field?.readOnly ? false : props?.field?.isRequired}
        readOnly={props?.field?.readOnly}
        error={
          checkIfErrorExists(
            formFieldsData,
            props?.field?.key,
            props?.field?.readOnly,
          )
            ? `${props?.field?.validationMessage ?? "This field is required"}`
            : ""
        }
        onChange={(data) => handleTextFieldOnChange(data)}
        placeholder={props?.field?.placeholder ?? ""}
        formatInput={shouldFormatText() ? formatPhoneNumber : undefined}
        labelSuffix={
          (props?.field?.key === "patient_member_id" &&
            formFieldsData?.[NycbsPharmaOrderKeys.PatientEligibilityCheckStatus]
              ?.filledValue && (
              <InfoIconWithTooltip
                content={
                  formFieldsData?.[
                    NycbsPharmaOrderKeys.PatientEligibilityCheckStatus
                  ]?.filledValue
                }
                directionToDisplay="right"
              />
            )) ||
          (props?.field?.key === "drug_quantity" &&
            formFieldsData?.[NycbsPharmaOrderKeys.DrugFetchedFrom]
              ?.filledValue && (
              <InfoIconWithTooltip
                content={
                  formFieldsData?.[NycbsPharmaOrderKeys.DrugFetchedFrom]
                    ?.filledValue
                }
                directionToDisplay="right"
              />
            ))
        }
      />
      {(props?.field?.additionalInfoHeader ||
        props?.field?.additionalInfoContent) && (
        <div className="section-additonal-info mt-2 flex w-full flex-col gap-2 bg-secondaryYellow-11 p-3">
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

export default RenderTextInputField;
