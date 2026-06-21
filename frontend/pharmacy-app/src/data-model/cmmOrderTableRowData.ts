export interface CmmOrderTableRowData {
  drugName: string;
  button: string;
  cmmKey: string;
  cmmOrderDeleteIcon: string;
  dateOfBirth: DateOfBirth;
  dateOfService: string;
  drugConfidenceScore: string;
  drugDaysSupply: number;
  drugFetchedFrom: string;
  drugPickedThinking: string;
  drugQuantity: number;
  drugQuantityQualifier: string;
  expandableRowIcon: ExpandableRowIcon;
  formName: string;
  formPickedFlag: string;
  id: string;
  insuranceState: string;
  medication: string;
  noDataFields: NoDataFields;
  patientDetails: PatientDetails;
  patientId: string;
  patientMemberId: string;
  patientRxBin: string;
  patientRxGroup: string;
  patientRxPcn: string;
  planName: string;
  prescriptionData: PrescriptionData;
  primaryDiagnoses: string;
  primaryDiagnosesData: DiagnosesData;
  primaryDiagnosesDescription: string;
  providerDetails: string;
  rowData: string;
  secondaryDiagnoses: string;
  secondaryDiagnosesData: DiagnosesData;
  secondaryDiagnosesDescription: string;
  status: Status;
  type: string;
  activeInsurance: ActiveInsurance;
}

export interface ActiveInsurance {
  pbm: Pbm;
}

export interface Pbm {
  insurer: string;
}

export interface ExpandableRowIcon {
  borderColor: string;
  borderWidth: number;
  id: string;
  isExpanded: boolean;
}

export interface NoDataFields {
  text: string;
  color: string;
  bgColor: string;
  displayText: string;
}

export interface PatientDetails {
  mainText: string;
  secondaryText: string;
}

export interface DateOfBirth {
  mainText: string;
  secondaryText: string;
}

export interface PrescriptionData {
  drug_name: string;
  prescription_date: string;
  is_related_drug_match: boolean;
}

export interface DiagnosesData {
  source: string;
  confidence_score: string;
}

export interface Status {
  text: string;
  color: string;
  bgColor: string;
}
