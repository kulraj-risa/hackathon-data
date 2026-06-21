export interface PatientData {
  patientName: string;
  patientId: string; // MRN
  planName: string;
  planId: string; // member ID
  dob: string;
  state: string;
  primaryProvider: string;
  docId?: string;
}
