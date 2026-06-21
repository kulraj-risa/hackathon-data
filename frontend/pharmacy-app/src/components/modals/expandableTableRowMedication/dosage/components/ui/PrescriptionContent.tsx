import React from "react";
import DrugDetails from "../../../../prescriptionModal/components/drugDetails";
import PatientDetails from "../../../../prescriptionModal/components/patientDetails";
import { PrescriptionData } from "../../types";

interface PrescriptionContentProps extends PrescriptionData {}

export const PrescriptionContent: React.FC<PrescriptionContentProps> = ({
  patientDetails,
  drugDetails,
}) => {
  return (
    <div className="flex w-full flex-col bg-white px-2">
      <div className="patient-details__container px-2 pt-2">
        <PatientDetails data={patientDetails} />
      </div>
      <div className="drug-details__container mt-4 flex w-full flex-col items-start">
        <DrugDetails data={drugDetails} />
      </div>
    </div>
  );
};
