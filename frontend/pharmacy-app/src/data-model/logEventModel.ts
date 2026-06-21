export interface LogEventModel {
  patient_id?: string;
  org_id?: string;
  order_id?: string;
  user_id?: string;
  user_email?: string;
  event_name?: string;
  additional_data: {
    screen_name: string;
    payer_name?: string;
    [key: string]: any;
  };
}
