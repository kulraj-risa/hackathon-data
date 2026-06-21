export interface Prescription {
  dispense_qty?: string;
  dispense_qty_string?: string;
  patient_address?: string;
  patient_city_state_zip?: string;
  patient_dob?: string;
  patient_name?: string;
  practice_address?: string;
  practice_city_state_zip?: string;
  practice_name?: string;
  practice_phone?: string;
  prescriber_credentials?: string;
  prescriber_name?: string;
  prescription_date?: string;
  prescription_description?: string;
  prescription_instructions?: string;
  refill_qty?: string;
  refill_qty_string?: string;
  created_at?: string;
  patient_mrn?: string;
}

export function mapJsonToPrescription(data: any): Prescription {
  return {
    dispense_qty: data.dispense_qty ?? undefined,
    dispense_qty_string: data.dispense_qty_string ?? undefined,
    patient_address: data.patient_address ?? undefined,
    patient_city_state_zip: data.patient_city_state_zip ?? undefined,
    patient_dob: data.patient_dob ?? undefined,
    patient_name: data.patient_name ?? undefined,
    practice_address: data.practice_address ?? undefined,
    practice_city_state_zip: data.practice_city_state_zip ?? undefined,
    practice_name: data.practice_name ?? undefined,
    practice_phone: data.practice_phone ?? undefined,
    prescriber_credentials: data.prescriber_credentials ?? undefined,
    prescriber_name: data.prescriber_name ?? undefined,
    prescription_date: data.prescription_date ?? undefined,
    prescription_description: data.prescription_description ?? undefined,
    prescription_instructions: data.prescription_instructions ?? undefined,
    refill_qty: data.refill_qty ?? undefined,
    refill_qty_string: data.refill_qty_string ?? undefined,
    created_at: data.created_at ?? undefined,
    patient_mrn: data.patient_mrn ?? undefined,
  };
}
