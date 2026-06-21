import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { getIcdDescription } from "../../api/icdDescription/getIcdDescription";
import { logEventToBigQuery } from "../../api/postCall/logEventToBigQueryNew";
import { usePharmaFormFields } from "../../context/pharmaFormFieldsContext";
import { DropdownField } from "../../data-model/pharmaPaFormModel";
import { MedicalPaKeys } from "../../enums/medicalPaKeys";
import { NycbsPharmaOrderKeys } from "../../enums/nycbsPharmaOrder";
import { RootState } from "../../redux/store/store";
import { getNestedValue } from "../../utils/getNestedValue";
import AutoSelectDropdown from "../autoSelectDropdown/autoSelectDropdown";

interface DropDownFieldProps {
  field: DropdownField;
  fieldDetails?: Record<string, any>;
  data?: any;
  originalData?: any;
  shouldEmitLogEvent?: boolean;
}

const RenderAutoSelectField = (props: DropDownFieldProps) => {
  const { formFieldsData, setFormFieldsData, resetFormFieldsData } =
    usePharmaFormFields();
  const { user } = useSelector(
    (state: RootState) => state.firebaseAuthentication,
  );

  const { data: formOptions } = useSelector(
    (state: RootState) => state.formOptions,
  );

  const [signalForLogEvent, setSignalForLogEvent] = useState<boolean>(false);

  const initialDataValue = getNestedValue(props?.data, props.field.key) ?? "";

  const debounceTimerRef = useRef<NodeJS.Timeout>();

  const logEventTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
  const determineIfFieldisRequired = () => {
    if (props?.field?.key === NycbsPharmaOrderKeys.PrimaryDiagnoses) {
      const isFieldRequiredInCmm =
        formFieldsData?.[NycbsPharmaOrderKeys.IsDiagnosisCodeAvailableOnForm]?.[
          "filledValue"
        ];
      return isFieldRequiredInCmm;
    }
    return props?.field?.isRequired;
  };

  const debouncedGetIcdDescription = useCallback(
    async (value: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        const icdCodeAfterDecimal = value.split(".")[0];
        const descriptionViaApi =
          icdCodeAfterDecimal && icdCodeAfterDecimal.length > 0
            ? await getIcdDescription(value)
            : "";

        setFormFieldsData((prevState) => {
          const updatedState = { ...prevState };
          const updateFieldValue = (key, value) => {
            updatedState[key] = {
              ...updatedState[key],
              filledValue: value,
            };
          };

          if (props?.field?.key === NycbsPharmaOrderKeys.PrimaryDiagnoses) {
            updateFieldValue(
              NycbsPharmaOrderKeys.PrimaryDiagnosesDescription,
              descriptionViaApi,
            );
          } else if (
            props?.field?.key === NycbsPharmaOrderKeys.SecondaryDiagnoses
          ) {
            updateFieldValue(
              NycbsPharmaOrderKeys.SecondaryDiagnosesDescription,
              descriptionViaApi,
            );
          } else if (props?.field?.key === MedicalPaKeys.PrimaryIcdCode) {
            updateFieldValue(
              MedicalPaKeys.PrimaryIcdCodeDescription,
              descriptionViaApi,
            );
          } else if (props?.field?.key.includes(MedicalPaKeys.IcdCode)) {
            const key = props?.field?.key.split(MedicalPaKeys.IcdCode)[0];
            const descriptionKey = `${key}${MedicalPaKeys.IcdCodeDescription}`;
            updateFieldValue(descriptionKey, descriptionViaApi);
          }

          return updatedState;
        });
      }, 1000);
    },
    [props?.field?.key, setFormFieldsData],
  );

  const debouncedLogEvent = useCallback((eventData: any) => {
    if (logEventTimeoutRef.current) {
      clearTimeout(logEventTimeoutRef.current);
    }
    logEventTimeoutRef.current = setTimeout(() => {
      logEventToBigQuery(eventData);
      logEventTimeoutRef.current = null;
    }, 850);
  }, []);

  const handleAutoSelectonChange = useCallback(
    async (data) => {
      setFormFieldsData((prevState) => {
        const updatedState = { ...prevState };
        const originalDataValue =
          getNestedValue(props?.originalData, props.field.key) ?? "";
        const updateFieldValue = (key, value) => {
          updatedState[key] = {
            ...updatedState[key],
            filledValue: value,
            isFieldDirty: originalDataValue != value,
          };
        };

        updateFieldValue(props.field.key, data.value !== "" ? data.value : "");

        switch (props?.field?.key) {
          case NycbsPharmaOrderKeys.PrimaryDiagnoses:
          case NycbsPharmaOrderKeys.SecondaryDiagnoses:
          case MedicalPaKeys.PrimaryIcdCode:
            debouncedGetIcdDescription(data.value);
            break;

          case NycbsPharmaOrderKeys.DrugName:
            updateFieldValue(
              NycbsPharmaOrderKeys.MedicationDrugName,
              data?.value ?? "",
            );
            break;

          default:
            if (props?.field?.key.includes(MedicalPaKeys.IcdCode)) {
              debouncedGetIcdDescription(data.value);
            }
            break;
        }

        return updatedState;
      });
    },
    [props, debouncedGetIcdDescription, setFormFieldsData],
  );

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div
      key={props?.field?.key}
      className={`auto-select-field__container flex-1`}
      style={{
        maxWidth: props?.field?.width ? `${props.field.width}%` : "100%",
      }}
    >
      <AutoSelectDropdown
        id={props?.field?.key}
        options={props?.field?.options}
        required={determineIfFieldisRequired()}
        label={props?.field?.label}
        onOptionSelect={(data) => handleAutoSelectonChange(data)}
        defaultValue={computeDefaultSelectValue()}
        minCharLengthForSearch={2}
        shouldEmitLogEvent={(shouldEmitLogEvent) =>
          setSignalForLogEvent(shouldEmitLogEvent)
        }
      />
      {props?.field?.key === NycbsPharmaOrderKeys.PrimaryDiagnoses &&
        !determineIfFieldisRequired() && (
          <div className="section-additonal-info mt-2 flex w-full flex-col gap-2 bg-secondaryYellow-11 p-3">
            <div className="section-additonal-info__header text-tiny font-bold">
              {props?.field?.additionalInfoHeader ??
                "Diagnosis code is not needed"}
            </div>
          </div>
        )}
      {props?.field?.key === NycbsPharmaOrderKeys.SecondaryDiagnoses &&
        !props?.data?.[
          NycbsPharmaOrderKeys.IsSecondaryDiagnosisCodeAvailableOnForm
        ] && (
          <div className="section-additonal-info mt-2 flex w-full flex-col gap-2 bg-secondaryYellow-11 p-3">
            <div className="section-additonal-info__header text-tiny font-bold">
              {props?.field?.additionalInfoHeader ??
                "Secondary diagnosis code is not needed"}
            </div>
          </div>
        )}
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

export default RenderAutoSelectField;
