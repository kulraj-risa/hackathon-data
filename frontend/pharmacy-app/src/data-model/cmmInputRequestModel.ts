export interface CoverMyMedsInputModel {
  identifier?: string;
  drug_name?: string;
  drug_confidence_score?: number;
  drug_picked_thinking?: string;
  primary_diagnoses?: string;
  primary_diagnoses_description?: string;
  secondary_diagnoses?: string;
  patient_insurance_state?: string;
  plan_name?: string;
  patient_rx_bin?: string;
  patient_rx_group?: string;
  patient_rx_pcn?: string;
  patient_member_id?: string;
  form_name?: string;
  form_picked_flag?: string;
  patient_first_name?: string;
  patient_last_name?: string;
  patient_dob?: string;
  patient_gender?: string;
  patient_address_street1?: string;
  patient_address_street2?: string;
  patient_address_city?: string;
  patient_address_state?: string;
  patient_address_zip?: string;
  patient_phone_number?: string;
  drug_quantity?: number;
  drug_quantity_qualifier?: string;
  drug_days_supply?: number;
  filename?: string;
  provider_npi?: string;
  provider_first_name?: string;
  provider_last_name?: string;
  provider_address_street1?: string;
  provider_address_street2?: string;
  provider_address_city?: string;
  provider_address_state?: string;
  provider_address_zip?: string;
  provider_phone?: string;
  provider_fax?: string;
  review_type?: string;
  pa_form_option?: any[];
  cmm_result_key?: string;
  pa_form_accordian_title?: any[];
  assignee_id?: string;
  status?: string;
  patient_mrn?: string;
  created_at?: string;
  comment?: string;
  error_text?: string;
  form_name_inside?: string;
  patient_eligibility_check_status?: string;
  is_diagnosis_code_available_on_form?: boolean;
  is_secondary_diagnosis_code_available_on_form?: boolean;
  active_insurance?: ActiveInsuranceResponse;
  drug_name_onco_emr?: string;
  provider_speciality?: string;
  org_id?: string;
  portal_id?: string;
  portal_username?: string;
  external_source_identifier?: string;
  ndc_number?: string;
  sftp_member_id?: string;
  sftp_rx_bin?: string;
  type?: string;
  drug_fetched_from?: string;
  is_substitution_allowed?: boolean | null;
  prescription_data?: any;
  all_diagnosis_codes?: any[];
  primary_diagnoses_data?: any;
  secondary_diagnoses_data?: any;
  form_picked?: string;
  drug_type?: string;
  generic_brand?: string;
  person_number?: string;
  personNumber?: string;
  dosing_schedule?: string;
  dosingSchedule?: string;
  dosage_form?: string;
  dosageForm?: string;
}

interface Insurance {
  effective?: string;
  group_number?: string;
  insurer?: string;
  ltc?: string;
  mail_order_benefit?: string;
  phone?: string;
  plan_name?: string;
  plan_number?: string;
  policy_number?: string;
  retail_benefit?: string;
  specialty?: string;
  term?: string;
  type?: string;
}

interface InsuranceCard {
  payer?: string;
  plan?: string;
  member_id?: string;
  rx_pcn?: string;
  rx_bin?: string;
  rx_group?: string;
  cin?: string;
  state?: string;
  date?: string;
}

interface ActiveInsuranceResponse {
  insurance?: Insurance;
  pbm?: Insurance;
  insurance_card?: InsuranceCard;
}

