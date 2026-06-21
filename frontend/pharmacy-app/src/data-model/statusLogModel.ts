export interface StatusLogData {
  created_at: string;
  provider_name: string;
  provider_email: string;
  follow_up_type_id: string;
  follow_up_type_label: string;
  comments: string;
}

export interface StatusLogDataWithId extends StatusLogData {
  id: string;
}

export interface StatusLogEntry {
  id: string;
  data: StatusLogData;
}
