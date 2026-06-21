import { NycbsPharmaOrderKeys } from "../enums/nycbsPharmaOrder";

export interface DrugInsuranceCardModel {
  [NycbsPharmaOrderKeys.PatientInsuranceState]?: string;
  [NycbsPharmaOrderKeys.PatientRxBin]?: string;
  [NycbsPharmaOrderKeys.PatientRxGroup]?: string;
  [NycbsPharmaOrderKeys.PatientRxPcn]?: string;
}

export interface InsurancePlanModel {
  [NycbsPharmaOrderKeys.PatientInsuranceState]?: string;
  [NycbsPharmaOrderKeys.PlanName]?: string;
}

export interface PharmaPaFormDetailsModel {
  [NycbsPharmaOrderKeys.FormName]?: string;
  [NycbsPharmaOrderKeys.CmmResultKey]?: string;
}
