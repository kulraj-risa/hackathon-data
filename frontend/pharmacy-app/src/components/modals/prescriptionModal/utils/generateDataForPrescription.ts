import moment from "moment";
import { Prescription } from "../../../../data-model/prescriptionDataModal";
import {
  formatCommaSeparatedName,
  formatProviderName,
} from "../../../../utils/stringModifications";

export const generatePatientDataForPrescription = (data: Prescription) => {
  const patientName = formatCommaSeparatedName(data?.patient_name ?? "");
  const patientMrn = data?.patient_mrn ?? "";
  const dob = data?.patient_dob
    ? moment(data.patient_dob).format("MM/DD/YYYY")
    : "";
  const address = data?.patient_address ?? "";
  const cityStateZip = data?.patient_city_state_zip
    ? data.patient_city_state_zip.split(" ").join(", ")
    : "";
  const dateOfPrescription = data?.prescription_date
    ? moment(data.prescription_date).format("MM/DD/YYYY")
    : "";

  const prescriberName = formatProviderName(data?.prescriber_name ?? "");
  const prescriberCredentials = data?.prescriber_credentials ?? "";

  return [
    {
      header: "Patient Name",
      body: patientName,
    },
    {
      header: "Patient MRN",
      body: patientMrn,
    },
    {
      header: "Date of Birth",
      body: dob,
    },
    {
      header: "Date of Prescription",
      body: dateOfPrescription,
    },
    {
      header: "Address",
      body: cityStateZip ? `${address}\n${cityStateZip}` : address,
    },
    {
      header: "Prescriber",
      body: prescriberName,
    },
    {
      header: "Prescriber Credentials",
      body: prescriberCredentials,
    },
  ];
};
