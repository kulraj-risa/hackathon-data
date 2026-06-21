export interface CmmDiffDataModel {
  check_number?: number;
  checkpoint?: string;
  created_at?: string;
  data?: {
    cmm_input?: Record<string, any>[];
    questionnaire: Record<string, any>[];
  };
  differences_from_baseline?: {
    cmm_input?: Record<string, any>[];
    questionnaire?: Record<string, any>[];
  };
  screenshot_path?: string;
  snapshot_id?: string;
}
