import { CmmStpStatus } from "../../../../enums/cmmStpStatus";

export const getTextColorForStpStatus = (status: CmmStpStatus) => {
  if (status === CmmStpStatus.APPROVED) return "#005D49";
  if (status === CmmStpStatus.SENT_TO_PLAN) return "#005D49";
  if (status === CmmStpStatus.DENIED) return "#CC0300";
  if (status === CmmStpStatus.PENDING) return "#C24400";
  if (status === CmmStpStatus.AUTH_NOT_REQUIRED) return "#005D49";
  if (status === CmmStpStatus.APPROVAL_ON_FILE) return "#005D49";
  if (status === CmmStpStatus.DENIAL_ON_FILE) return "#CC0300";
  if (status === CmmStpStatus.CASE_ON_FILE) return "#0056D6";
  if (status === CmmStpStatus.NOT_CORRECT_PROCESSOR) return "#A030A0";
  if (status === CmmStpStatus.DRUG_NOT_COVERED) return "#CC0300";
  if (status === CmmStpStatus.NA_OUTCOME) return "#666666";
  if (status === CmmStpStatus.WAITING_FOR_CLINICAL) return "#665D00";
  if (status === CmmStpStatus.ONSHORE_ASSISTANCE) return "#C24400";
  return "#666666";
};

export const getBgColorForStpStatus = (status: CmmStpStatus) => {
  if (status === CmmStpStatus.APPROVED) return "#E6F3F0";
  if (status === CmmStpStatus.SENT_TO_PLAN) return "#E6F3F0";
  if (status === CmmStpStatus.DENIED) return "#FFE8E8";
  if (status === CmmStpStatus.PENDING) return "#FFF3E6";
  if (status === CmmStpStatus.AUTH_NOT_REQUIRED) return "#E6F3F0";
  if (status === CmmStpStatus.APPROVAL_ON_FILE) return "#E6F3F0";
  if (status === CmmStpStatus.DENIAL_ON_FILE) return "#FFE8E8";
  if (status === CmmStpStatus.CASE_ON_FILE) return "#E6F0FF";
  if (status === CmmStpStatus.NOT_CORRECT_PROCESSOR) return "#F5EBFF";
  if (status === CmmStpStatus.DRUG_NOT_COVERED) return "#FFE8E8";
  if (status === CmmStpStatus.NA_OUTCOME) return "#F5F5F5";
  if (status === CmmStpStatus.WAITING_FOR_CLINICAL) return "#FFFBEB";
  if (status === CmmStpStatus.ONSHORE_ASSISTANCE) return "#FFF3E6";
  return "#F5F5F5";
};

export const getTextForStpStatus = (status: CmmStpStatus) => {
  if (status === CmmStpStatus.APPROVED) return "Approved";
  if (status === CmmStpStatus.SENT_TO_PLAN) return "Sent to plan";
  if (status === CmmStpStatus.DENIED) return "Denied";
  if (status === CmmStpStatus.PENDING) return "Pending";
  if (status === CmmStpStatus.AUTH_NOT_REQUIRED) return "Auth Not Required";
  if (status === CmmStpStatus.APPROVAL_ON_FILE) return "Approval on file";
  if (status === CmmStpStatus.DENIAL_ON_FILE) return "Denial on file";
  if (status === CmmStpStatus.CASE_ON_FILE) return "Case on file";
  if (status === CmmStpStatus.NOT_CORRECT_PROCESSOR)
    return "Not Correct Processor";
  if (status === CmmStpStatus.DRUG_NOT_COVERED) return "Drug Not Covered";
  if (status === CmmStpStatus.NA_OUTCOME) return "NA Outcome";
  if (status === CmmStpStatus.WAITING_FOR_CLINICAL)
    return "Waiting For Clinical";
  if (status === CmmStpStatus.ONSHORE_ASSISTANCE) return "Onshore Assistance";
  return status;
};

