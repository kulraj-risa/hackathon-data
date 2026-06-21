export enum DiagnosisSource {
  ONCO_EMR = "onco_emr",
  CLINICAL_ATTACHMENT = "clinical_attachment",
  ONCO_EMR_FDA = "onco_emr_fda",
  CLINICAL_ATTACHMENT_FDA = "clinical_attachment_fda",
}

export const DiagnosisSourceDisplayNames = {
  [DiagnosisSource.ONCO_EMR]: "Onco EMR",
  [DiagnosisSource.CLINICAL_ATTACHMENT]: "Clinical Attachment",
  [DiagnosisSource.ONCO_EMR_FDA]: "Onco EMR FDA",
  [DiagnosisSource.CLINICAL_ATTACHMENT_FDA]: "Clinical Attachment FDA",
} as const;
