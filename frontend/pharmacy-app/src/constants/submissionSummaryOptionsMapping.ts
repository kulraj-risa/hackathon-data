import { CmmStpStatus } from "../enums/cmmStpStatus";
import { QaFilledBy } from "../enums/qaFilledBy";
import {
  SecondStpStatus,
  SecondStpStatusLabels,
} from "../enums/secondStpStatus";
import { BadgeOption } from "./submissionSummaryOptions";

export const QA_FILLED_AND_SECOND_STP_OPTIONS_MAPPING: Record<
  string,
  BadgeOption[]
> = {
  [QaFilledBy.MANUAL]: [
    {
      id: SecondStpStatus.SENT_TO_PLAN,
      text: SecondStpStatusLabels[SecondStpStatus.SENT_TO_PLAN],
      textColor: "black",
      bgColor: "white",
    },
    {
      id: SecondStpStatus.PROVIDER_SIGN_REQ,
      text: SecondStpStatusLabels[SecondStpStatus.PROVIDER_SIGN_REQ],
      textColor: "black",
      bgColor: "white",
    },
  ],
  [QaFilledBy.BOT]: [
    {
      id: SecondStpStatus.SENT_TO_PLAN,
      text: SecondStpStatusLabels[SecondStpStatus.SENT_TO_PLAN],
      textColor: "black",

      bgColor: "white",
    },
    {
      id: SecondStpStatus.PROVIDER_SIGN_REQ,
      text: SecondStpStatusLabels[SecondStpStatus.PROVIDER_SIGN_REQ],
      textColor: "black",
      bgColor: "white",
    },
  ],
  [QaFilledBy.NOT_NEEDED]: [
    {
      id: SecondStpStatus.FIRST_STP_OUTCOME,
      text: SecondStpStatusLabels[SecondStpStatus.FIRST_STP_OUTCOME],
      textColor: "black",
      bgColor: "white",
    },
    {
      id: SecondStpStatus.WAITING_FOR_CLINICAL,
      text: SecondStpStatusLabels[SecondStpStatus.WAITING_FOR_CLINICAL],
      textColor: "black",
      bgColor: "white",
    },
    {
      id: SecondStpStatus.MISSING_DOC,
      text: SecondStpStatusLabels[SecondStpStatus.MISSING_DOC],
      textColor: "black",
      bgColor: "white",
    },
    {
      id: SecondStpStatus.FIRST_STP_NOT_SENT,
      text: SecondStpStatusLabels[SecondStpStatus.FIRST_STP_NOT_SENT],
      textColor: "black",
      bgColor: "white",
    },
  ],
};

export const SEOCND_STP_STATUS_AND_CASE_STATUS_OPTIONS_MAPPING: Record<
  string,
  BadgeOption[]
> = {
  [SecondStpStatus.SENT_TO_PLAN]: [
    {
      id: CmmStpStatus.APPROVED,
      text: CmmStpStatus.APPROVED,
      textColor: "black",
      bgColor: "white",
    },
    {
      id: CmmStpStatus.DENIED,
      text: CmmStpStatus.DENIED,
      textColor: "black",
      bgColor: "white",
    },
    {
      id: CmmStpStatus.PENDING,
      text: CmmStpStatus.PENDING,
      textColor: "black",
      bgColor: "white",
    },
  ],
  [SecondStpStatus.FIRST_STP_OUTCOME]: [
    {
      id: CmmStpStatus.APPROVED,
      text: CmmStpStatus.APPROVED,
      textColor: "black",
      bgColor: "white",
    },
    {
      id: CmmStpStatus.DENIED,
      text: CmmStpStatus.DENIED,
      textColor: "black",
      bgColor: "white",
    },
    {
      id: CmmStpStatus.AUTH_NOT_REQUIRED,
      text: CmmStpStatus.AUTH_NOT_REQUIRED,
      textColor: "black",
      bgColor: "white",
    },
    {
      id: CmmStpStatus.APPROVAL_ON_FILE,
      text: CmmStpStatus.APPROVAL_ON_FILE,
      textColor: "black",
      bgColor: "white",
    },
    {
      id: CmmStpStatus.DENIAL_ON_FILE,
      text: CmmStpStatus.DENIAL_ON_FILE,
      textColor: "black",
      bgColor: "white",
    },
    {
      id: CmmStpStatus.CASE_ON_FILE,
      text: CmmStpStatus.CASE_ON_FILE,
      textColor: "black",
      bgColor: "white",
    },
    {
      id: CmmStpStatus.NOT_CORRECT_PROCESSOR,
      text: CmmStpStatus.NOT_CORRECT_PROCESSOR,
      textColor: "black",
      bgColor: "white",
    },
    {
      id: CmmStpStatus.DRUG_NOT_COVERED,
      text: CmmStpStatus.DRUG_NOT_COVERED,
      textColor: "black",
      bgColor: "white",
    },
    {
      id: CmmStpStatus.NA_OUTCOME,
      text: CmmStpStatus.NA_OUTCOME,
      textColor: "black",
      bgColor: "white",
    },
  ],
  [SecondStpStatus.WAITING_FOR_CLINICAL]: [
    {
      id: CmmStpStatus.ONSHORE_ASSISTANCE,
      text: CmmStpStatus.ONSHORE_ASSISTANCE,
      textColor: "black",
      bgColor: "white",
    },
  ],
  [SecondStpStatus.PROVIDER_SIGN_REQ]: [
    {
      id: CmmStpStatus.ONSHORE_ASSISTANCE,
      text: CmmStpStatus.ONSHORE_ASSISTANCE,
      textColor: "black",
      bgColor: "white",
    },
  ],
  [SecondStpStatus.MISSING_DOC]: [
    {
      id: CmmStpStatus.ONSHORE_ASSISTANCE,
      text: CmmStpStatus.ONSHORE_ASSISTANCE,
      textColor: "black",
      bgColor: "white",
    },
  ],
  [SecondStpStatus.FIRST_STP_NOT_SENT]: [
    {
      id: CmmStpStatus.ONSHORE_ASSISTANCE,
      text: CmmStpStatus.ONSHORE_ASSISTANCE,
      textColor: "black",
      bgColor: "white",
    },
  ],
};
