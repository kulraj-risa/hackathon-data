import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Select, TextInput } from "risa-oasis-ui_v2";
import { usePharmaFormFields } from "../../../../context/pharmaFormFieldsContext";
import { InsurancePlanModel } from "../../../../data-model/pharmaInsuranceModel";
import { NycbsPharmaOrderKeys } from "../../../../enums/nycbsPharmaOrder";
import { RootState } from "../../../../redux/store/store";
import { US_STATES } from "../../utils/stateOptions";

interface PbmNameFormProps {
  isChecked?: boolean;
  onCheckedChange: (value: string) => void;
  areAllFieldsFilled?: (status: boolean) => void;
  onDataChange?: (data: InsurancePlanModel) => void;
}

const PbmNameForm = (props: PbmNameFormProps) => {
  const [planDetails, setPlanDetails] = useState<InsurancePlanModel>({
    [NycbsPharmaOrderKeys.PatientInsuranceState]: "",
    [NycbsPharmaOrderKeys.PlanName]: "",
  });

  const { formFieldsData } = usePharmaFormFields();

  const { data: singleCmmOrderData } = useSelector(
    (state: RootState) => state.cmmSingleOrder,
  );

  const handleInputChange = (data: any) => {
    setPlanDetails((prevState) => ({
      ...prevState,
      [data.name]: data.value,
    }));
  };

  useEffect(() => {
    const filledStatus = checkIfAllFieldsAreFilled();
    props?.areAllFieldsFilled?.(filledStatus);
    props?.onDataChange?.(planDetails);
  }, [planDetails]);

  useEffect(() => {
    if (singleCmmOrderData) {
      setPlanDetails((prevState) => ({
        ...prevState,
        [NycbsPharmaOrderKeys.PatientInsuranceState]:
          formFieldsData?.[NycbsPharmaOrderKeys.PatientInsuranceState]?.[
            "filledValue"
          ] ??
          singleCmmOrderData?.[NycbsPharmaOrderKeys.PatientInsuranceState] ??
          "",
        [NycbsPharmaOrderKeys.PlanName]:
          formFieldsData?.[NycbsPharmaOrderKeys.PlanName]?.["filledValue"] ??
          singleCmmOrderData?.[NycbsPharmaOrderKeys.PlanName] ??
          "",
      }));
    }
  }, [singleCmmOrderData]);

  const checkIfAllFieldsAreFilled = () => {
    const allFields = Object.keys(planDetails);
    return allFields.every((field) => {
      return planDetails[field] && planDetails[field] !== "";
    });
  };
  return (
    <div className="pbm-name-card__container rounded-lg border border-primaryGray-14 p-4">
      <div className="radio-button-group pbm-name">
        <label className="flex items-center gap-2 text-body font-semiBold hover:cursor-pointer">
          <input
            type="radio"
            name="inurance-options"
            value="pbmName"
            checked={props.isChecked}
            onChange={(e) => {
              props.onCheckedChange(e.target.value);
            }}
            className="form-radio h-4 w-4 accent-primaryGray-1"
          />
          <span>Insurance Plan or PBM Name</span>
        </label>
      </div>
      {props?.isChecked && (
        <>
          <div className="dashed-line my-2 border border-dashed border-primaryGray-14">
            {" "}
          </div>
          <div className="pbm-name-form flex flex-col gap-2">
            <div className="pbm-name-form--row-1 flex gap-2">
              <div className="insurance-state-selector flex-1">
                <Select
                  id={NycbsPharmaOrderKeys.PatientInsuranceState}
                  label={"Insurance State"}
                  placeholder={"Select Insurance State"}
                  options={US_STATES}
                  required={true}
                  onOptionChange={(data) => {
                    handleInputChange(data);
                  }}
                  error={
                    planDetails?.[NycbsPharmaOrderKeys.PatientInsuranceState]
                      ? ""
                      : "This field cannot be empty"
                  }
                  defaultValue={
                    planDetails?.[NycbsPharmaOrderKeys.PatientInsuranceState]
                  }
                />
              </div>
              <div className="pbmName-input flex-1">
                <TextInput
                  id={NycbsPharmaOrderKeys.PlanName}
                  label={"Plan or PBM Name"}
                  required
                  error={
                    planDetails?.[NycbsPharmaOrderKeys.PlanName]
                      ? ""
                      : "This field cannot be empty"
                  }
                  onChange={(data) => {
                    handleInputChange(data);
                  }}
                  defaultValue={planDetails?.[NycbsPharmaOrderKeys.PlanName]}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PbmNameForm;
