import { CmmOrderTableRowData } from "../../../../../data-model/cmmOrderTableRowData";

export interface SecondaryDiagnosisProps {
  rowData?: CmmOrderTableRowData;
}

export interface SecondaryDiagnosisHeaderData {
  secondaryDiagnoses?: string;
  confidenceScore?: string;
  source?: string;
}

export interface SelectedThinking {
  thinking: string;
  diagnosisId: string;
}
