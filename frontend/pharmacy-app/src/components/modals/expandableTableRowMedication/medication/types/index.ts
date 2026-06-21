import { CmmOrderTableRowData } from "../../../../../data-model/cmmOrderTableRowData";

export interface MedicationProps {
  rowData?: CmmOrderTableRowData;
}

export interface PrescriptionDetailsData {
  patientDetails: any[];
  drugDetails: any[];
}

export interface MedicationHeaderData {
  medication?: string;
  prescriptionDate?: string;
}
