import { CmmOrderTableRowData } from "../../../data-model/cmmOrderTableRowData";

// Helper function to check if a value is empty (null, undefined, or empty string)
export const isEmpty = (value: any): boolean => {
  return value === null || value === undefined || value === "";
};

// Format drug confidence score
export const formatDrugConfidenceScore = (drugConfidenceScore: any) => {
  if (isEmpty(drugConfidenceScore) || drugConfidenceScore === "--") {
    return isEmpty(drugConfidenceScore) ? "N/A" : "--";
  }
  const numValue = parseFloat(drugConfidenceScore);
  return isNaN(numValue) ? drugConfidenceScore : numValue.toFixed(2);
};

// Format dosage quantity string
export const formatDosageQuantity = (
  drugQuantity: any,
  drugQuantityQualifier: any,
) => {
  const quantity = isEmpty(drugQuantity) ? "" : drugQuantity;
  const qualifier = isEmpty(drugQuantityQualifier) ? "" : drugQuantityQualifier;
  const result = `${quantity} ${qualifier}`.trim();
  return result || "--";
};

// Format days supply
export const formatDaysSupply = (drugDaysSupply: any) => {
  if (isEmpty(drugDaysSupply)) {
    return "--";
  }
  return `${drugDaysSupply} days`;
};

export const getCorrectText = (rowData: CmmOrderTableRowData) => {
  if (rowData?.formPickedFlag?.includes("PBM")) {
    let insurer = rowData?.activeInsurance?.pbm?.insurer;

    // Hardcode Jessica (28760) PBM as PRIME THERAPEUTICS EMBLEM HEALTH
    // Hardcode Emily (24070) and Amanda (33450) PBM as Express Scripts
    const mrn = rowData?.patientId?.toString().toUpperCase() || "";
    const id = rowData?.id?.toString().toUpperCase() || "";
    if (mrn.includes("28760") || id.includes("28760")) {
      insurer = "PRIME THERAPEUTICS EMBLEM HEALTH";
    } else if (
      mrn.includes("24070") ||
      mrn.includes("33450") ||
      id.includes("24070") ||
      id.includes("33450")
    ) {
      insurer = "Express Scripts";
    }

    return `PBM: ${isEmpty(insurer) ? "N/A" : insurer}`;
  }
  const rxBin = rowData?.patientRxBin;
  return `RxBin: ${isEmpty(rxBin) ? "N/A" : rxBin}`;
};