export const getStpStatusBadge = (
  status: string,
): { text: string; color: string; bgColor: string } => {
  if (status === CmmStpStatus.APPROVED) {
    return {
      text: getTextForStpStatus(CmmStpStatus.APPROVED),
      color: getTextColorForStpStatus(CmmStpStatus.APPROVED),
      bgColor: getBgColorForStpStatus(CmmStpStatus.APPROVED),
    };
  }
  if (status === CmmStpStatus.SENT_TO_PLAN) {
    return {
      text: getTextForStpStatus(CmmStpStatus.SENT_TO_PLAN),
      color: getTextColorForStpStatus(CmmStpStatus.SENT_TO_PLAN),
      bgColor: getBgColorForStpStatus(CmmStpStatus.SENT_TO_PLAN),
    };
  }
  if (status === CmmStpStatus.DENIED) {
    return {
      text: getTextForStpStatus(CmmStpStatus.DENIED),
      color: getTextColorForStpStatus(CmmStpStatus.DENIED),
      bgColor: getBgColorForStpStatus(CmmStpStatus.DENIED),
    };
  }
  if (status === CmmStpStatus.PENDING) {
    return {
      text: getTextForStpStatus(CmmStpStatus.PENDING),
      color: getTextColorForStpStatus(CmmStpStatus.PENDING),
      bgColor: getBgColorForStpStatus(CmmStpStatus.PENDING),
    };
  }
  if (status === CmmStpStatus.AUTH_NOT_REQUIRED) {
    return {
      text: getTextForStpStatus(CmmStpStatus.AUTH_NOT_REQUIRED),
      color: getTextColorForStpStatus(CmmStpStatus.AUTH_NOT_REQUIRED),
      bgColor: getBgColorForStpStatus(CmmStpStatus.AUTH_NOT_REQUIRED),
    };
  }
  if (status === CmmStpStatus.APPROVAL_ON_FILE) {
    return {
      text: getTextForStpStatus(CmmStpStatus.APPROVAL_ON_FILE),
      color: getTextColorForStpStatus(CmmStpStatus.APPROVAL_ON_FILE),
      bgColor: getBgColorForStpStatus(CmmStpStatus.APPROVAL_ON_FILE),
    };
  }
  if (status === CmmStpStatus.DENIAL_ON_FILE) {
    return {
      text: getTextForStpStatus(CmmStpStatus.DENIAL_ON_FILE),
      color: getTextColorForStpStatus(CmmStpStatus.DENIAL_ON_FILE),
      bgColor: getBgColorForStpStatus(CmmStpStatus.DENIAL_ON_FILE),
    };
  }
  if (status === CmmStpStatus.CASE_ON_FILE) {
    return {
      text: getTextForStpStatus(CmmStpStatus.CASE_ON_FILE),
      color: getTextColorForStpStatus(CmmStpStatus.CASE_ON_FILE),
      bgColor: getBgColorForStpStatus(CmmStpStatus.CASE_ON_FILE),
    };
  }
  if (status === CmmStpStatus.NOT_CORRECT_PROCESSOR) {
    return {
      text: getTextForStpStatus(CmmStpStatus.NOT_CORRECT_PROCESSOR),
      color: getTextColorForStpStatus(CmmStpStatus.NOT_CORRECT_PROCESSOR),
      bgColor: getBgColorForStpStatus(CmmStpStatus.NOT_CORRECT_PROCESSOR),
    };
  }
  if (status === CmmStpStatus.DRUG_NOT_COVERED) {
    return {
      text: getTextForStpStatus(CmmStpStatus.DRUG_NOT_COVERED),
      color: getTextColorForStpStatus(CmmStpStatus.DRUG_NOT_COVERED),
      bgColor: getBgColorForStpStatus(CmmStpStatus.DRUG_NOT_COVERED),
    };
  }
  if (status === CmmStpStatus.NA_OUTCOME) {
    return {
      text: getTextForStpStatus(CmmStpStatus.NA_OUTCOME),
      color: getTextColorForStpStatus(CmmStpStatus.NA_OUTCOME),
      bgColor: getBgColorForStpStatus(CmmStpStatus.NA_OUTCOME),
    };
  }
  if (status === CmmStpStatus.WAITING_FOR_CLINICAL) {
    return {
      text: getTextForStpStatus(CmmStpStatus.WAITING_FOR_CLINICAL),
      color: getTextColorForStpStatus(CmmStpStatus.WAITING_FOR_CLINICAL),
      bgColor: getBgColorForStpStatus(CmmStpStatus.WAITING_FOR_CLINICAL),
    };
  }
  if (status === CmmStpStatus.ONSHORE_ASSISTANCE) {
    return {
      text: getTextForStpStatus(CmmStpStatus.ONSHORE_ASSISTANCE),
      color: getTextColorForStpStatus(CmmStpStatus.ONSHORE_ASSISTANCE),
      bgColor: getBgColorForStpStatus(CmmStpStatus.ONSHORE_ASSISTANCE),
    };
  }
  return {
    text: status,
    color: "#666666",
    bgColor: "#F5F5F5",
  };
};
