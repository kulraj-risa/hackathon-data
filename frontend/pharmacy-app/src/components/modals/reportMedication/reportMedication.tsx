import { useState } from "react";
import { Modal, TextInput } from "risa-oasis-ui_v2";
import { ModalId } from "../../../enums/modalId";
import DashedLines from "../../../svg/dashedLines";
import CustomRadioButton from "../../customRadioButton/customRadioButton";
import { handleReportMedicationSave } from "./actionHandlers/handleReportMedicationSave";

interface ReportMedicationProps {
  onClose: () => void;
  orderId: string;
}

const ReportMedication = (props: ReportMedicationProps) => {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [medicationName, setMedicationName] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSave = async () => {
    await handleReportMedicationSave(
      props.orderId,
      selectedReason,
      medicationName,
      setIsLoading,
      props.onClose,
    );
  };

  const isFormValid = selectedReason && medicationName.trim();

  return (
    <Modal
      dialogId={ModalId.REPORT_MEDICATION_INACCURACY_MODAL}
      onSave={handleSave}
      title={"Report Medication Inaccuracy"}
      saveButtonText={isLoading ? "Re-running..." : "Re-run"}
      cancelText={"Cancel"}
      onCancel={props.onClose}
      onClose={props.onClose}
      disableSave={!isFormValid || isLoading}
    >
      <div className="flex flex-col gap-2">
        <div className="text-sm font-semibold text-primaryGray-2">
          Select the Reason
        </div>
        <div>
          <CustomRadioButton
            name="report-medication-reason"
            value="unable-to-find-medication"
            label="Unable to find medication"
            checked={selectedReason === "unable-to-find-medication"}
            onChange={() => setSelectedReason("unable-to-find-medication")}
          />
          <CustomRadioButton
            name="report-medication-reason"
            value="incorrect-drug-name-selected-and-initiated"
            label="Incorrect Drug Name selected and initiated"
            checked={
              selectedReason === "incorrect-drug-name-selected-and-initiated"
            }
            onChange={() =>
              setSelectedReason("incorrect-drug-name-selected-and-initiated")
            }
          />
          <CustomRadioButton
            name="report-medication-reason"
            value="incorrect-strength-or-dosage-form-selected"
            label="Incorrect strength or dosage form selected"
            checked={
              selectedReason === "incorrect-strength-or-dosage-form-selected"
            }
            onChange={() =>
              setSelectedReason("incorrect-strength-or-dosage-form-selected")
            }
          />
        </div>
        <div className="flex flex-row py-2">
          <DashedLines />
          <DashedLines />
        </div>
        <TextInput
          id="other-medication-issue-description"
          label="Enter the Medication Name"
          className="mb-2"
          defaultValue={medicationName}
          onChange={(data) => setMedicationName(data.value)}
        />
      </div>
    </Modal>
  );
};

export default ReportMedication;
