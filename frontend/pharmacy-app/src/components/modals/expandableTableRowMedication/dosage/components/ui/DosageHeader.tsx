import React from "react";
import { DosageHeaderData } from "../../types";

interface DosageHeaderProps {
  data: DosageHeaderData;
}

/**
 * Matches the expandable row Dosage card (swapped order):
 *   Top (bold):  quantity qualifier • days_supply days
 *   Bottom (gray): confidenceScore • fetchedFrom
 */
export const DosageHeader: React.FC<DosageHeaderProps> = ({ data }) => {
  const { drugQuantity, drugDaysSupply, drugConfidenceScore, drugFetchedFrom } =
    data;

  const confidence =
    drugConfidenceScore && drugConfidenceScore !== "--"
      ? parseFloat(Number(drugConfidenceScore).toFixed(2))
      : "";

  return (
    <div className="flex w-full flex-col gap-2 rounded-b-md border-b-2 border-b-primaryGray-15 bg-primaryGray-16 p-3">
      <div className="text-sm font-bold">
        {drugQuantity ? `${drugQuantity}` : "--"}
        {data.drugQuantityQualifier ? ` ${data.drugQuantityQualifier}` : ""}
        &nbsp;&nbsp;<span>&#8226;</span>&nbsp;&nbsp;
        {drugDaysSupply ? `${drugDaysSupply} days` : "--"}
      </div>
      <div className="text-sm text-primaryGray-6">
        {confidence !== "" ? String(confidence) : "N/A"}
        &nbsp;&nbsp;<span>&#8226;</span>&nbsp;&nbsp;
        {drugFetchedFrom || "N/A"}
      </div>
    </div>
  );
};
