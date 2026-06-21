import { History } from "risa-data-model";
export interface AuthDetails {
  priority?: string;
  payorName?: string;
  type?: string;
  submittedBy?: string;
  placeOfService?: string;
  submittedOn?: string;
  historyDates?: History;
}

export interface OrderHistory {
  new?: string;
  drafts?: string;
  pending?: string;
  inProgress?: string;
  approved?: string;
  denied?: string;
  closed?: string;
}

export interface OrderAuthStatus {
  id?: string;
  isSubmitted?: boolean;
  status: string;
  dates?: History;
}

export interface PatientDetailsInAuth {
  patientName?: string;
  mrnId?: string;
  dob?: string;
  memberId?: string;
}

export interface ProviderDetailsInAuth {
  providerName?: string;
  npi?: string;
  tin?: string;
  phoneNumber?: string;
}
