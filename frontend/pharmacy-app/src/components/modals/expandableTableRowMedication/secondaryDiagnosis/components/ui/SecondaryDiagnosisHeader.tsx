import React from "react";
import { SecondaryDiagnosisHeaderData } from "../../types";

interface SecondaryDiagnosisHeaderProps {
  data: SecondaryDiagnosisHeaderData;
}

/**
 * Matches the expandable row Secondary ICD card (swapped order):
 *   Top (bold):  icd10_code • description
 *   Bottom (gray): confidenceScore • source
 */
export const SecondaryDiagnosisHeader: React.FC<
  SecondaryDiagnosisHeaderProps
> = ({ data }) => {
  const { secondaryDiagnoses, confidenceScore, source } = data;

  if (!secondaryDiagnoses) {
    return null;
  }

  const confidence =
    confidenceScore && confidenceScore !== "N/A"
      ? parseFloat(Number(confidenceScore).toFixed(2))
      : "";

  return (
    <div className="flex w-full flex-col gap-2 border-b-2 border-primaryGray-15 bg-primaryGray-16 p-3">
      <div className="text-sm font-bold">{secondaryDiagnoses || "--"}</div>
      <div className="text-sm text-primaryGray-6">
        {confidence !== "" ? String(confidence) : "N/A"}
        &nbsp;&nbsp;<span>&#8226;</span>&nbsp;&nbsp;
        {source || "N/A"}
      </div>
    </div>
  );
};
