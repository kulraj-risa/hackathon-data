import { ServiceReview } from "risa-data-model";
import { SingleQuestionModel } from "./formQuestions";

export enum SubmissionDocsId {
  SingleQuestion = "questionnaire",
  ServiceReview = "service_review",
  SubmissionStatus = "submission_status",
}

export interface SubmissionDocs {
  [SubmissionDocsId.SingleQuestion]?: SingleQuestionModel;
  [SubmissionDocsId.ServiceReview]?: ServiceReview;
  [SubmissionDocsId.SubmissionStatus]?: SubmissionStatusDoc;
}

export interface SubmissionStatusDoc {
  results?: SubmissionStatus[];
  status: string;
}

export interface SubmissionStatus {
  cpt_code?: string;
  description?: string;
  auth_required?: boolean;
  authorization_number?: string;
  tracking_number?: string;
}

export type SubmissionStatusEnum =
  | "initiated"
  | "in_progress"
  | "submitted"
  | "error"
  | "not_required"
  | "pending"
  | "completed";
