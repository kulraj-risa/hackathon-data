import { HealthCareFacility } from "risa-data-model";

export interface HealthCareFacilityModel extends HealthCareFacility {
  client_id?: string;
  is_external_organization?: boolean;
  organization_id?: string;
  emr_name?: string;
  fhir_client?: string;
  RisaFaxNumber?: string;
  RisaPhoneNumber?: string;
  updated_at?: string;
  updated_by?: string;
  analytics_url?: string;
}
