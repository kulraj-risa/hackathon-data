import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { TextInput } from "risa-oasis-ui_v2";
import AutoSelectDropdown from "../../../../components/autoSelectDropdown/autoSelectDropdown";
import { usePharmaFormFields } from "../../../../context/pharmaFormFieldsContext";
import { PharmaPaFormDetailsModel } from "../../../../data-model/pharmaInsuranceModel";
import { NycbsPharmaOrderKeys } from "../../../../enums/nycbsPharmaOrder";
import { RootState } from "../../../../redux/store/store";

interface FormPickerProps {
  areAllFieldsFilled?: (status: boolean) => void;
  onDataChange?: (data: PharmaPaFormDetailsModel) => void;
}
const FormPicker = (props: FormPickerProps) => {
  const { data: singleCmmOrderData } = useSelector(
    (state: RootState) => state.cmmSingleOrder,
  );

  const { data: formOptions } = useSelector(
    (state: RootState) => state.formOptions,
  );

  const { formFieldsData } = usePharmaFormFields();

  const [cardDetails, setCardDetails] = useState<PharmaPaFormDetailsModel>({
    [NycbsPharmaOrderKeys.FormName]: "",
    [NycbsPharmaOrderKeys.CmmResultKey]: "",
  });

  const [formName, setFormName] = useState<string>("");

  const handleInputChange = (data: any) => {
    setCardDetails((prevState) => ({
      ...prevState,
      [data.name]: data.value,
    }));
  };

  const handleFormNameChange = (data: any) => {
    setFormName(data.target.value);
    setCardDetails((prevState) => ({
      ...prevState,
      [NycbsPharmaOrderKeys.FormName]: data.target.value,
    }));
  };

  const computedFormOptions = useMemo(() => {
    const formOptionsArray = formOptions?.find(
      (option) => option.id === "form_name",
    );

    const rawOptions = formOptionsArray?.data ?? [];

    return rawOptions
      .filter(
        (option) => option.label !== undefined && option.value !== undefined,
      )
      .map((option) => ({
        label: option.label ?? "",
        value: option.value ?? "",
      }));
  }, [formOptions]);

  useEffect(() => {
    props?.areAllFieldsFilled?.(true);
    props?.onDataChange?.(cardDetails);
  }, [cardDetails]);

  useEffect(() => {
    if (singleCmmOrderData) {
      setCardDetails((prevState) => ({
        ...prevState,
        [NycbsPharmaOrderKeys.FormName]:
          formFieldsData?.[NycbsPharmaOrderKeys.FormName]?.["filledValue"] ??
          singleCmmOrderData?.[NycbsPharmaOrderKeys.FormName] ??
          "",
        [NycbsPharmaOrderKeys.CmmResultKey]:
          formFieldsData?.[NycbsPharmaOrderKeys.CmmResultKey]?.[
            "filledValue"
          ] ??
          singleCmmOrderData?.[NycbsPharmaOrderKeys.CmmResultKey] ??
          "",
      }));
    }
  }, [singleCmmOrderData]);

  return (
    <div className="pbm-form__container">
      <div className="pbm-form__header mb-2 flex items-center gap-1">
        Form and Key Details
      </div>
      <div className="pbm-form-lists flex flex-col gap-4">
        <div className="pbm-form-lists form-names">
          <AutoSelectDropdown
            id={NycbsPharmaOrderKeys?.FormName}
            options={computedFormOptions}
            minCharLengthForSearch={3}
            defaultValue={cardDetails?.[NycbsPharmaOrderKeys.FormName]}
            label={"Select the Form Name"}
            onOptionSelect={handleInputChange}
          />
        </div>
        <div className="pbm-form-lists cmm-key">
          <TextInput
            id={NycbsPharmaOrderKeys.CmmResultKey}
            label={"Enter the key"}
            onChange={handleInputChange}
          />
        </div>
      </div>
    </div>
  );
};

export default FormPicker;
