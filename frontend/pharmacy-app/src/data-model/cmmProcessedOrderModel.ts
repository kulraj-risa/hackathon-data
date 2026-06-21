export interface CmmProcessedOrderModel {
  createdAt?: string;
  cmmInput?: Record<string, any>;
  identifier?: string;
  patientMrn?: string;
  cmmResult?: Record<string, any>;
  status?: string;
  drugName?: string;
  oncoEmrResult?: Record<string, any>;
  externalSourceIdentifier?: string;
  patientDob?: string;
  patientLastName?: string;
  orgId?: string;
  type?: string;
  sftpRxBin?: string;
  prescriberName?: string;
  sftpMemberId?: string;
}

export const mapDataToCmmProcessedOrderModel = (
  data: any,
): CmmProcessedOrderModel => {
  return {
    createdAt: data?.created_at ?? undefined,
    cmmInput: data?.cmm_input ?? undefined,
    identifier: data?.identifier ?? undefined,
    patientMrn: data?.patient_mrn ?? undefined,
    cmmResult: data?.cmm_result ?? undefined,
    status: data?.status ?? undefined,
    drugName: data?.drug_name ?? undefined,
    oncoEmrResult: data?.onco_emr_result ?? undefined,
    externalSourceIdentifier: data?.external_source_identifier ?? undefined,
    patientDob: data?.patient_dob ?? undefined,
    patientLastName: data?.patient_last_name ?? undefined,
    orgId: data?.org_id ?? undefined,
    type: data?.type ?? undefined,
    sftpRxBin: data?.sftp_rx_bin ?? undefined,
    prescriberName: data?.prescriber_name ?? undefined,
    sftpMemberId: data?.sftp_member_id ?? undefined,
  };
};

export interface CmmProcessedResponseModel {
  data?: CmmProcessedOrderModel[];
  total?: number;
  page?: number;
  limit?: number;
  total_pages?: number;
  diff_documents_created?: boolean;
  final_cmm_data?: Record<string, any>[];
  differences_from_baseline?: {
    questionnaire: Questionnaire;
    cmm_input: CmmInput;
  };
  created_at?: string;
}

export interface CmmInput {
  comment?: Comment;
  status?: Status;
}

export interface Comment {
  new?: string;
  old?: string;
}

export interface Status {
  new?: string;
  old?: string;
}

export interface Questionnaire {
  questions?: Question[];
  questionnaire_baseline_null?: boolean;
}

export interface Question {
  new_answer?: string;
  old_answer?: string;
  question?: string;
  status?: string;
  type?: string;
}

export interface QuestionnaireState {
  questions: Question[];
}
