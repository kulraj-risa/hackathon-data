import React from "react";
import { getCorrectText } from "../../../../custom-table/utils/getCorrectText";
import { InsuranceProps } from "../types";
import { EmptyState, InsuranceHeader } from "./ui";

const AuthReferals: React.FC<InsuranceProps> = ({ rowData }) => {
  const headerData = {
    patientMemberId: rowData?.patientMemberId,
    formName: rowData?.formName,
    formPickedFlag: rowData?.formPickedFlag,
    insuranceInfo: rowData ? getCorrectText(rowData) : "N/A",
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 border-1 border-primaryGray-15 bg-[#F7F9FA] pb-3">
      <InsuranceHeader data={headerData} />
      <div className="auth-referals flex h-full w-full flex-col items-center justify-center gap-6 overflow-y-auto bg-white p-2">
        <EmptyState message="No auth/referals found for this order" />
      </div>
    </div>
  );
};

export default AuthReferals;
