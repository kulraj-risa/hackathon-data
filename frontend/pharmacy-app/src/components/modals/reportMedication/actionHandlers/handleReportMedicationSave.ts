import { reportMedicationIssue } from "../../../../api/postCall/reportMedication";

export const handleReportMedicationSave = async (
  orderId: string,
  selectedReason: string,
  medicationName: string,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  onClose: () => void,
) => {
  if (!selectedReason || !medicationName.trim()) {
    return;
  }

  setIsLoading(true);
  try {
    await reportMedicationIssue(
      orderId,
      selectedReason,
      medicationName,
      onClose,
    );
  } catch (error) {
    console.error("Failed to report medication:", error);
  } finally {
    setIsLoading(false);
  }
};
