import { CmmOrderTableRowData } from "../../../../../data-model/cmmOrderTableRowData";

export interface DosageProps {
  rowData: CmmOrderTableRowData;
}

export interface PrescriptionData {
  patientDetails: any[];
  drugDetails: any[];
}

export interface DosageHeaderData {
  drugQuantity?: string | number;
  drugQuantityQualifier?: string;
  drugDaysSupply?: string | number;
  drugConfidenceScore?: string;
  drugFetchedFrom?: string;
}
