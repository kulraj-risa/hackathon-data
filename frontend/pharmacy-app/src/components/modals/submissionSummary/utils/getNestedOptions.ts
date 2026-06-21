import {
  BadgeOption,
  CASE_STATUS_OPTIONS,
  SECOND_STP_STATUS_OPTIONS,
} from "../../../../constants/submissionSummaryOptions";
import {
  QA_FILLED_AND_SECOND_STP_OPTIONS_MAPPING,
  SEOCND_STP_STATUS_AND_CASE_STATUS_OPTIONS_MAPPING,
} from "../../../../constants/submissionSummaryOptionsMapping";
import { QaFilledBy } from "../../../../enums/qaFilledBy";
import { SecondStpStatus } from "../../../../enums/secondStpStatus";

/**
 * Retrieves the available Second STP Status options based on the selected QA Filled By value.
 *
 * This function implements a cascading dropdown logic where the available
 * Second STP Status options depend on who filled the QA form.
 *
 * @param {QaFilledBy} qaFilledBy - The selected QA Filled By value (MANUAL, BOT, or NOT_NEEDED)
 * @returns {BadgeOption[]} An array of badge options for the Second STP Status dropdown.
 *                          Returns the full SECOND_STP_STATUS_OPTIONS if no matching mapping is found.
 *
 * @example
 * // Get options when QA was filled manually
 * const options = getNestedOptionsForSecondStpStatus(QaFilledBy.MANUAL);
 */
export const getNestedOptionsForSecondStpStatus = (
  qaFilledBy: QaFilledBy,
): BadgeOption[] => {
  switch (qaFilledBy) {
    case QaFilledBy.MANUAL:
      return QA_FILLED_AND_SECOND_STP_OPTIONS_MAPPING[QaFilledBy.MANUAL];
    case QaFilledBy.BOT:
      return QA_FILLED_AND_SECOND_STP_OPTIONS_MAPPING[QaFilledBy.BOT];
    case QaFilledBy.NOT_NEEDED:
      return QA_FILLED_AND_SECOND_STP_OPTIONS_MAPPING[QaFilledBy.NOT_NEEDED];
    default:
      return SECOND_STP_STATUS_OPTIONS;
  }
};

/**
 * Retrieves the available Case Status options based on the selected Second STP Status value.
 *
 * This function implements a cascading dropdown logic where the available
 * Case Status options depend on the selected Second STP Status.
 *
 * @param {SecondStpStatus} secondStpStatus - The selected Second STP Status value
 *        (SENT_TO_PLAN, FIRST_STP_OUTCOME, WAITING_FOR_CLINICAL, PROVIDER_SIGN_REQ, MISSING_DOC, or FIRST_STP_NOT_SENT)
 * @returns {BadgeOption[]} An array of badge options for the Case Status dropdown.
 *                          Returns the full CASE_STATUS_OPTIONS if no matching mapping is found.
 *
 * @example
 * // Get case status options when second STP status is "Sent to Plan"
 * const options = getNestedOptionsForCaseStatus(SecondStpStatus.SENT_TO_PLAN);
 */
export const getNestedOptionsForCaseStatus = (
  secondStpStatus: SecondStpStatus,
): BadgeOption[] => {
  switch (secondStpStatus) {
    case SecondStpStatus.SENT_TO_PLAN:
      return SEOCND_STP_STATUS_AND_CASE_STATUS_OPTIONS_MAPPING[
        SecondStpStatus.SENT_TO_PLAN
      ];
    case SecondStpStatus.FIRST_STP_OUTCOME:
      return SEOCND_STP_STATUS_AND_CASE_STATUS_OPTIONS_MAPPING[
        SecondStpStatus.FIRST_STP_OUTCOME
      ];
    case SecondStpStatus.WAITING_FOR_CLINICAL:
      return SEOCND_STP_STATUS_AND_CASE_STATUS_OPTIONS_MAPPING[
        SecondStpStatus.WAITING_FOR_CLINICAL
      ];
    case SecondStpStatus.PROVIDER_SIGN_REQ:
      return SEOCND_STP_STATUS_AND_CASE_STATUS_OPTIONS_MAPPING[
        SecondStpStatus.PROVIDER_SIGN_REQ
      ];
    case SecondStpStatus.MISSING_DOC:
      return SEOCND_STP_STATUS_AND_CASE_STATUS_OPTIONS_MAPPING[
        SecondStpStatus.MISSING_DOC
      ];
    case SecondStpStatus.FIRST_STP_NOT_SENT:
      return SEOCND_STP_STATUS_AND_CASE_STATUS_OPTIONS_MAPPING[
        SecondStpStatus.FIRST_STP_NOT_SENT
      ];
    default:
      return CASE_STATUS_OPTIONS;
  }
};
