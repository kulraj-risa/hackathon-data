import React, { useMemo } from "react";
import { CmmOrderTableRowData } from "../../../../../data-model/cmmOrderTableRowData";
import { DosageProps } from "../types";
import { DosageHeader, PrescriptionContent } from "./ui";

/**
 * Build patient & drug details directly from the raw BigQuery row
 * — same mapping as Medication > Prescription tab.
 */
function buildDetailsFromRawRow(rowData?: CmmOrderTableRowData) {
  let raw: Record<string, any> = {};
  try {
    if (rowData?.rowData && typeof rowData.rowData === "string") {
      raw = JSON.parse(rowData.rowData);
    }
  } catch {
    /* ignore */
  }

  const patient = raw?.patient ?? {};
  const prescription = raw?.prescription ?? {};
  const provider = raw?.provider ?? {};

  const patientDetails = [
    { header: "Patient Name", body: patient?.full_name ?? "" },
    { header: "Patient MRN", body: patient?.patient_mrn ?? "" },
    { header: "Date of Birth", body: patient?.dob ?? "" },
    {
      header: "Date of Prescription",
      body: prescription?.prescription_date ?? "",
    },
    { header: "Address", body: provider?.address?.street1 ?? "" },
    { header: "Prescriber", body: provider?.full_name ?? "" },
    { header: "Prescriber Credentials", body: provider?.credentials ?? "" },
  ];

  const drugDetails = [
    { header: "Drug Name", body: prescription?.description ?? "" },
    { header: "Drug Instructions", body: prescription?.instructions ?? "" },
    { header: "Dispense Amount", body: prescription?.dispense_qty ?? "" },
    { header: "Refill Amount", body: prescription?.refill_qty ?? "" },
  ];

  return { patientDetails, drugDetails };
}

const Dosage: React.FC<DosageProps> = ({ rowData }) => {
  const { patientDetails, drugDetails } = useMemo(
    () => buildDetailsFromRawRow(rowData),
    [rowData],
  );

  const headerData = {
    drugQuantity: rowData?.drugQuantity,
    drugQuantityQualifier: rowData?.drugQuantityQualifier,
    drugDaysSupply: rowData?.drugDaysSupply,
    drugConfidenceScore: rowData?.drugConfidenceScore,
    drugFetchedFrom: rowData?.drugFetchedFrom,
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 border-1 border-primaryGray-15 bg-[#F7F9FA]">
      <DosageHeader data={headerData} />
      <div className="h-full w-full bg-white">
        <PrescriptionContent
          patientDetails={patientDetails}
          drugDetails={drugDetails}
        />
      </div>
    </div>
  );
};

export default Dosage;
