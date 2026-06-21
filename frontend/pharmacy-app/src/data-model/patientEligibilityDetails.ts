export interface AddressPatientEligibility {
  street1?: string;
  street2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface PatientEligibilityDetails {
  identifier?: string;
  createdAt?: string;
  provider?: string;
  insurance?: string;
  identityCardNumber?: string;
  familyUnitNumber?: string;
  patientMrn?: string;
  drugName?: string;
  address?: AddressPatientEligibility;
  visitDate?: string;
  pharmacyCoverageStatus?: string;
}

export const mapToPatientEligibilityDetails = (
  data: any,
): PatientEligibilityDetails => {
  return {
    identifier: data.identifier ?? null,
    createdAt: data.created_at ?? null,
    provider: data.provider ?? null,
    insurance: data.insurance ?? null,
    identityCardNumber: data.identity_card_number ?? null,
    familyUnitNumber: data.family_unit_number ?? null,
    patientMrn: data.patient_mrn ?? null,
    drugName: data.drug_name ?? null,
    address: data.address
      ? {
          street1: data.address.patient_address_street1 ?? null,
          street2: data.address.patient_address_street2 ?? null,
          city: data.address.patient_address_city ?? null,
          state: data.address.patient_address_state ?? null,
          zipCode: data.address.patient_address_zip_code ?? null,
        }
      : undefined,
    visitDate: data.visit_date ?? null,
    pharmacyCoverageStatus: data.pharmacy_coverage_status ?? null,
  };
};
