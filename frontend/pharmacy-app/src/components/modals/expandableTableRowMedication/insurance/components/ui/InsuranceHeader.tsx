import React from "react";
import { InsuranceHeaderData } from "../../types";

interface InsuranceHeaderProps {
  data: InsuranceHeaderData;
}

/**
 * Matches the expandable row Insurance card (swapped order):
 *   Top (bold):  patientMemberId • formName
 *   Bottom (gray): formPickedFlag • PBM Name/RxBin: patientRxBin
 */
export const InsuranceHeader: React.FC<InsuranceHeaderProps> = ({ data }) => {
  const { patientMemberId, formName, formPickedFlag, patientRxBin } = data;

  const rxBinLabel = formPickedFlag?.toLowerCase().includes("pbm")
    ? "PBM Name"
    : "RxBin";

  return (
    <div className="flex w-full flex-col gap-2 rounded-b-md border-b-2 border-primaryGray-15 bg-primaryGray-16 p-3">
      <div className="text-sm font-bold">
        {patientMemberId || "--"}
        &nbsp;&nbsp;<span>&#8226;</span>&nbsp;&nbsp;
        {formName || "--"}
      </div>
      <div className="text-sm text-primaryGray-6">
        {formPickedFlag || "--"}
        &nbsp;&nbsp;<span>&#8226;</span>&nbsp;&nbsp;
        {rxBinLabel}: {patientRxBin || "N/A"}
      </div>
    </div>
  );
};
