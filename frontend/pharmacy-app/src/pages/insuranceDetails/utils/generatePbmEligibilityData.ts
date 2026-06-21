import {
  AddressPatientEligibility,
  PatientEligibilityDetails,
} from "../../../data-model/patientEligibilityDetails";

const generatePbmEligibilityData = (
  patientEligibilityData: PatientEligibilityDetails,
) => {
  const generateAddress = (address: AddressPatientEligibility) => {
    return `${address?.street1 ?? ""} ${address?.street2 ?? ""} ${
      address?.city ?? ""
    } ${address?.state ?? ""} ${address?.zipCode ?? ""}`;
  };

  const generatedData = [
    {
      header: "PBM Name",
      body: patientEligibilityData?.insurance ?? "",
    },
    {
      header: "Identity Card Number",
      body: patientEligibilityData?.identityCardNumber ?? "",
    },
    {
      header: "PatientAddress",
      body: generateAddress(patientEligibilityData?.address ?? {}),
    },
    {
      header: "Provider",
      body: patientEligibilityData?.provider ?? "",
    },
    {
      header: "Family Unit Number",
      body: patientEligibilityData?.familyUnitNumber ?? "",
    },
    {
      header: "Drug Name",
      body: patientEligibilityData?.drugName ?? "",
    },
    {
      header: "Pharmacy Coverage Status",
      body: patientEligibilityData?.pharmacyCoverageStatus ?? "",
    },
  ];

  return {
    insurerName: patientEligibilityData?.insurance ?? "",
    insurerTag: {
      tagText: "PBM Eligibility",
      tagColor: "text-secondaryPurple-4",
      tagBgColor: "bg-secondaryPurple-10",
    },
    insuranceDetails: generatedData.filter((item) => item.body !== ""),
    lastVerifiedOn: patientEligibilityData?.visitDate ?? "",
  };
};

export default generatePbmEligibilityData;
