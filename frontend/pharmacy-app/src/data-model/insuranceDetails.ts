import { InsuranceDetailKeys } from "../enums/insuranceDetail";

export interface InsuranceDetailsModel {
  identifier?: string;
  patientMrn?: string;
  createdAt?: string;
  type?: string;
  insurer?: string;
  effectiveDate?: string;
  termDate?: string;
  phone?: string;
  policyNumber?: string;
  groupNumber?: string;
  planNumber?: string;
  planName?: string;
  retailBenefit?: string;
  mailOrderBenefit?: string;
  ltc?: string;
  specialty?: string;
}

export const mapToInsuranceDetailsModel = (
  data: any,
): InsuranceDetailsModel => {
  return {
    identifier: data?.[InsuranceDetailKeys.Identifier] ?? undefined,
    patientMrn: data?.[InsuranceDetailKeys.PatientMrn] ?? undefined,
    createdAt: data?.[InsuranceDetailKeys.CreatedAt] ?? undefined,
    type: data?.[InsuranceDetailKeys.Type] ?? undefined,
    insurer: data?.[InsuranceDetailKeys.Insurer] ?? undefined,
    effectiveDate: data?.[InsuranceDetailKeys.EffectiveDate] ?? undefined,
    termDate: data?.[InsuranceDetailKeys.TermDate] ?? undefined,
    phone: data?.[InsuranceDetailKeys.Phone] ?? undefined,
    policyNumber: data?.[InsuranceDetailKeys.PolicyNumber] ?? undefined,
    groupNumber: data?.[InsuranceDetailKeys.GroupNumber] ?? undefined,
    planNumber: data?.[InsuranceDetailKeys.PlanNumber] ?? undefined,
    planName: data?.[InsuranceDetailKeys.PlanName] ?? undefined,
    retailBenefit: data?.[InsuranceDetailKeys.RetailBenefit] ?? undefined,
    mailOrderBenefit: data?.[InsuranceDetailKeys.MailOrderBenefit] ?? undefined,
    ltc: data?.[InsuranceDetailKeys.Ltc] ?? undefined,
    specialty: data?.[InsuranceDetailKeys.Specialty] ?? undefined,
  };
};

export const mapFromInsuranceDetailsModel = (
  model: InsuranceDetailsModel,
): Record<string, any> => {
  return {
    [InsuranceDetailKeys.Identifier]: model.identifier,
    [InsuranceDetailKeys.PatientMrn]: model.patientMrn,
    [InsuranceDetailKeys.CreatedAt]: model.createdAt,
    [InsuranceDetailKeys.Type]: model.type,
    [InsuranceDetailKeys.Insurer]: model.insurer,
    [InsuranceDetailKeys.EffectiveDate]: model.effectiveDate,
    [InsuranceDetailKeys.TermDate]: model.termDate,
    [InsuranceDetailKeys.Phone]: model.phone,
    [InsuranceDetailKeys.PolicyNumber]: model.policyNumber,
    [InsuranceDetailKeys.GroupNumber]: model.groupNumber,
    [InsuranceDetailKeys.PlanNumber]: model.planNumber,
    [InsuranceDetailKeys.PlanName]: model.planName,
    [InsuranceDetailKeys.RetailBenefit]: model.retailBenefit,
    [InsuranceDetailKeys.MailOrderBenefit]: model.mailOrderBenefit,
    [InsuranceDetailKeys.Ltc]: model.ltc,
    [InsuranceDetailKeys.Specialty]: model.specialty,
  };
};
