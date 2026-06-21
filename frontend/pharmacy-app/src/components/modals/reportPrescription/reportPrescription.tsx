import { useState } from "react";
import { Modal, TextInput } from "risa-oasis-ui_v2";
import { ModalId } from "../../../enums/modalId";
import DashedLines from "../../../svg/dashedLines";
import CustomRadioButton from "../../customRadioButton/customRadioButton";
import { handleReportPrescriptionSave } from "./actionHandlers/handleReportPrescriptionSave";

interface ReportPrescriptionProps {
  onClose: () => void;
  orderId: string;
}

const ReportPrescription = (props: ReportPrescriptionProps) => {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [prescriptionName, setPrescriptionName] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSave = async () => {
    await handleReportPrescriptionSave(
      props.orderId,
      selectedReason,
      prescriptionName,
      setIsLoading,
      props.onClose,
    );
  };

  const isFormValid = selectedReason && prescriptionName.trim();

  return (
    <Modal
      dialogId={ModalId.REPORT_PRESCRIPTION_MODAL}
      onSave={handleSave}
      title={"Report Prescription"}
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
            name="report-prescription-reason"
            value="unable-to-select-prescription"
            label="Unable to select prescription"
            checked={selectedReason === "unable-to-select-prescription"}
            onChange={() => setSelectedReason("unable-to-select-prescription")}
          />
          <CustomRadioButton
            name="report-prescription-reason"
            value="selected-outdated-or-different-prescription"
            label="Selected an outdated or different prescription"
            checked={
              selectedReason === "selected-outdated-or-different-prescription"
            }
            onChange={() =>
              setSelectedReason("selected-outdated-or-different-prescription")
            }
          />
          <CustomRadioButton
            name="report-prescription-reason"
            value="other-issue"
            label="Other Issue"
            checked={selectedReason === "other-issue"}
            onChange={() => setSelectedReason("other-issue")}
          />
        </div>
        <div className="flex flex-row py-2">
          <DashedLines />
          <DashedLines />
        </div>
        <TextInput
          id="other-issue-description"
          label="Enter the Prescription Name"
          className="mb-2"
          defaultValue={prescriptionName}
          onChange={(data) => setPrescriptionName(data.value)}
        />
      </div>
    </Modal>
  );
};

export default ReportPrescription;
