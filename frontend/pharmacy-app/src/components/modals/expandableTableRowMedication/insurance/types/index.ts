import { CmmOrderTableRowData } from "../../../../../data-model/cmmOrderTableRowData";

export interface InsuranceProps {
  rowData?: CmmOrderTableRowData;
}

export interface InsuranceHeaderData {
  patientMemberId?: string;
  formName?: string;
  formPickedFlag?: string;
  patientRxBin?: string;
}
