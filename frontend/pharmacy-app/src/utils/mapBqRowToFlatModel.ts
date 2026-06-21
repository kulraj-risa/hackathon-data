/**
 * Converts a nested BigQuery row from rapids-platform.pharma_demo.demo_env_single_table
 * into the flat shape expected by mapToCoverMyMedsInputModel.
 */
export function mapBqRowToFlatModel(
  row: Record<string, any>,
): Record<string, any> {
  const patient = row?.patient ?? {};
  const addr = patient?.address ?? {};
  const ins = row?.insurance ?? {};
  const activeIns = ins?.active_insurance ?? {};
  const activeInsDetails = activeIns?.insurance ?? {};
  const activePbm = activeIns?.pbm ?? {};
  const drug = row?.drug ?? {};
  const workflow = row?.workflow ?? {};
  const provider = row?.provider ?? {};
  const providerAddr = provider?.address ?? {};
  const prescription = row?.prescription ?? {};
  const diagnosisCodes: any[] = row?.diagnosis?.diagnosis_codes ?? [];

  const primaryDiag =
    diagnosisCodes.find(
      (d) => d?.is_primary === true || d?.is_primary === "true",
    ) ?? diagnosisCodes[0];
  const secondaryDiag = diagnosisCodes.find(
    (d) => d?.is_secondary === true || d?.is_secondary === "true",
  );

  return {
    identifier: row?.identifier ?? "",
    org_id: row?.org_id ?? "",
    portal_id: row?.portal_id ?? "",

    // Patient
    patient_first_name: patient?.first_name ?? "",
    patient_last_name: patient?.last_name ?? "",
    patient_dob: patient?.dob ?? "",
    patient_mrn: patient?.patient_mrn ?? "",
    patient_gender: patient?.gender ?? "",
    patient_phone_number: patient?.phone_number ?? "",
    patient_address_street1: addr?.street1 ?? "",
    patient_address_street2: addr?.street2 ?? "",
    patient_address_city: addr?.city ?? "",
    patient_address_state: addr?.state ?? "",
    patient_address_zip: addr?.zip ?? "",

    // Provider (from provider.*)
    provider_npi: provider?.npi ?? "",
    provider_first_name: provider?.first_name ?? "",
    provider_last_name: provider?.last_name ?? "",
    provider_full_name: provider?.full_name ?? "",
    provider_address_street1: providerAddr?.street1 ?? "",
    provider_address_street2: providerAddr?.street2 ?? "",
    provider_address_city: providerAddr?.city ?? "",
    provider_address_state: providerAddr?.state ?? "",
    provider_address_zip: providerAddr?.zip ?? "",
    provider_phone: provider?.phone ?? "",
    provider_fax: provider?.fax ?? "",
    provider_speciality: provider?.speciality ?? "",
    provider_practice_name: provider?.practice_name ?? "",
    provider_credentials: provider?.credentials ?? "",

    // Drug (from drug.*)
    drug_name: drug?.drug_name ?? "",
    drug_name_onco_emr: drug?.drug_name_onco_emr ?? "",
    drug_confidence_score: drug?.drug_confidence_score ?? 0,
    drug_picked_thinking: drug?.drug_picked_thinking ?? "",
    drug_fetched_from: drug?.drug_fetched_from ?? "",
    ndc_number: drug?.ndc_number ?? "",
    drug_quantity: drug?.quantity ?? 0,
    drug_quantity_qualifier: drug?.quantity_qualifier ?? "",
    drug_days_supply: drug?.days_supply ?? 0,
    drug_type: row?.drug_type ?? "",
    generic_brand: row?.generic_brand ?? "",

    // Form-field aliases (snake_case + camelCase so any form config variant matches)
    person_number: patient?.phone_number ?? "",
    personNumber: patient?.phone_number ?? "",
    dosing_schedule: prescription?.instructions ?? "",
    dosingSchedule: prescription?.instructions ?? "",
    dosage_form: drug?.quantity_qualifier ?? "",
    dosageForm: drug?.quantity_qualifier ?? "",

    // Workflow (from workflow.*)
    status: workflow?.status ?? "",
    comment: workflow?.comment ?? "",
    error_text: workflow?.error_text ?? "",
    review_type: workflow?.review_type ?? "",
    assignee_id: workflow?.assignee_id ?? "",
    cmm_result_key: workflow?.cmm_result_key ?? "",
    patient_eligibility_check_status:
      workflow?.patient_eligibility_check_status ?? "",
    is_substitution_allowed: workflow?.is_substitution_allowed ?? null,
    created_at: workflow?.date_of_service ?? "",
    type: workflow?.type ?? "",
    final_outcome: workflow?.final_outcome ?? "",

    // Insurance (from insurance.*)
    patient_insurance_state: ins?.patient_insurance_state ?? "",
    patient_rx_bin: ins?.patient_rx_bin ?? ins?.sftp_rx_bin ?? "",
    patient_rx_group: ins?.patient_rx_group ?? "",
    patient_rx_pcn: ins?.patient_rx_pcn ?? "",
    patient_member_id: ins?.patient_member_id ?? ins?.sftp_member_id ?? "",
    sftp_member_id: ins?.sftp_member_id ?? "",
    sftp_rx_bin: ins?.sftp_rx_bin ?? "",
    form_picked_flag: ins?.form_picked_flag ?? "",
    form_picked: row?.form_picked ?? "",
    plan_name:
      activeInsDetails?.plan_name ??
      activePbm?.insurer ??
      activeInsDetails?.insurer ??
      "",
    active_insurance: ins?.active_insurance ?? null,

    // Diagnosis (from diagnosis.diagnosis_codes[])
    all_diagnosis_codes: diagnosisCodes,
    primary_diagnoses: primaryDiag?.icd10_code ?? "",
    primary_diagnoses_description: primaryDiag?.description ?? "",
    primary_diagnoses_data:
      diagnosisCodes.filter(
        (d) => d?.is_primary === true || d?.is_primary === "true",
      ) ?? null,
    secondary_diagnoses: secondaryDiag?.icd10_code ?? "",
    secondary_diagnoses_data:
      diagnosisCodes.filter(
        (d) => d?.is_secondary === true || d?.is_secondary === "true",
      ) ?? null,
    is_diagnosis_code_available_on_form: diagnosisCodes.length > 0,
    is_secondary_diagnosis_code_available_on_form: !!secondaryDiag,

    // Prescription (from prescription.*)
    prescription_data: {
      prescription_description: prescription?.description ?? "",
      prescription_date: prescription?.prescription_date ?? "",
      prescription_instructions: prescription?.instructions ?? "",
      dispense_qty: prescription?.dispense_qty ?? "",
      dispense_qty_string: prescription?.dispense_qty_string ?? "",
      refill_qty: prescription?.refill_qty ?? "",
      refill_qty_string: prescription?.refill_qty_string ?? "",
      is_related_drug_match: prescription?.is_related_drug_match ?? false,
    },
  };
}
