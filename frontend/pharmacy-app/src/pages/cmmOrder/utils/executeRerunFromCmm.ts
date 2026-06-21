import { controlToastState } from "risa-oasis-ui_v2";
import { reRunWorkflows } from "../../../api/bigQuery/nycbsPharmaOrders";
import { fetchBqRecordByIdentifier } from "../../../api/bigQuery/paCasesBigQuery";
import { mapBqRowToFlatModel } from "../../../utils/mapBqRowToFlatModel";

export const executeRerunFromCmm = async (
  orderId: string,
  onSuccess?: () => void,
) => {
  try {
    const bqRow = await fetchBqRecordByIdentifier(orderId);

    if (!bqRow) {
      throw new Error("No record found in BigQuery for this order");
    }

    const orderData = mapBqRowToFlatModel(bqRow);

    const drugName =
      orderData?.drug_name?.split(" ")[0] || orderData?.drug_name;

    const payload = {
      drug_name: drugName,
      identifier: orderData?.identifier,
      patient_dob: orderData?.patient_dob,
      is_new_request: false,
      org_id: orderData?.org_id,
    };

    await reRunWorkflows(payload);

    controlToastState("re-run-success-cmm");

    if (onSuccess) {
      onSuccess();
    }
  } catch (error) {
    console.error("Error rerunning from CMM:", error);
    controlToastState("re-run-error");
  }
};
