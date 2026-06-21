import React from "react";
import { CmmOrderTableRowData } from "../../../../../../data-model/cmmOrderTableRowData";

interface MedicationHeaderProps {
  data: CmmOrderTableRowData;
}

/**
 * Matches the expandable row Medication card (swapped order):
 *   Top (bold):  drug_name
 *   Bottom (gray): prescription_date • description
 */
export const MedicationHeader: React.FC<MedicationHeaderProps> = ({ data }) => {
  let rawRow: Record<string, any> = {};
  try {
    if (data?.rowData && typeof data.rowData === "string") {
      rawRow = JSON.parse(data.rowData);
    }
  } catch {
    // ignore
  }

  const prescDate =
    rawRow?.prescription?.prescription_date ??
    data?.prescriptionData?.prescription_date ??
    "";
  const prescDesc = rawRow?.prescription?.description ?? "";
  const drugName = rawRow?.drug?.drug_name ?? data?.drugName ?? "";

  return (
    <div className="flex w-full flex-col gap-2 rounded-b-md border-b-2 border-primaryGray-15 bg-primaryGray-16 p-3">
      <div className="max-w-full truncate text-sm font-bold">
        {drugName || "--"}
      </div>
      <div className="max-w-full truncate text-sm text-primaryGray-6">
        {prescDate || "--"}
        &nbsp;&nbsp;<span>&#8226;</span>&nbsp;&nbsp;
        {prescDesc || "--"}
      </div>
    </div>
  );
};
