import React from "react";
import { useClinicalDocument } from "../hooks/useClinicalDocument";
import { SecondaryDiagnosisProps } from "../types";
import {
  ClinicalDocumentViewer,
  LoadingState,
  SecondaryDiagnosisHeader,
} from "./ui";

const ClinicalAttachement: React.FC<SecondaryDiagnosisProps> = ({
  rowData,
}) => {
  const { clinicalDocUrl, loading, isLoadingUrl, error } = useClinicalDocument({
    rowId: rowData?.id,
  });

  const headerData = {
    secondaryDiagnoses: rowData?.secondaryDiagnoses,
    confidenceScore: rowData?.secondaryDiagnosesData?.confidence_score,
    source: rowData?.secondaryDiagnosesData?.source,
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 border-1 border-primaryGray-15 bg-[#F7F9FA] pb-2">
      <SecondaryDiagnosisHeader data={headerData} />

      {loading || isLoadingUrl ? (
        <LoadingState message="Loading clinical document..." />
      ) : (
        <ClinicalDocumentViewer docUrl={clinicalDocUrl} error={error} />
      )}
    </div>
  );
};

export default ClinicalAttachement;
