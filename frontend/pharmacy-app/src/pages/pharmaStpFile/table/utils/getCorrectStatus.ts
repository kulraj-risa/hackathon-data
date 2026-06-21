import { CmmResponseStatus } from "../../../../enums/cmmResponseStatus";

export const getTextColorForCmmResponseStatus = (status: CmmResponseStatus) => {
  if (status === CmmResponseStatus.APPROVED) return "#005D49";
  if (status === CmmResponseStatus.PENDING) return "#C24400";
  if (status === CmmResponseStatus.COMPLETED) return "#005D49";
  if (status === CmmResponseStatus.APPROVAL_ON_FILE) return "#005D49";
  if (status === CmmResponseStatus.DRUG_NOT_COVERED) return "#CC0300";
  if (status === CmmResponseStatus.DENIAL_ON_FILE) return "#CC0300";
  if (status === CmmResponseStatus.INACCURACY) return "#0056D6";
  if (status === CmmResponseStatus.IN_PROGRESS) return "#665D00";
  if (status === CmmResponseStatus.FORM_ERROR) return "#CC0300";
  if (status === CmmResponseStatus.FORM_FILLED) return "#C24400";
  if (status === CmmResponseStatus.SENDING_TO_PLAN) return "#A030A0";
  if (status === CmmResponseStatus.SENT_TO_PLAN) return "#CC0300";
  if (status === CmmResponseStatus.QA_IN_PROGRESS) return "#665D00";
  if (status === CmmResponseStatus.QA_ERROR) return "#CC0300";
  if (status === CmmResponseStatus.QA_FETCHED) return "#0056D6";
  if (status === CmmResponseStatus.VERIFIED) return "#005D49";
  if (status === CmmResponseStatus.DENIED) return "#CC0300";
  if (status === CmmResponseStatus.UNSPECIFIED) return "#666666";
  if (status === CmmResponseStatus.AUTH_ON_FILE) return "#0056D6";
  if (status === CmmResponseStatus.AUTH_NOT_REQUIRED) return "#005D49";
  if (status === CmmResponseStatus.ONSHORE_ASSISTANCE) return "#7B1FA2";
  if (status === CmmResponseStatus.WAITING_FOR_CLINICAL) return "#4B0082";
  if (status === CmmResponseStatus.NA_OUTCOME) return "#5D4037";
  if (status === CmmResponseStatus.NOT_CORRECT_PROCESSOR) return "#8B4513";
  return "#111111";
};
export const getBgColorForCmmResponseStatus = (status: CmmResponseStatus) => {
  if (status === CmmResponseStatus.APPROVED) return "#E6F3F0";
  if (status === CmmResponseStatus.PENDING) return "#FFF3E6";
  if (status === CmmResponseStatus.COMPLETED) return "#E6F3F0";
  if (status === CmmResponseStatus.APPROVAL_ON_FILE) return "#E6F3F0";
  if (status === CmmResponseStatus.DRUG_NOT_COVERED) return "#FFE8E8";
  if (status === CmmResponseStatus.DENIAL_ON_FILE) return "#FFE8E8";
  if (status === CmmResponseStatus.INACCURACY) return "#E6F0FF";
  if (status === CmmResponseStatus.IN_PROGRESS) return "#FFFBEB";
  if (status === CmmResponseStatus.FORM_ERROR) return "#FFE8E8";
  if (status === CmmResponseStatus.FORM_FILLED) return "#FFF3E6";
  if (status === CmmResponseStatus.SENDING_TO_PLAN) return "#F5EBFF";
  if (status === CmmResponseStatus.SENT_TO_PLAN) return "#FFE8E8";
  if (status === CmmResponseStatus.QA_IN_PROGRESS) return "#FFFBEB";
  if (status === CmmResponseStatus.QA_ERROR) return "#FFE8E8";
  if (status === CmmResponseStatus.QA_FETCHED) return "#E6F0FF";
  if (status === CmmResponseStatus.VERIFIED) return "#E6F3F0";
  if (status === CmmResponseStatus.DENIED) return "#FFE8E8";
  if (status === CmmResponseStatus.UNSPECIFIED) return "#F5F5F5";
  if (status === CmmResponseStatus.AUTH_ON_FILE) return "#E6F0FF";
  if (status === CmmResponseStatus.AUTH_NOT_REQUIRED) return "#E6F3F0";
  if (status === CmmResponseStatus.ONSHORE_ASSISTANCE) return "#F3E5F5";
  if (status === CmmResponseStatus.WAITING_FOR_CLINICAL) return "#EDE7F6";
  if (status === CmmResponseStatus.NA_OUTCOME) return "#EFEBE9";
  if (status === CmmResponseStatus.NOT_CORRECT_PROCESSOR) return "#FFF3E0";
  return "#F5F5F5";
};

