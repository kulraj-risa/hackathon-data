import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Modal, openModal } from "risa-oasis-ui_v2";
import { usePharmaFormFields } from "../../../context/pharmaFormFieldsContext";
import {
  DrugInsuranceCardModel,
  InsurancePlanModel,
  PharmaPaFormDetailsModel,
} from "../../../data-model/pharmaInsuranceModel";
import { NycbsPharmaOrderKeys } from "../../../enums/nycbsPharmaOrder";
import DrugInsuranceCardForm from "../../../pages/pharmaPaForm/components/insuranceModalComponents/drugInsuranceCardForm";
import FormPicker from "../../../pages/pharmaPaForm/components/insuranceModalComponents/formPicker";
import PbmNameForm from "../../../pages/pharmaPaForm/components/insuranceModalComponents/pbmNameForm";
import { getUpdatedFormDataWithFilledValues } from "../../../pages/pharmaPaForm/utils/getUpdatedFormDataWithFilledValues";
import { AppDispatch, RootState } from "../../../redux/store/store";

interface InsuranceModalProps {
  isModalOpen: (isOpen: boolean) => void;
  id: string;
  docId: string;
  shouldUpdateCmmSingleOrder?: boolean;
}

const InsuranceModal = (props: InsuranceModalProps) => {
  const [selectedRadioButton, setSelectedRadioButton] = useState<string>("");

  const { formFieldsData, setFormFieldsData, shouldRefetchData } =
    usePharmaFormFields();
  const [pbmFormSelectedOption, setPbmFormSelectedOption] =
    useState<string>("");
  const dispatch = useDispatch<AppDispatch>();
  const [cardDetails, setCardDetails] = useState<DrugInsuranceCardModel>({});
  const [planDetails, setPlanDetails] = useState<InsurancePlanModel>({});
  const [formDetails, setFormDetails] = useState<PharmaPaFormDetailsModel>({});
  const [isAllFieldsPopulated, setIsAllFieldsPopulated] = useState({
    cardDetailsForm: false,
    pbmNameForm: false,
    formDetails: false,
  });
  const { data: singleCmmOrderData } = useSelector(
    (state: RootState) => state.cmmSingleOrder,
  );

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    openModal("insurance-modal");
  }, []);

  const checkIfSaveButtonShouldBeDisabled = () => {
    if (selectedRadioButton === "" || !isAllFieldsPopulated.formDetails) {
      return true;
    }
    if (selectedRadioButton === "insuranceCard") {
      return !isAllFieldsPopulated.cardDetailsForm;
    }
    if (selectedRadioButton === "pbmName") {
      return !isAllFieldsPopulated.pbmNameForm;
    }
    return false;
  };
  const saveUpdatedInsuranceDetails = async () => {
    const data =
      selectedRadioButton === "insuranceCard" ? cardDetails : planDetails;
    const dataToBeOmitted =
      selectedRadioButton === "insuranceCard" ? planDetails : cardDetails;
    const keysToBeOmitted = Object.keys(dataToBeOmitted);
    const referenceData = shouldRefetchData
      ? getUpdatedFormDataWithFilledValues(formFieldsData)
      : singleCmmOrderData;
    const modifiedData = Object.fromEntries(
      Object.entries(referenceData ?? {}).map(([key, value]) =>
        keysToBeOmitted.includes(key)
          ? [key, ""]
          : Object.keys(data).includes(key)
            ? [key, data[key]]
            : [key, value],
      ),
    );
    const updatedData = {
      ...modifiedData,
      ...data,
      ...formDetails,
    };

    const updatedFormFieldsData = { ...formFieldsData };
    Object.keys(updatedData).forEach((key) => {
      updatedFormFieldsData[key] = {
        ...formFieldsData[key],
        filledValue: updatedData[key],
        isFieldDirty: updatedData[key] != singleCmmOrderData?.[key],
      };
    });
    setFormFieldsData((prev) => {
      return {
        ...prev,
        ...updatedFormFieldsData,
      };
    });
    // dispatch(updateCmmSingleOrder(updatedData));
    props.isModalOpen(false);
  };
  useEffect(() => {
    if (singleCmmOrderData) {
      const formName =
        formFieldsData?.[NycbsPharmaOrderKeys.FormName]?.["filledValue"] ??
        singleCmmOrderData?.[NycbsPharmaOrderKeys.FormName];
      const planName =
        formFieldsData?.[NycbsPharmaOrderKeys.PlanName]?.["filledValue"] ??
        singleCmmOrderData?.[NycbsPharmaOrderKeys.PlanName];
      if (formName) {
        setPbmFormSelectedOption(formName);
      }
      if (planName) {
        setSelectedRadioButton("pbmName");
      } else {
        setSelectedRadioButton("insuranceCard");
      }
    }
  }, [singleCmmOrderData]);
  return (
    <Modal
      dialogId={"insurance-modal"}
      onSave={saveUpdatedInsuranceDetails}
      title={"Insurance Details"}
      saveButtonText={loading ? "Saving..." : "Save"}
      cancelText={"Cancel"}
      disableSave={checkIfSaveButtonShouldBeDisabled() || loading}
      onClose={() => props.isModalOpen(false)}
      heightPercentage={60}
    >
      <div className="modal-container flex flex-col gap-2">
        {/* Drug Insurance Card Form */}
        <div className="drug-insurance-card">
          <DrugInsuranceCardForm
            isChecked={selectedRadioButton === "insuranceCard"}
            onCheckedChange={(value) => setSelectedRadioButton(value)}
            areAllFieldsFilled={(status) => {
              setIsAllFieldsPopulated((prevState) => ({
                ...prevState,
                cardDetailsForm: status,
              }));
            }}
            onDataChange={(data) => setCardDetails(data)}
          />
        </div>

        <div className="or-container my-4 flex items-center">
          <div className="flex-1 border-t border-gray-300"></div>
          <div className="px-4 text-gray-500">Or</div>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>
        <div className="pbm-name">
          <PbmNameForm
            isChecked={selectedRadioButton === "pbmName"}
            onCheckedChange={(value) => setSelectedRadioButton(value)}
            areAllFieldsFilled={(status) => {
              setIsAllFieldsPopulated((prevState) => ({
                ...prevState,
                pbmNameForm: status,
              }));
            }}
            onDataChange={(data) => setPlanDetails(data)}
          />
        </div>
        <div className="or-container my-4 flex items-center">
          <div className="flex-1 border-t border-gray-300"></div>
        </div>
        <div className="pick-form text-body font-bold">
          <FormPicker
            areAllFieldsFilled={(status) => {
              setIsAllFieldsPopulated((prevState) => ({
                ...prevState,
                formDetails: status,
              }));
            }}
            onDataChange={(data) => setFormDetails(data)}
          />
        </div>
      </div>
    </Modal>
  );
};

export default InsuranceModal;
