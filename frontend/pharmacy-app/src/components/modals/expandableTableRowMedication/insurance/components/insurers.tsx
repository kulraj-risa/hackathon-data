import React from "react";
import { useInsuranceDetails } from "../hooks/useInsuranceDetails";
import { InsuranceProps } from "../types";
import {
  EmptyState,
  InsuranceDetailsContent,
  InsuranceHeader,
  LoadingState,
} from "./ui";

const Insurers: React.FC<InsuranceProps> = ({ rowData }) => {
  const { finalInsuranceDetails, loading, hasData } = useInsuranceDetails({
    rowId: rowData?.id,
  });

  const headerData = {
    patientMemberId: rowData?.patientMemberId,
    formName: rowData?.formName,
    formPickedFlag: rowData?.formPickedFlag,
    patientRxBin: rowData?.patientRxBin ?? "N/A",
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 border-1 border-primaryGray-15 bg-[#F7F9FA] pb-3">
      <InsuranceHeader data={headerData} />
      {loading ? (
        <div className="flex h-full w-full flex-row items-center justify-center gap-2 p-8">
          <LoadingState message="Loading insurance details..." />
        </div>
      ) : !hasData ? (
        <EmptyState message="No insurance details found for this order" />
      ) : (
        <InsuranceDetailsContent insuranceDetails={finalInsuranceDetails} />
      )}
    </div>
  );
};

export default Insurers;