export const getTextForCmmResponseStatus = (status: CmmResponseStatus) => {
  if (status === CmmResponseStatus.APPROVED) return "Approved";
  if (status === CmmResponseStatus.PENDING) return "Pending";
  if (status === CmmResponseStatus.COMPLETED) return "Completed";
  if (status === CmmResponseStatus.APPROVAL_ON_FILE) return "Approval on file";
  if (status === CmmResponseStatus.DRUG_NOT_COVERED) return "Drug Not Covered";
  if (status === CmmResponseStatus.DENIAL_ON_FILE) return "Denial on file";
  if (status === CmmResponseStatus.IN_PROGRESS) return "In Progress";
  if (status === CmmResponseStatus.FORM_ERROR) return "Form Error";
  if (status === CmmResponseStatus.FORM_FILLED) return "Form Filled";
  if (status === CmmResponseStatus.SENDING_TO_PLAN) return "Sending to Plan";
  if (status === CmmResponseStatus.SENT_TO_PLAN) return "Sent to plan";
  if (status === CmmResponseStatus.QA_IN_PROGRESS) return "QA In Progress";
  if (status === CmmResponseStatus.QA_ERROR) return "Qa Error";
  if (status === CmmResponseStatus.QA_FETCHED) return "QA Fetched";
  if (status === CmmResponseStatus.VERIFIED) return "Verified";
  if (status === CmmResponseStatus.DENIED) return "Denied";
  if (status === CmmResponseStatus.UNSPECIFIED) return "Unspecified";
  if (status === CmmResponseStatus.AUTH_ON_FILE) return "Auth on file";
  if (status === CmmResponseStatus.AUTH_NOT_REQUIRED)
    return "Auth not required";
  if (status === CmmResponseStatus.ONSHORE_ASSISTANCE)
    return "Onshore Assistance";
  if (status === CmmResponseStatus.WAITING_FOR_CLINICAL)
    return "Waiting For Clinical";
  if (status === CmmResponseStatus.NA_OUTCOME) return "NA Outcome";
  if (status === CmmResponseStatus.NOT_CORRECT_PROCESSOR)
    return "Not Correct Processor";
  return status;
};

