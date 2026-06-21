export interface EventForAuditTrail {
  event_name?: string;
  event_type?: string;
  created_at?: string;
  metadata?: Record<string, any>;
}

export interface Order {
  order_id?: string;
  events?: EventForAuditTrail[];
}

export interface PatientEntry {
  orders?: Order[];
}

export interface Entries {
  patients?: PatientEntry[];
}

export interface ViewAllEvents {
  entries?: Entries;
}
