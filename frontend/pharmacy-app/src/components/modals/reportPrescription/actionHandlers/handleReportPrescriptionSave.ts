import { reportPrescriptionIssue } from "../../../../api/postCall/reportPrescription";

export const handleReportPrescriptionSave = async (
  orderId: string,
  selectedReason: string,
  prescriptionName: string,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  onClose: () => void,
) => {
  if (!selectedReason || !prescriptionName.trim()) {
    return;
  }

  setIsLoading(true);
  try {
    await reportPrescriptionIssue(orderId, selectedReason, prescriptionName);
    onClose();
  } catch (error) {
    console.error("Failed to report prescription:", error);
  } finally {
    setIsLoading(false);
  }
};