export const getStpFileStatus = (
  status: string,
): { text: string; color: string; bgColor: string } => {
  if (status === CmmResponseStatus.APPROVED) {
    return {
      text: CmmResponseStatus.APPROVED,
      color: getTextColorForCmmResponseStatus(CmmResponseStatus.APPROVED),
      bgColor: getBgColorForCmmResponseStatus(CmmResponseStatus.APPROVED),
    };
  }
  if (status === CmmResponseStatus.COMPLETED) {
    return {
      text: getTextForCmmResponseStatus(CmmResponseStatus.COMPLETED),
      color: getTextColorForCmmResponseStatus(CmmResponseStatus.COMPLETED),
      bgColor: getBgColorForCmmResponseStatus(CmmResponseStatus.COMPLETED),
    };
  }
  if (status === CmmResponseStatus.IN_PROGRESS) {
    return {
      text: getTextForCmmResponseStatus(CmmResponseStatus.IN_PROGRESS),
      color: getTextColorForCmmResponseStatus(CmmResponseStatus.IN_PROGRESS),
      bgColor: getBgColorForCmmResponseStatus(CmmResponseStatus.IN_PROGRESS),
    };
  }
  if (status === CmmResponseStatus.FORM_ERROR) {
    return {
      text: getTextForCmmResponseStatus(CmmResponseStatus.FORM_ERROR),
      color: getTextColorForCmmResponseStatus(CmmResponseStatus.FORM_ERROR),
      bgColor: getBgColorForCmmResponseStatus(CmmResponseStatus.FORM_ERROR),
    };
  }
  if (status === CmmResponseStatus.FORM_FILLED) {
    return {
      text: getTextForCmmResponseStatus(CmmResponseStatus.FORM_FILLED),
      color: getTextColorForCmmResponseStatus(CmmResponseStatus.FORM_FILLED),
      bgColor: getBgColorForCmmResponseStatus(CmmResponseStatus.FORM_FILLED),
    };
  }
  if (status === CmmResponseStatus.DRUG_NOT_COVERED) {
    return {
      text: getTextForCmmResponseStatus(CmmResponseStatus.DRUG_NOT_COVERED),
      color: getTextColorForCmmResponseStatus(
        CmmResponseStatus.DRUG_NOT_COVERED,
      ),
      bgColor: getBgColorForCmmResponseStatus(
        CmmResponseStatus.DRUG_NOT_COVERED,
      ),
    };
  }
  if (status === CmmResponseStatus.DENIAL_ON_FILE) {
    return {
      text: getTextForCmmResponseStatus(CmmResponseStatus.DENIAL_ON_FILE),
      color: getTextColorForCmmResponseStatus(CmmResponseStatus.DENIAL_ON_FILE),
      bgColor: getBgColorForCmmResponseStatus(CmmResponseStatus.DENIAL_ON_FILE),
    };
  }
  if (status === CmmResponseStatus.SENDING_TO_PLAN) {
    return {
      text: getTextForCmmResponseStatus(CmmResponseStatus.SENDING_TO_PLAN),
      color: getTextColorForCmmResponseStatus(
        CmmResponseStatus.SENDING_TO_PLAN,
      ),
      bgColor: getBgColorForCmmResponseStatus(
        CmmResponseStatus.SENDING_TO_PLAN,
      ),
    };
  }
  if (status === CmmResponseStatus.SENT_TO_PLAN) {
    return {
      text: getTextForCmmResponseStatus(CmmResponseStatus.SENT_TO_PLAN),
      color: getTextColorForCmmResponseStatus(CmmResponseStatus.SENT_TO_PLAN),
      bgColor: getBgColorForCmmResponseStatus(CmmResponseStatus.SENT_TO_PLAN),
    };
  }
  if (status === CmmResponseStatus.QA_IN_PROGRESS) {
    return {
      text: getTextForCmmResponseStatus(CmmResponseStatus.QA_IN_PROGRESS),
      color: getTextColorForCmmResponseStatus(CmmResponseStatus.QA_IN_PROGRESS),
      bgColor: getBgColorForCmmResponseStatus(CmmResponseStatus.QA_IN_PROGRESS),
    };
  }
  if (status === CmmResponseStatus.QA_ERROR) {
    return {
      text: getTextForCmmResponseStatus(CmmResponseStatus.QA_ERROR),
      color: getTextColorForCmmResponseStatus(CmmResponseStatus.QA_ERROR),
      bgColor: getBgColorForCmmResponseStatus(CmmResponseStatus.QA_ERROR),
    };
  }
  if (status === CmmResponseStatus.QA_FETCHED) {
    return {
      text: getTextForCmmResponseStatus(CmmResponseStatus.QA_FETCHED),
      color: getTextColorForCmmResponseStatus(CmmResponseStatus.QA_FETCHED),
      bgColor: getBgColorForCmmResponseStatus(CmmResponseStatus.QA_FETCHED),
    };
  }
  if (status === CmmResponseStatus.VERIFIED) {
    return {
      text: getTextForCmmResponseStatus(CmmResponseStatus.VERIFIED),
      color: getTextColorForCmmResponseStatus(CmmResponseStatus.VERIFIED),
      bgColor: getBgColorForCmmResponseStatus(CmmResponseStatus.VERIFIED),
    };
  }
  if (status === CmmResponseStatus.DENIED) {
    return {
      text: getTextForCmmResponseStatus(CmmResponseStatus.DENIED),
      color: getTextColorForCmmResponseStatus(CmmResponseStatus.DENIED),
      bgColor: getBgColorForCmmResponseStatus(CmmResponseStatus.DENIED),
    };
  }
  if (status === CmmResponseStatus.UNSPECIFIED) {
    return {
      text: getTextForCmmResponseStatus(CmmResponseStatus.UNSPECIFIED),
      color: getTextColorForCmmResponseStatus(CmmResponseStatus.UNSPECIFIED),
      bgColor: getBgColorForCmmResponseStatus(CmmResponseStatus.UNSPECIFIED),
    };
  }
  if (status === CmmResponseStatus.AUTH_ON_FILE) {
    return {
      text: getTextForCmmResponseStatus(CmmResponseStatus.AUTH_ON_FILE),
      color: getTextColorForCmmResponseStatus(CmmResponseStatus.AUTH_ON_FILE),
      bgColor: getBgColorForCmmResponseStatus(CmmResponseStatus.AUTH_ON_FILE),
    };
  }
  if (status === CmmResponseStatus.AUTH_NOT_REQUIRED) {
    return {
      text: getTextForCmmResponseStatus(CmmResponseStatus.AUTH_NOT_REQUIRED),
      color: getTextColorForCmmResponseStatus(
        CmmResponseStatus.AUTH_NOT_REQUIRED,
      ),
      bgColor: getBgColorForCmmResponseStatus(
        CmmResponseStatus.AUTH_NOT_REQUIRED,
      ),
    };
  }
  if (status === CmmResponseStatus.PENDING) {
    return {
      text: getTextForCmmResponseStatus(CmmResponseStatus.PENDING),
      color: getTextColorForCmmResponseStatus(CmmResponseStatus.PENDING),
      bgColor: getBgColorForCmmResponseStatus(CmmResponseStatus.PENDING),
    };
  }
  if (status === CmmResponseStatus.APPROVED) {
    return {
      text: getTextForCmmResponseStatus(CmmResponseStatus.APPROVED),
      color: getTextColorForCmmResponseStatus(CmmResponseStatus.APPROVED),
      bgColor: getBgColorForCmmResponseStatus(CmmResponseStatus.APPROVED),
    };
  }
  if (status === CmmResponseStatus.ONSHORE_ASSISTANCE) {
    return {
      text: getTextForCmmResponseStatus(CmmResponseStatus.ONSHORE_ASSISTANCE),
      color: getTextColorForCmmResponseStatus(
        CmmResponseStatus.ONSHORE_ASSISTANCE,
      ),
      bgColor: getBgColorForCmmResponseStatus(
        CmmResponseStatus.ONSHORE_ASSISTANCE,
      ),
    };
  }
  if (status === CmmResponseStatus.WAITING_FOR_CLINICAL) {
    return {
      text: getTextForCmmResponseStatus(CmmResponseStatus.WAITING_FOR_CLINICAL),
      color: getTextColorForCmmResponseStatus(
        CmmResponseStatus.WAITING_FOR_CLINICAL,
      ),
      bgColor: getBgColorForCmmResponseStatus(
        CmmResponseStatus.WAITING_FOR_CLINICAL,
      ),
    };
  }
  if (status === CmmResponseStatus.NA_OUTCOME) {
    return {
      text: getTextForCmmResponseStatus(CmmResponseStatus.NA_OUTCOME),
      color: getTextColorForCmmResponseStatus(CmmResponseStatus.NA_OUTCOME),
      bgColor: getBgColorForCmmResponseStatus(CmmResponseStatus.NA_OUTCOME),
    };
  }
  if (status === CmmResponseStatus.NOT_CORRECT_PROCESSOR) {
    return {
      text: getTextForCmmResponseStatus(
        CmmResponseStatus.NOT_CORRECT_PROCESSOR,
      ),
      color: getTextColorForCmmResponseStatus(
        CmmResponseStatus.NOT_CORRECT_PROCESSOR,
      ),
      bgColor: getBgColorForCmmResponseStatus(
        CmmResponseStatus.NOT_CORRECT_PROCESSOR,
      ),
    };
  }

  return {
    text: status,
    color: "#111111",
    bgColor: "#F5F5F5",
  };
};
