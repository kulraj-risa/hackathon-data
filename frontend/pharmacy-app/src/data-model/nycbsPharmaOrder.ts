export interface NycbsPharmaOrderModel {
  [key: string]: string | null;
  prescriptionData?: any;
}

export interface PaginationModel {
  [key: string]: number | null;
}

export interface NycbDocumentModel {
  identifier?: string;
  patient_mrn?: string;
  created_at?: string;
  document_name?: string;
  file_path?: string;
  visit_date?: string;
  document_type?: string;
  signed_status_text?: string | null;
  meddication?: string;
  date_of_service?: string;
}

export interface PharmaStpFileModel {
  identifier: string;
  seq: string;
  poc: string;
  pharmacy_type: string;
  patient_mrn: string;
  patient_name: string;
  dob: string;
  insuranceid: string;
  provider_name: string;
  drug: string;
  pharmacy: string;
  bin: string;
  pharmacy_phone: string | null;
  rx_due_date: string;
  covermymed_id: string | null;
  response_status: string | null;
  second_stp_status: string | null;
  sftp_status: string | null;
  filename: string;
  org_id: string;
  dumped_at: string;
}
