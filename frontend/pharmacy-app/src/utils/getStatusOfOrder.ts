import { MedicalPaOrderStatus } from "../enums/medicalPaOrderStatus";

export const getTextColorForStatus = (status: MedicalPaOrderStatus) => {
  if (status === MedicalPaOrderStatus.NEW) return "#0056D6";
  if (status === MedicalPaOrderStatus.FINANCIAL) return "#665D00";
  if (status === MedicalPaOrderStatus.AUTHORIZED) return "#005D49";
  if (status === MedicalPaOrderStatus.DENIED) return "#CC0300";
  if (status === MedicalPaOrderStatus.APPROVED) return "#537A00";
  if (status === MedicalPaOrderStatus.PENDING) return "#665D00";
  if (status === MedicalPaOrderStatus.HOLD) return "#C24400";
  if (status === MedicalPaOrderStatus.QUERY) return "#A030A0";
  if (status === MedicalPaOrderStatus.PHARM_FILL) return "#0F0F0F";
  return "#0F0F0F";
};

export const getBgColorForStatus = (status: MedicalPaOrderStatus) => {
  if (status === MedicalPaOrderStatus.NEW) return "#EAF2FF";
  if (status === MedicalPaOrderStatus.FINANCIAL) return "#FFFCD6";
  if (status === MedicalPaOrderStatus.DENIED) return "#FFE8E8";
  if (status === MedicalPaOrderStatus.AUTHORIZED) return "#E6F3F0";
  if (status === MedicalPaOrderStatus.APPROVED) return "#F8FFEB";
  if (status === MedicalPaOrderStatus.PENDING) return "#FFFCD6";
  if (status === MedicalPaOrderStatus.HOLD) return "#FFF3E0";
  if (status === MedicalPaOrderStatus.QUERY) return "#EEE6FBFF";
  if (status === MedicalPaOrderStatus.PHARM_FILL) return "#F5F5F5";
  return "#F5F5F5";
};
export const getStatusOfOrder = (
  status?: string,
): {
  text: string;
  color: string;
  bgColor: string;
} => {
  if (status === MedicalPaOrderStatus.NEW)
    return {
      text: "New",
      color: getTextColorForStatus(MedicalPaOrderStatus.NEW),
      bgColor: getBgColorForStatus(MedicalPaOrderStatus.NEW),
    };
  if (status === MedicalPaOrderStatus.FINANCIAL)
    return {
      text: "Financial",
      color: getTextColorForStatus(MedicalPaOrderStatus.FINANCIAL),
      bgColor: getBgColorForStatus(MedicalPaOrderStatus.FINANCIAL),
    };
  if (status === MedicalPaOrderStatus.APPROVED)
    return {
      text: "Approved",
      color: getTextColorForStatus(MedicalPaOrderStatus.APPROVED),
      bgColor: getBgColorForStatus(MedicalPaOrderStatus.APPROVED),
    };
  if (status === MedicalPaOrderStatus.DENIED)
    return {
      text: "Denied",
      color: getTextColorForStatus(MedicalPaOrderStatus.DENIED),
      bgColor: getBgColorForStatus(MedicalPaOrderStatus.DENIED),
    };
  if (status === MedicalPaOrderStatus.PENDING)
    return {
      text: "Pending",
      color: getTextColorForStatus(MedicalPaOrderStatus.PENDING),
      bgColor: getBgColorForStatus(MedicalPaOrderStatus.PENDING),
    };
  if (status === MedicalPaOrderStatus.AUTHORIZED)
    return {
      text: "Authorized",
      color: getTextColorForStatus(MedicalPaOrderStatus.AUTHORIZED),
      bgColor: getBgColorForStatus(MedicalPaOrderStatus.AUTHORIZED),
    };
  if (status === MedicalPaOrderStatus.HOLD)
    return {
      text: "Hold",
      color: getTextColorForStatus(MedicalPaOrderStatus.HOLD),
      bgColor: getBgColorForStatus(MedicalPaOrderStatus.HOLD),
    };
  if (status === MedicalPaOrderStatus.QUERY)
    return {
      text: "Query",
      color: getTextColorForStatus(MedicalPaOrderStatus.QUERY),
      bgColor: getBgColorForStatus(MedicalPaOrderStatus.QUERY),
    };
  if (status === MedicalPaOrderStatus.PHARM_FILL)
    return {
      text: "PharmFill",
      color: getTextColorForStatus(MedicalPaOrderStatus.PHARM_FILL),
      bgColor: getBgColorForStatus(MedicalPaOrderStatus.PHARM_FILL),
    };
  return {
    text: "Not Available",
    color: getTextColorForStatus(MedicalPaOrderStatus.NOT_AVAILABLE),
    bgColor: getBgColorForStatus(MedicalPaOrderStatus.NOT_AVAILABLE),
  };
};

export const getStatusTextOfOrder = (status?: string) => {
  if (status === MedicalPaOrderStatus.NEW) return "New";
  if (status === MedicalPaOrderStatus.FINANCIAL) return "Financial";
  if (status === MedicalPaOrderStatus.AUTHORIZED) return "Authorized";
  if (status === MedicalPaOrderStatus.HOLD) return "Hold";
  if (status === MedicalPaOrderStatus.QUERY) return "Query";
  if (status === MedicalPaOrderStatus.PHARM_FILL) return "Pharm Fill";
  return "Not Available";
};
