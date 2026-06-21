export interface EventsModal {
  event_type?: string;
  event_name?: string;
  patient_id?: string;
  order_id?: string;
  org_id?: string;
  user_id?: string;
  user_email?: string;
  created_at?: string;
  metadata?: Record<string, any>;
}

export interface NewEventModel {
  name?: string;
  timestamp?: string;
  tag?: string;
}

export interface AuditTrialOverviewResponseModel {
  success?: boolean;
  message?: string;
  order_id?: string;
  entries?: NewEventModel[];
}

export interface DetailedEventModel {
  order_id?: string;
  name?: string;
  tag?: string;
  total_entries?: number;
  entries?: {
    timestamp?: string;
    metadata?: Record<string, any>;
  }[];
}
