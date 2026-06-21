import { useCallback, useMemo, useState } from "react";
import { CmmOrderTableRowData } from "../../../../../data-model/cmmOrderTableRowData";
import {
  DiagnosesDetailsModel,
  mapDiagnosesDetails,
} from "../../../../../data-model/dignosisDetailsModal";
import { DiagnosisModalViewMode } from "../../../../../enums/diagnosisModalViewMode";
import { generateDiagnosisTableData } from "../../../diagnosisCodeModal/table/diagnosisTableData";
import { SelectedThinking } from "../types";

interface UseSecondaryDiagnosisDataProps {
  rowId?: string | number;
  rowData?: CmmOrderTableRowData;
}

interface UseSecondaryDiagnosisDataReturn {
  diagnosisTableData: any[];
  loading: boolean;
  error: any;
  viewMode: DiagnosisModalViewMode;
  selectedThinking: SelectedThinking;
  handleViewThinking: (thinking: string, diagnosisId: string) => void;
  handleBackToTable: () => void;
}

/**
 * Parse diagnosis codes directly from the raw BigQuery row JSON
 * stored in rowData.rowData, so we don't depend on a separate API call.
 */
function parseDiagnosisFromRawRow(
  rowData?: CmmOrderTableRowData,
): DiagnosesDetailsModel[] {
  let raw: Record<string, any> = {};
  try {
    if (rowData?.rowData && typeof rowData.rowData === "string") {
      raw = JSON.parse(rowData.rowData);
    }
  } catch {
    /* ignore */
  }

  const codes: any[] = raw?.diagnosis?.diagnosis_codes ?? [];
  if (!Array.isArray(codes) || codes.length === 0) return [];

  return codes.map((code: any) => mapDiagnosesDetails(code));
}

export const useSecondaryDiagnosisData = ({
  rowData,
}: UseSecondaryDiagnosisDataProps): UseSecondaryDiagnosisDataReturn => {
  const [viewMode, setViewMode] = useState<DiagnosisModalViewMode>(
    DiagnosisModalViewMode.TABLE,
  );
  const [selectedThinking, setSelectedThinking] = useState<SelectedThinking>({
    thinking: "",
    diagnosisId: "",
  });

  const handleViewThinking = useCallback(
    (thinking: string, diagnosisId: string) => {
      setSelectedThinking({ thinking, diagnosisId });
      setViewMode(DiagnosisModalViewMode.THINKING);
    },
    [],
  );

  const handleBackToTable = useCallback(() => {
    setViewMode(DiagnosisModalViewMode.TABLE);
  }, []);

  const diagnosisTableData = useMemo(() => {
    const details = parseDiagnosisFromRawRow(rowData);
    if (details.length === 0) return [];
    return generateDiagnosisTableData(details, handleViewThinking);
  }, [rowData, handleViewThinking]);

  return {
    diagnosisTableData,
    loading: false,
    error: null,
    viewMode,
    selectedThinking,
    handleViewThinking,
    handleBackToTable,
  };
};
