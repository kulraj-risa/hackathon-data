export interface FaxStatusDetails {
  file_name: string;
  sent_status: string;
  date_queued: string;
  date_sent: string;
  epoch_time: number;
  to_fax_number: string;
  pages: number;
  duration: number;
  remote_id: string;
  error_code: string;
  size: number;
  account_code: string;
}

export interface GetFaxStatusResponse {
  success: boolean;
  message: string;
  fax_status: FaxStatusDetails;
}

export interface FaxSendResponse {
  success?: boolean;
  message?: string;
  fax_details_id?: string;
}
