import { controlToastState } from "risa-oasis-ui_v2";
import { mapBqRowToFlatModel } from "../../utils/mapBqRowToFlatModel";
import { editCoverMyMedsRequest } from "../bigQuery/nycbsPharmaOrders";
import { fetchBqRecordByIdentifier } from "../bigQuery/paCasesBigQuery";

export const reportMedicationIssue = async (
  orderId: string,
  reason: string,
  medicationName: string,
  onClose?: () => void,
) => {
  try {
    const bqRow = await fetchBqRecordByIdentifier(orderId);

    if (!bqRow) {
      throw new Error("No record found in BigQuery for this order");
    }

    const cmmInputData = mapBqRowToFlatModel(bqRow);

    const payload = {
      cover_my_meds_input: {
        ...cmmInputData,
        report_reason: reason,
        cmm_medication_option: medicationName,
      },
      send_to_plan: false,
    };

    controlToastState("re-run-in-progress");

    if (onClose) {
      onClose();
    }

    await editCoverMyMedsRequest(
      payload,
      orderId,
      "Report Medication",
      undefined,
    );

    controlToastState("form-save-success");
  } catch (error) {
    console.error("Error reporting medication:", error);
    controlToastState("re-run-error");
    throw error;
  }
};
