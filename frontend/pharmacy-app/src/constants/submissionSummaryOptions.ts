import { CmmStpStatus } from "../enums/cmmStpStatus";
import { PocAssignee, PocAssigneeLabels } from "../enums/pocAssignee";
import { QaFilledBy, QaFilledByLabels } from "../enums/qaFilledBy";
import {
  SecondStpStatus,
  SecondStpStatusLabels,
} from "../enums/secondStpStatus";

export interface BadgeOption {
  id: string;
  text: string;
  textColor: string;
  bgColor: string;
}

export const QA_FILLED_BY_OPTIONS: BadgeOption[] = [
  {
    id: QaFilledBy.MANUAL,
    text: QaFilledByLabels[QaFilledBy.MANUAL],
    textColor: "black",
    bgColor: "white",
  },
  {
    id: QaFilledBy.BOT,
    text: QaFilledByLabels[QaFilledBy.BOT],
    textColor: "black",
    bgColor: "white",
  },
  {
    id: QaFilledBy.NOT_NEEDED,
    text: QaFilledByLabels[QaFilledBy.NOT_NEEDED],
    textColor: "black",
    bgColor: "white",
  },
];

export const SECOND_STP_STATUS_OPTIONS: BadgeOption[] = [
  {
    id: SecondStpStatus.SENT_TO_PLAN,
    text: SecondStpStatusLabels[SecondStpStatus.SENT_TO_PLAN],
    textColor: "black",
    bgColor: "white",
  },
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
    id: SecondStpStatus.PROVIDER_SIGN_REQ,
    text: SecondStpStatusLabels[SecondStpStatus.PROVIDER_SIGN_REQ],
    textColor: "black",
    bgColor: "white",
  },
  {
    id: SecondStpStatus.MISSING_DOC,
    text: SecondStpStatusLabels[SecondStpStatus.MISSING_DOC],
    textColor: "black",
    bgColor: "white",
  },
];

export const CASE_STATUS_OPTIONS: BadgeOption[] = [
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
  {
    id: CmmStpStatus.ONSHORE_ASSISTANCE,
    text: CmmStpStatus.ONSHORE_ASSISTANCE,
    textColor: "black",
    bgColor: "white",
  },
];

export const POC_OPTIONS: BadgeOption[] = [
  {
    id: PocAssignee.TANMAY,
    text: PocAssigneeLabels[PocAssignee.TANMAY],
    textColor: "black",
    bgColor: "white",
  },
  {
    id: PocAssignee.AAMER,
    text: PocAssigneeLabels[PocAssignee.AAMER],
    textColor: "black",
    bgColor: "white",
  },
  {
    id: PocAssignee.PRINCE,
    text: PocAssigneeLabels[PocAssignee.PRINCE],
    textColor: "black",
    bgColor: "white",
  },
  {
    id: PocAssignee.MONICA,
    text: PocAssigneeLabels[PocAssignee.MONICA],
    textColor: "black",
    bgColor: "white",
  },
  {
    id: PocAssignee.SAGAR,
    text: PocAssigneeLabels[PocAssignee.SAGAR],
    textColor: "black",
    bgColor: "white",
  },
  {
    id: PocAssignee.CLARINA,
    text: PocAssigneeLabels[PocAssignee.CLARINA],
    textColor: "black",
    bgColor: "white",
  },
  {
    id: PocAssignee.PRIYANKA,
    text: PocAssigneeLabels[PocAssignee.PRIYANKA],
    textColor: "black",
    bgColor: "white",
  },
  {
    id: PocAssignee.SANA,
    text: PocAssigneeLabels[PocAssignee.SANA],
    textColor: "black",
    bgColor: "white",
  },
  {
    id: PocAssignee.AKSHITH,
    text: PocAssigneeLabels[PocAssignee.AKSHITH],
    textColor: "black",
    bgColor: "white",
  },
];
