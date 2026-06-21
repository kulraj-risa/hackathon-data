import React, { useMemo } from "react";
import { CmmOrderTableRowData } from "../../../../../data-model/cmmOrderTableRowData";
import { MedicationProps } from "../types";
import { MedicationHeader, PrescriptionDetailsContent } from "./ui";

/**
 * Build patient & drug details directly from the raw BigQuery row
 * so values always match the expandable row data.
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
    {
      header: "Dispense Amount",
      body: prescription?.dispense_qty ?? "",
    },
    {
      header: "Refill Amount",
      body: prescription?.refill_qty ?? "",
    },
  ];

  return { patientDetails, drugDetails };
}

const Prescription: React.FC<MedicationProps> = ({ rowData }) => {
  const { patientDetails, drugDetails } = useMemo(
    () => buildDetailsFromRawRow(rowData),
    [rowData],
  );

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 border-1 border-primaryGray-15 bg-[#F7F9FA]">
      <MedicationHeader data={rowData as CmmOrderTableRowData} />
      <div className="flex h-full w-full flex-col items-center justify-center bg-primaryGray-16">
        <PrescriptionDetailsContent
          patientDetails={patientDetails}
          drugDetails={drugDetails}
        />
      </div>
    </div>
  );
};

export default Prescription;
