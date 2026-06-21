import { controlToastState } from "risa-oasis-ui_v2";
import { sendtoPlanRequest } from "../../../api/bigQuery/nycbsPharmaOrders";
import { fetchBqRecordByIdentifier } from "../../../api/bigQuery/paCasesBigQuery";
import { addCmmEvent } from "../../../api/firebase/firestoreService";
import { mapToCoverMyMedsInputModel } from "../../../data-model/cmmInputRequestModel";
import { CmmEvents } from "../../../enums/cmmEvents";
import { ScreenNames } from "../../../enums/screenNames";
import { mapBqRowToFlatModel } from "../../../utils/mapBqRowToFlatModel";

export const executeSendToPlan = async (
  orderId: string,
  userEmail?: string,
  onSuccess?: () => void,
) => {
  try {
    await addCmmEvent(orderId, {
      event: CmmEvents.SEND_TO_PLAN_CLICKED,
      screen_name: ScreenNames.SEND_TO_PLAN_MODAL,
      created_at: new Date(),
      email: userEmail ?? "",
    });

    const bqRow = await fetchBqRecordByIdentifier(orderId);

    if (!bqRow) {
      throw new Error("No record found in BigQuery for this order");
    }

    const cmmInputData = mapToCoverMyMedsInputModel(mapBqRowToFlatModel(bqRow));

    await sendtoPlanRequest(
      cmmInputData,
      orderId,
      "cmm-orders-table",
      userEmail ?? "",
    );

    controlToastState("send-to-plan-success");

    if (onSuccess) {
      onSuccess();
    }
  } catch (error) {
    console.error("Error sending to plan:", error);
    controlToastState("send-to-plan-error");
  }
};
