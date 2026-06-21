import React from "react";
import { DiagnosisModalViewMode } from "../../../../../enums/diagnosisModalViewMode";
import { useSecondaryDiagnosisData } from "../hooks/useSecondaryDiagnosisData";
import { SecondaryDiagnosisProps } from "../types";
import {
  DiagnosisTable,
  ErrorState,
  LoadingState,
  SecondaryDiagnosisHeader,
  ThinkingView,
} from "./ui";

const SecondaryDiagnosisCodes: React.FC<SecondaryDiagnosisProps> = ({
  rowData,
}) => {
  const {
    diagnosisTableData,
    loading,
    error,
    viewMode,
    selectedThinking,
    handleBackToTable,
  } = useSecondaryDiagnosisData({
    rowId: rowData?.id,
    rowData,
  });

  const headerData = {
    secondaryDiagnoses: rowData?.secondaryDiagnoses,
    confidenceScore: rowData?.secondaryDiagnosesData?.confidence_score,
    source: rowData?.secondaryDiagnosesData?.source,
  };

  if (error) {
    return (
      <ErrorState message="Failed to load diagnosis data. Please try again." />
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 border-1 border-primaryGray-15 bg-[#F7F9FA] pb-2">
      <SecondaryDiagnosisHeader data={headerData} />
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

export default SecondaryDiagnosisCodes;
