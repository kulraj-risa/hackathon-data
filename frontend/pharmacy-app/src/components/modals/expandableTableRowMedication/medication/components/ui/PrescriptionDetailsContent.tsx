import React from "react";
import DrugDetails from "../../../../prescriptionModal/components/drugDetails";
import PatientDetails from "../../../../prescriptionModal/components/patientDetails";
import { PrescriptionDetailsData } from "../../types";

interface PrescriptionDetailsContentProps extends PrescriptionDetailsData {}

export const PrescriptionDetailsContent: React.FC<
  PrescriptionDetailsContentProps
> = ({ patientDetails, drugDetails }) => {
  return (
    <div className="flex h-full w-full flex-col bg-white">
      <div className="p-3">
        <PatientDetails data={patientDetails} />
      </div>
      <div className="drug-details__container mt-4 flex w-full flex-col items-start px-2">
        <DrugDetails data={drugDetails} />
      </div>
    </div>
  );
};
