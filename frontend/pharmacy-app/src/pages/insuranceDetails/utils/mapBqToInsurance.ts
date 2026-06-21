import { InsuranceDetailsModel } from "../../../data-model/insuranceDetails";
import { PatientEligibilityDetails } from "../../../data-model/patientEligibilityDetails";

const g = (obj: any, key: string): string => {
  const val = obj?.[key];
  return val != null ? String(val) : "";
};

/**
 * Maps a BigQuery row from rapids-platform.pharma_demo.demo_env_single_table
 * to an array of InsuranceDetailsModel entries.
 *
 * Primary source: insurance.insurance_records[] — each entry has its own
 * `type` ("Primary", "PBM", etc.) and uses effective_date / term_date keys.
 * Fallback: insurance.active_insurance.insurance when insurance_records is empty.
 */
export function mapBqRowToInsuranceDetailsModels(
  row: Record<string, any>,
): InsuranceDetailsModel[] {
  const ins = row?.insurance;
  if (!ins) return [];

  const records: any[] = ins?.insurance_records ?? [];

  // Primary source — insurance.insurance_records[]
  if (records.length > 0) {
    return records
      .map(
        (rec: any): InsuranceDetailsModel => ({
          identifier: row?.identifier,
          type: g(rec, "type") || "Primary",
          insurer: g(rec, "insurer"),
          effectiveDate: g(rec, "effective_date"),
          termDate: g(rec, "term_date"),
          phone: g(rec, "phone"),
          policyNumber: g(rec, "policy_number"),
          groupNumber: g(rec, "group_number"),
          planNumber: g(rec, "plan_number"),
          planName: g(rec, "plan_name"),
          retailBenefit: g(rec, "retail_benefit"),
          mailOrderBenefit: g(rec, "mail_order_benefit"),
          ltc: g(rec, "ltc"),
          specialty: g(rec, "specialty"),
        }),
      )
      .filter((m) => m.insurer || m.planName || m.policyNumber);
  }

  // Fallback — insurance.active_insurance.insurance
  const active = ins?.active_insurance?.insurance;
  if (active && (active.insurer || active.plan_name || active.policy_number)) {
    return [
      {
        identifier: row?.identifier,
        type: g(active, "type") || "Primary",
        insurer: g(active, "insurer"),
        effectiveDate: g(active, "effective"),
        termDate: g(active, "term"),
        phone: g(active, "phone"),
        policyNumber: g(active, "policy_number"),
        groupNumber: g(active, "group_number"),
        planNumber: g(active, "plan_number"),
        planName: g(active, "plan_name"),
        retailBenefit: g(active, "retail_benefit"),
        mailOrderBenefit: g(active, "mail_order_benefit"),
        ltc: g(active, "ltc"),
        specialty: g(active, "specialty"),
      },
    ];
  }

  return [];
}

/**
 * BQ has no eligibility-specific fields (pharmacy_coverage_status,
 * identity_card_number, provider, family_unit_number) in any row.
 * Returns empty — the PBM Eligibility card will not render.
 */
export function mapBqRowToPatientEligibilityModels(
  _row: Record<string, any>,
): PatientEligibilityDetails[] {
  return [];
}

/**
 * Maps a BigQuery row to the flat shape expected by the cmmSingleOrder Redux slice
 * (keyed by NycbsPharmaOrderKeys string values).
 */
export function mapBqRowToCmmOrderShape(
  row: Record<string, any>,
): Record<string, any> {
  const patient = row?.patient ?? {};
  const ins = row?.insurance ?? {};
  const drug = row?.drug ?? {};
  const workflow = row?.workflow ?? {};
  const activeIns = ins?.active_insurance?.insurance ?? {};

  return {
    identifier: row?.identifier ?? "",
    patient_first_name: patient?.first_name ?? "",
    patient_last_name: patient?.last_name ?? "",
    patient_dob: patient?.dob ?? "",
    patient_mrn: patient?.patient_mrn ?? "",
    drug_name_onco_emr: drug?.drug_name_onco_emr ?? "",
    patient_insurance_state: ins?.patient_insurance_state ?? "",
    plan_name: activeIns?.plan_name ?? ins?.sftp_member_id ?? "",
    patient_rx_bin: ins?.patient_rx_bin ?? ins?.sftp_rx_bin ?? "",
    patient_rx_pcn: ins?.patient_rx_pcn ?? "",
    patient_rx_group: ins?.patient_rx_group ?? "",
    patient_member_id: ins?.patient_member_id ?? ins?.sftp_member_id ?? "",
    form_name: workflow?.status ?? "",
    form_name_inside: workflow?.type ?? "",
    cmm_result_key: workflow?.cmm_result_key ?? "",
    type: workflow?.type ?? "",
    error_text: workflow?.error_text ?? "",
    drug_type: row?.drug_type ?? "",
    generic_brand: row?.generic_brand ?? "",
    form_picked: row?.form_picked ?? "",
    form_picked_flag: ins?.form_picked_flag ?? "",
  };
}
