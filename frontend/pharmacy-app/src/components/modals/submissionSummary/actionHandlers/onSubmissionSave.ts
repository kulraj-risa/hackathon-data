import { v4 as uuidv4 } from "uuid";
import { updateBigQueryData } from "../../../../api/postCall/updateBigQueryData";
import { NycbsPharmaOrderKeys } from "../../../../enums/nycbsPharmaOrder";

interface OnSubmissionSaveParams {
  data: any;
  qaFilledBy: string;
  secondStpStatus: string;
  caseStatus: string;
  poc: string;
  comments?: string;
  key: string;
  onSuccess: () => void;
  onError: (error: Error) => void;
}

export const onSubmissionSave = async (params: OnSubmissionSaveParams) => {
  const {
    data,
    caseStatus,
    key,
    poc,
    qaFilledBy,
    secondStpStatus,
    onSuccess,
    onError,
  } = params;

  try {
    const identifier =
      data?.[NycbsPharmaOrderKeys.Identifier] || data?.identifier;
    if (!identifier) {
      throw new Error("Identifier not found in data");
    }

    if (!key) {
      throw new Error("CMM Result Key not found");
    }

    const payload = {
      filters: {
        identifier: identifier,
      },
      update_data: {
        covermymed_id: key,
        response_status: caseStatus,
        poc: poc,
        second_stp_status: secondStpStatus,
        qa_filled_by: qaFilledBy,
      },
      request_id: uuidv4(),
    };
    await updateBigQueryData(payload);

    // Call success callback
    onSuccess();
  } catch (error) {
    console.error("Error in submission save:", error);
    onError(error as Error);
  }
};
