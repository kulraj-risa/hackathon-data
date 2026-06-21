import { HealthCareFacilityModel } from "./healthFacility";

export interface ClientConfigModel extends HealthCareFacilityModel {
  name?: string;
  created_at?: string;
  updated_at?: string;
  updated_by?: string;
}
