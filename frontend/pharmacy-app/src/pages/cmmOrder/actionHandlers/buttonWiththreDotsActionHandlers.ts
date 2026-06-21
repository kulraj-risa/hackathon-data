export const handleButtonWithThreeDotsClick = (
  actionId: string,
  orderId: string,
  userEmail?: string,
  onSuccess?: () => void,
  onOpenSendToPlanModal?: (
    orderId: string,
    modalType?: "send_to_plan" | "retry_qa" | "fetch_qa",
  ) => void,
  onOpenRerunModal?: (orderId: string, rerunType: string) => void,
  onNavigate?: (path: string) => void,
  onOpenReportPrescriptionModal?: (orderId: string) => void,
  onOpenReportMedicationModal?: (orderId: string) => void,
) => {
  switch (actionId) {
    case "start_filing":
      break;
    case "send_to_plan":
      if (onOpenSendToPlanModal) {
        onOpenSendToPlanModal(orderId, "send_to_plan");
      }
      break;
    case "fetch_qa":
      if (onOpenSendToPlanModal) {
        onOpenSendToPlanModal(orderId, "fetch_qa");
      }
      break;
    case "retry_qa":
      if (onOpenSendToPlanModal) {
        onOpenSendToPlanModal(orderId, "retry_qa");
      }
      break;
    case "view":
      if (onNavigate) {
        onNavigate(`/pharma-pa-worklists/pharma-pa-outcome/${orderId}`);
      }
      break;
    case "view_clinical":
      if (onNavigate) {
        onNavigate(`/pharma-pa-worklists/pharma-pa-questionaire/${orderId}`);
      }
      break;
    case "rerun_from_onco_emr":
      if (onOpenRerunModal) {
        onOpenRerunModal(orderId, "onco-emr");
      }
      break;
    case "rerun_from_cmm":
      if (onOpenRerunModal) {
        onOpenRerunModal(orderId, "cmm");
      }
      break;
    case "report_prescription_inaccuracy":
      if (onOpenReportPrescriptionModal) {
        onOpenReportPrescriptionModal(orderId);
      }
      break;
    case "report_medication_inaccuracy":
      if (onOpenReportMedicationModal) {
        onOpenReportMedicationModal(orderId);
      }
      break;
    case "report_insurance_inaccuracy":
      break;
    case "report_inaccuracy":
      if (onNavigate) {
        onNavigate(
          `/pharma-pa-worklists/pharma-pa-form/${orderId}?openReportInaccuracy=true`,
        );
      }
      break;
    default:
      break;
  }
};
