import { CmmOrderTableRowData } from "../../../../../data-model/cmmOrderTableRowData";

export interface DiagnosisProps {
  rowData?: CmmOrderTableRowData;
}

export interface DiagnosisHeaderData {
  primaryDiagnoses?: string;
  confidenceScore?: string;
  source?: string;
}

export interface SelectedThinking {
  thinking: string;
  diagnosisId: string;
}