export function mapToCoverMyMedsInputModel(
  response: any,
): CoverMyMedsInputModel {
  return {
    identifier: response.identifier ?? "",
    drug_name: response.drug_name ?? "",
    drug_confidence_score: response.drug_confidence_score ?? 0,
    drug_picked_thinking: response.drug_picked_thinking ?? "",
    primary_diagnoses: response.primary_diagnoses ?? "",
    primary_diagnoses_description: response.primary_diagnoses_description ?? "",
    secondary_diagnoses: response.secondary_diagnoses ?? "",
    patient_insurance_state: response.patient_insurance_state ?? "",
    plan_name: response.plan_name ?? "",
    patient_rx_bin: response.patient_rx_bin ?? "",
    patient_rx_group: response.patient_rx_group ?? "",
    patient_rx_pcn: response.patient_rx_pcn ?? "",
    patient_member_id: response.patient_member_id ?? "",
    form_name: response.form_name ?? "",
    form_picked_flag: response.form_picked_flag ?? "",
    patient_first_name: response.patient_first_name ?? "",
    patient_last_name: response.patient_last_name ?? "",
    patient_dob: response.patient_dob ?? "",
    patient_gender: response.patient_gender ?? "",
    patient_address_street1: response.patient_address_street1 ?? "",
    patient_address_street2: response.patient_address_street2 ?? "",
    patient_address_city: response.patient_address_city ?? "",
    patient_address_state: response.patient_address_state ?? "",
    patient_address_zip: response.patient_address_zip ?? "",
    patient_phone_number: response.patient_phone_number ?? "",
    drug_quantity: response.drug_quantity ?? 0,
    drug_quantity_qualifier: response.drug_quantity_qualifier ?? "",
    drug_days_supply: response.drug_days_supply ?? 0,
    provider_npi: response.provider_npi ?? "",
    provider_first_name: response.provider_first_name ?? "",
    provider_last_name: response.provider_last_name ?? "",
    provider_address_street1: response.provider_address_street1 ?? "",
    provider_address_street2: response.provider_address_street2 ?? "",
    provider_address_city: response.provider_address_city ?? "",
    provider_address_state: response.provider_address_state ?? "",
    provider_address_zip: response.provider_address_zip ?? "",
    provider_phone: response.provider_phone ?? "",
    provider_fax: response.provider_fax ?? "",
    review_type: response.review_type ?? "",
    pa_form_option: response.pa_form_option ?? [],
    cmm_result_key: response.cmm_result_key ?? "",
    pa_form_accordian_title: response.pa_form_accordian_title ?? [],
    assignee_id: response.assignee_id ?? "",
    status: response.status ?? "",
    patient_mrn: response.patient_mrn ?? "",
    created_at: response.created_at ?? "",
    comment: response.comment ?? "",
    error_text: response.error_text ?? "",
    form_name_inside: response.form_name_inside ?? "",
    patient_eligibility_check_status:
      response.patient_eligibility_check_status ?? "",
    is_diagnosis_code_available_on_form:
      response.is_diagnosis_code_available_on_form == null
        ? true
        : response.is_diagnosis_code_available_on_form,
    is_secondary_diagnosis_code_available_on_form:
      response.is_secondary_diagnosis_code_available_on_form == null
        ? false
        : response.is_secondary_diagnosis_code_available_on_form,
    active_insurance: response.active_insurance ?? null,
    drug_name_onco_emr: response.drug_name_onco_emr ?? "",
    provider_speciality: response.provider_speciality ?? "",
    org_id: response.org_id ?? "",
    portal_id: response.portal_id ?? "",
    portal_username: response.portal_username ?? "",
    external_source_identifier: response.external_source_identifier ?? "",
    ndc_number: response.ndc_number ?? "",
    sftp_member_id: response.sftp_member_id ?? "",
    sftp_rx_bin: response.sftp_rx_bin ?? "",
    type: response.type ?? "",
    drug_fetched_from: response.drug_fetched_from ?? "",
    is_substitution_allowed: response.is_substitution_allowed ?? null,
    prescription_data: response.prescription_data ?? null,
    all_diagnosis_codes: response.all_diagnosis_codes ?? [],
    primary_diagnoses_data: response.primary_diagnoses_data ?? null,
    secondary_diagnoses_data: response.secondary_diagnoses_data ?? null,
    form_picked: response.form_picked ?? "",
    drug_type: response.drug_type ?? "",
    generic_brand: response.generic_brand ?? "",
    person_number: response.person_number ?? "",
    personNumber: response.personNumber ?? response.person_number ?? "",
    dosing_schedule: response.dosing_schedule ?? "",
    dosingSchedule: response.dosingSchedule ?? response.dosing_schedule ?? "",
    dosage_form: response.dosage_form ?? "",
    dosageForm: response.dosageForm ?? response.dosage_form ?? "",
  };
}
