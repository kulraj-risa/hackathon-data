import {
  CmmStatusType,
  SubmissionStatusHeaderText,
} from "../enums/cmmStatusType";

export interface CmmStatusModel {
  type: CmmStatusType;
  message: string;
  status: SubmissionStatusHeaderText;
}
