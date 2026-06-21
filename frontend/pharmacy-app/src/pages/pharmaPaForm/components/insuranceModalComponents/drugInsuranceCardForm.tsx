import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Select, TextInput } from "risa-oasis-ui_v2";
import { usePharmaFormFields } from "../../../../context/pharmaFormFieldsContext";
import { DrugInsuranceCardModel } from "../../../../data-model/pharmaInsuranceModel";
import { NycbsPharmaOrderKeys } from "../../../../enums/nycbsPharmaOrder";
import { RootState } from "../../../../redux/store/store";
import { US_STATES } from "../../utils/stateOptions";

interface DrugInsuranceCardFormProps {
  isChecked?: boolean;
  onCheckedChange: (value: string) => void;
  areAllFieldsFilled?: (status: boolean) => void;
  onDataChange?: (data: DrugInsuranceCardModel) => void;
}

const DrugInsuranceCardForm = (props: DrugInsuranceCardFormProps) => {
  const [cardDetails, setCardDetails] = useState<DrugInsuranceCardModel>({
    [NycbsPharmaOrderKeys.PatientInsuranceState]: "",
    [NycbsPharmaOrderKeys.PatientRxBin]: "",
    [NycbsPharmaOrderKeys.PatientRxGroup]: "",
    [NycbsPharmaOrderKeys.PatientRxPcn]: "",
  });

  const { data: singleCmmOrderData } = useSelector(
    (state: RootState) => state.cmmSingleOrder,
  );
  const { formFieldsData } = usePharmaFormFields();

  const handleInputChange = (data: any) => {
    setCardDetails((prevState) => ({
      ...prevState,
      [data.name]: data.value,
    }));
  };

  const checkIfAllFieldsAreFilled = () => {
    const allFields = Object.keys(cardDetails);
    return allFields.every((field) => {
      return cardDetails[field] && cardDetails[field] !== "";
    });
  };

  useEffect(() => {
    const filledStatus = checkIfAllFieldsAreFilled();
    props?.areAllFieldsFilled?.(filledStatus);
    props?.onDataChange?.(cardDetails);
  }, [cardDetails]);

  useEffect(() => {
    if (singleCmmOrderData) {
      setCardDetails((prevState) => ({
        ...prevState,
        [NycbsPharmaOrderKeys.PatientInsuranceState]:
          formFieldsData?.[NycbsPharmaOrderKeys.PatientInsuranceState]?.[
            "filledValue"
          ] ??
          singleCmmOrderData?.[NycbsPharmaOrderKeys.PatientInsuranceState] ??
          "",
        [NycbsPharmaOrderKeys.PatientRxBin]:
          formFieldsData?.[NycbsPharmaOrderKeys.PatientRxBin]?.[
            "filledValue"
          ] ??
          singleCmmOrderData?.[NycbsPharmaOrderKeys.PatientRxBin] ??
          "",
        [NycbsPharmaOrderKeys.PatientRxPcn]:
          formFieldsData?.[NycbsPharmaOrderKeys.PatientRxPcn]?.[
            "filledValue"
          ] ??
          singleCmmOrderData?.[NycbsPharmaOrderKeys.PatientRxPcn] ??
          "",
        [NycbsPharmaOrderKeys.PatientRxGroup]:
          formFieldsData?.[NycbsPharmaOrderKeys.PatientRxGroup]?.[
            "filledValue"
          ] ??
          singleCmmOrderData?.[NycbsPharmaOrderKeys.PatientRxGroup] ??
          "",
      }));
    }
  }, [singleCmmOrderData]);

  return (
    <div className="drug-insurance-card__container rounded-lg border border-primaryGray-14 p-4">
      <div className="radio-button-group">
        <label className="flex items-center gap-2 text-body font-semiBold hover:cursor-pointer">
          <input
            type="radio"
            name="inurance-options"
            value="insuranceCard"
            checked={props.isChecked}
            onChange={(e) => {
              props.onCheckedChange(e.target.value);
            }}
            className="form-radio h-4 w-4 accent-primaryGray-1"
          />
          <span>Drug Insurance Card</span>
        </label>
      </div>
      {props?.isChecked && (
        <>
          {" "}
          <div className="dashed-line my-2 border border-dashed border-primaryGray-14">
            {" "}
          </div>
          <div className="drug-insurance-form flex flex-col gap-2">
            <div className="drug-insurance-form--row-1 flex gap-2">
              <div className="insurance-state-selector flex-1">
                <Select
                  id={NycbsPharmaOrderKeys.PatientInsuranceState}
                  label={"Insurance State"}
                  placeholder={"Select Insurance State"}
                  options={US_STATES}
                  required={true}
                  error={
                    cardDetails?.[NycbsPharmaOrderKeys.PatientInsuranceState]
                      ? ""
                      : "This field cannot be empty"
                  }
                  onOptionChange={(data) => {
                    handleInputChange(data);
                  }}
                  defaultValue={
                    cardDetails?.[NycbsPharmaOrderKeys.PatientInsuranceState]
                  }
                />
              </div>
              <div className="rxbin-input flex-1">
                <TextInput
                  id={NycbsPharmaOrderKeys.PatientRxBin}
                  label={"RxBin"}
                  required
                  error={
                    cardDetails?.[NycbsPharmaOrderKeys.PatientRxBin]
                      ? ""
                      : "This field cannot be empty"
                  }
                  onChange={(data) => {
                    handleInputChange(data);
                  }}
                  defaultValue={
                    cardDetails?.[NycbsPharmaOrderKeys.PatientRxBin]
                  }
                />
              </div>
            </div>
            <div className="drug-insurance-form--row-2 flex gap-2">
              <div className="rxpcn-input flex-1">
                <TextInput
                  id={NycbsPharmaOrderKeys.PatientRxPcn}
                  label={"RxPCN"}
                  required
                  error={
                    cardDetails?.[NycbsPharmaOrderKeys.PatientRxPcn]
                      ? ""
                      : "This field cannot be empty"
                  }
                  onChange={(data) => {
                    handleInputChange(data);
                  }}
                  defaultValue={
                    cardDetails?.[NycbsPharmaOrderKeys.PatientRxPcn]
                  }
                />
              </div>
              <div className="rxgroup-input flex-1">
                <TextInput
                  id={NycbsPharmaOrderKeys.PatientRxGroup}
                  label={"RxGroup"}
                  required
                  error={
                    cardDetails?.[NycbsPharmaOrderKeys.PatientRxGroup]
                      ? ""
                      : "This field cannot be empty"
                  }
                  onChange={(data) => {
                    handleInputChange(data);
                  }}
                  defaultValue={
                    cardDetails?.[NycbsPharmaOrderKeys.PatientRxGroup]
                  }
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DrugInsuranceCardForm;
