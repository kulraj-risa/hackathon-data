export enum SecondStpStatus {
  SENT_TO_PLAN = "sent_to_plan",
  FIRST_STP_OUTCOME = "first_stp_outcome",
  WAITING_FOR_CLINICAL = "waiting_for_clinical",
  PROVIDER_SIGN_REQ = "provider_sign_req",
  MISSING_DOC = "missing_doc",
  FIRST_STP_NOT_SENT = "first_stp_not_sent",
}

export const SecondStpStatusLabels: Record<SecondStpStatus, string> = {
  [SecondStpStatus.SENT_TO_PLAN]: "Sent To Plan",
  [SecondStpStatus.FIRST_STP_OUTCOME]: "1st STP Outcome",
  [SecondStpStatus.WAITING_FOR_CLINICAL]: "Waiting For Clinical",
  [SecondStpStatus.PROVIDER_SIGN_REQ]: "Provider Sign Req",
  [SecondStpStatus.MISSING_DOC]: "Missing Doc",
  [SecondStpStatus.FIRST_STP_NOT_SENT]: "1st STP - Not Sent",
};
