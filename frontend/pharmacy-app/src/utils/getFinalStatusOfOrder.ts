import { FinalWorklistStatus } from "../enums/finalWorklistStatus";

export const getTextColorForFinalStatus = (status: FinalWorklistStatus) => {
  if (status === FinalWorklistStatus.AUTHORIZED_WITH_AUTH_ON_FILE)
    return "#0056D6";
  if (status === FinalWorklistStatus.AUTHORIZED_WITH_NO_AUTH_REQUIRED)
    return "#665D00";
  if (status === FinalWorklistStatus.AUTHORIZED) return "#0056D6";
  if (status === FinalWorklistStatus.AUTHORIZED_WITH_APPROVAL) return "#005D49";
  if (status === FinalWorklistStatus.AUTHMATE_PENDING) return "#C24400";
  if (status === FinalWorklistStatus.REQUIRED) return "#C24400";
  if (status === FinalWorklistStatus.AUTH_ISSUE_ONSITE) return "#A030A0";
  if (status === FinalWorklistStatus.DENIED) return "#CC0300";
  if (status === FinalWorklistStatus.FINANCIAL) return "#0F0F0F";
  return "#0F0F0F";
};

export const getBgColorForFinalStatus = (status: FinalWorklistStatus) => {
  if (status === FinalWorklistStatus.AUTHORIZED_WITH_AUTH_ON_FILE)
    return "#EAF2FF";
  if (status === FinalWorklistStatus.AUTHORIZED_WITH_NO_AUTH_REQUIRED)
    return "#FFFCD6";
  if (status === FinalWorklistStatus.AUTHORIZED) return "#EAF2FF";
  if (status === FinalWorklistStatus.AUTHORIZED_WITH_APPROVAL) return "#E6F3F0";
  if (status === FinalWorklistStatus.AUTHMATE_PENDING) return "#FFF3E0";
  if (status === FinalWorklistStatus.REQUIRED) return "#FFF3E0";
  if (status === FinalWorklistStatus.AUTH_ISSUE_ONSITE) return "#EEE6FBFF";
  if (status === FinalWorklistStatus.DENIED) return "#FFE8E8";
  if (status === FinalWorklistStatus.FINANCIAL) return "#E6F3F0";
  return "#F5F5F5";
};

export const getFinalStatusOfOrder = (
  status?: string,
): {
  text: string;
  color: string;
  bgColor: string;
} => {
  if (status === FinalWorklistStatus.AUTHORIZED_WITH_AUTH_ON_FILE)
    return {
      text: "Authorized with Auth on File",
      color: getTextColorForFinalStatus(
        FinalWorklistStatus.AUTHORIZED_WITH_AUTH_ON_FILE,
      ),
      bgColor: getBgColorForFinalStatus(
        FinalWorklistStatus.AUTHORIZED_WITH_AUTH_ON_FILE,
      ),
    };
  if (status === FinalWorklistStatus.AUTHORIZED)
    return {
      text: "Authorized",
      color: getTextColorForFinalStatus(FinalWorklistStatus.AUTHORIZED),
      bgColor: getBgColorForFinalStatus(FinalWorklistStatus.AUTHORIZED),
    };
  if (status === FinalWorklistStatus.AUTHORIZED_WITH_APPROVAL)
    return {
      text: "Authorized with Approval",
      color: getTextColorForFinalStatus(
        FinalWorklistStatus.AUTHORIZED_WITH_APPROVAL,
      ),
      bgColor: getBgColorForFinalStatus(
        FinalWorklistStatus.AUTHORIZED_WITH_APPROVAL,
      ),
    };
  if (status === FinalWorklistStatus.AUTHORIZED_WITH_NO_AUTH_REQUIRED)
    return {
      text: "Authorized With No Auth Required",
      color: getTextColorForFinalStatus(
        FinalWorklistStatus.AUTHORIZED_WITH_NO_AUTH_REQUIRED,
      ),
      bgColor: getBgColorForFinalStatus(
        FinalWorklistStatus.AUTHORIZED_WITH_NO_AUTH_REQUIRED,
      ),
    };
  if (status === FinalWorklistStatus.REQUIRED)
    return {
      text: "Required",
      color: getTextColorForFinalStatus(FinalWorklistStatus.REQUIRED),
      bgColor: getBgColorForFinalStatus(FinalWorklistStatus.REQUIRED),
    };
  if (status === "Authmate pending")
    return {
      text: "Authmate Pending",
      color: getTextColorForFinalStatus(FinalWorklistStatus.AUTHMATE_PENDING),
      bgColor: getBgColorForFinalStatus(FinalWorklistStatus.AUTHMATE_PENDING),
    };
  if (status === "Auth Issue Onsite")
    return {
      text: "Auth Issue Onsite",
      color: getTextColorForFinalStatus(FinalWorklistStatus.AUTH_ISSUE_ONSITE),
      bgColor: getBgColorForFinalStatus(FinalWorklistStatus.AUTH_ISSUE_ONSITE),
    };
  if (status === "Denied")
    return {
      text: "Denied",
      color: getTextColorForFinalStatus(FinalWorklistStatus.DENIED),
      bgColor: getBgColorForFinalStatus(FinalWorklistStatus.DENIED),
    };
  if (status === "Financial")
    return {
      text: "Financial",
      color: getTextColorForFinalStatus(FinalWorklistStatus.FINANCIAL),
      bgColor: getBgColorForFinalStatus(FinalWorklistStatus.FINANCIAL),
    };

  if (status) {
    return {
      text: status,
      color: getTextColorForFinalStatus(FinalWorklistStatus.AUTH_ISSUE_ONSITE),
      bgColor: getBgColorForFinalStatus(FinalWorklistStatus.AUTH_ISSUE_ONSITE),
    };
  }
  return {
    text: "Not Available",
    color: getTextColorForFinalStatus(FinalWorklistStatus.NOT_AVAILABLE),
    bgColor: getBgColorForFinalStatus(FinalWorklistStatus.NOT_AVAILABLE),
  };
};

export const getFinalStatusTextOfOrder = (status?: string) => {
  if (status === FinalWorklistStatus.AUTHORIZED_WITH_AUTH_ON_FILE)
    return "Authorized with Auth on File";
  if (status === FinalWorklistStatus.AUTHORIZED_WITH_APPROVAL)
    return "Authorized with Approval";
  if (status === FinalWorklistStatus.AUTHORIZED_WITH_NO_AUTH_REQUIRED)
    return "Authorized With No Auth Required";
  if (status === FinalWorklistStatus.AUTHMATE_PENDING)
    return "Authmate Pending";
  if (status === FinalWorklistStatus.AUTH_ISSUE_ONSITE)
    return "Auth Issue Onsite";
  if (status === FinalWorklistStatus.DENIED) return "Denied";
  if (status === FinalWorklistStatus.NOT_AVAILABLE) return "Not Available";
  return "Not Available";
};
