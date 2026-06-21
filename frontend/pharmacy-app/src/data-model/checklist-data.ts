import { Checklist } from "risa-data-model";

export interface ChecklistDataWithStatus {
  status?: "success" | "failure" | "in_progress" | "not_required" | undefined;
  data?: Checklist;
  id?: string;
}
