export enum CmmStatusType {
  SUCCESS = "success",
  ERROR = "error",
  WARNING = "warning",
  NO_STATUS = "no status",
}

export enum SubmissionStatusHeaderText {
  SUBMISSION_IN_PROGRESS = "Submission in progress/waiting for response",
  SUBMISSION_APPROVED = "Status Approved",
  SUBMISSION_HAS_ACCES_TO_MED = "Already has access to the medication",
  SUBMISSION_DRUG_NOT_COVERED = "Drug not covered",
  SUBMISSION_INCORRECT_PBM = "Incorrect PBM",
  SUBMISSION_ALREADY_DENIED = "Already denied previously",
  SUBMISSION_NOT_VIA_ELECTRONICALLY = "Cannot be processed electronically",
  SUBMISSION_INFORMATION = "Information",
  SUBMISSION_CLINICAL_QUESTIONS_READY = "Clinical Questions Are Ready",
}
