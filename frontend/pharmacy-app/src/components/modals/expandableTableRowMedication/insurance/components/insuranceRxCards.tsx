import React from "react";
import { useInsuranceDocuments } from "../hooks/useInsuranceDocuments";
import { InsuranceProps } from "../types";
import { DocumentViewer, InsuranceHeader, LoadingState } from "./ui";

const InsuranceRxCards: React.FC<InsuranceProps> = ({ rowData }) => {
  const {
    insuranceDocuments,
    currentPage,
    docUrl,
    loading,
    fetchingDocUrl,
    error,
    setCurrentPage,
  } = useInsuranceDocuments({
    rowId: rowData?.id,
  });

  const headerData = {
    patientMemberId: rowData?.patientMemberId ?? "N/A",
    formName: rowData?.formName ?? "N/A",
    formPickedFlag: rowData?.formPickedFlag ?? "N/A",
    patientRxBin: rowData?.patientRxBin ?? "N/A",
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 border-1 border-primaryGray-15 bg-[#F7F9FA] pb-3">
      <InsuranceHeader data={headerData} />
      {loading || fetchingDocUrl ? (
        <LoadingState message="Loading document..." />
      ) : (
        <DocumentViewer
          docUrl={docUrl}
          error={error}
          currentDocument={insuranceDocuments[currentPage - 1]}
          totalDocuments={insuranceDocuments.length}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};

export default InsuranceRxCards;
