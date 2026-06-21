import React from "react";
import { useClinicalDocument } from "../hooks/useClinicalDocument";
import { DiagnosisProps } from "../types";
import { ClinicalDocumentViewer, DiagnosisHeader, LoadingState } from "./ui";

const ClinicalAttachement: React.FC<DiagnosisProps> = ({ rowData }) => {
  const { clinicalDocUrl, loading, isLoadingUrl, error } = useClinicalDocument({
    rowId: rowData?.id,
  });

  const headerData = {
    primaryDiagnoses: rowData?.primaryDiagnoses,
    confidenceScore: rowData?.primaryDiagnosesData?.confidence_score,
    source: rowData?.primaryDiagnosesData?.source,
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 border-1 border-primaryGray-15 bg-[#F7F9FA] pb-2">
      <DiagnosisHeader data={headerData} />

      {loading || isLoadingUrl ? (
        <LoadingState message="Loading clinical document..." />
      ) : (
        <ClinicalDocumentViewer docUrl={clinicalDocUrl} error={error} />
      )}
    </div>
  );
};

export default ClinicalAttachement;
