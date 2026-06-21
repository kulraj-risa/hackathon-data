import React from "react";
import { DiagnosisModalViewMode } from "../../../../../enums/diagnosisModalViewMode";
import { useDiagnosisData } from "../hooks/useDiagnosisData";
import { DiagnosisProps } from "../types";
import {
  DiagnosisHeader,
  DiagnosisTable,
  ErrorState,
  LoadingState,
  ThinkingView,
} from "./ui";

const DiagnosisCodes: React.FC<DiagnosisProps> = ({ rowData }) => {
  const {
    diagnosisTableData,
    loading,
    error,
    viewMode,
    selectedThinking,
    handleBackToTable,
  } = useDiagnosisData({
    rowId: rowData?.id,
    rowData,
  });

  const headerData = {
    primaryDiagnoses: rowData?.primaryDiagnoses,
    confidenceScore: rowData?.primaryDiagnosesData?.confidence_score,
    source: rowData?.primaryDiagnosesData?.source,
  };

  if (error) {
    return (
      <ErrorState message="Failed to load diagnosis data. Please try again." />
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 border-1 border-primaryGray-15 bg-[#F7F9FA] pb-2">
      <DiagnosisHeader data={headerData} />
      {loading ? (
        <LoadingState message="Loading diagnosis data..." />
      ) : (
        <div className="h-full w-full overflow-y-auto bg-white px-1 pb-1">
          {viewMode === DiagnosisModalViewMode.TABLE ? (
            <DiagnosisTable tableData={diagnosisTableData} />
          ) : (
            <ThinkingView
              selectedThinking={selectedThinking}
              onBackToTable={handleBackToTable}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default DiagnosisCodes;
