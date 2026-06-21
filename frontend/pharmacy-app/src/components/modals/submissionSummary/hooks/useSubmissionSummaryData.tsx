import { useCallback, useState } from "react";

/**
 * Represents the data structure for a submission summary form.
 * @interface SubmissionSummaryData
 * @property {string} qaFilledBy - Identifier for who filled the QA
 * @property {string} secondStpStatus - The secondary STP status value
 * @property {string} caseStatus - The current case status
 * @property {string} poc - Point of contact identifier
 * @property {string} comments - Additional comments for the submission
 * @property {string} key - Unique identifier for the submission
 */
interface SubmissionSummaryData {
  qaFilledBy: string;
  secondStpStatus: string;
  caseStatus: string;
  poc: string;
  comments: string;
  key: string;
}

/**
 * Enum containing the keys used in SubmissionSummaryData.
 * @enum {string}
 */
export enum SubmissionSummaryDataKeys {
  QA_FILLED_BY = "qaFilledBy",
  SECOND_STP_STATUS = "secondStpStatus",
  CASE_STATUS = "caseStatus",
  POC = "poc",
  COMMENTS = "comments",
  KEY = "key",
}

/**
 * Custom hook to manage submission summary form data with cascading field resets.
 *
 * This hook provides state management for a submission summary form where certain
 * field changes trigger resets of dependent fields:
 * - Changing `qaFilledBy` resets both `secondStpStatus` and `caseStatus`
 * - Changing `secondStpStatus` resets `caseStatus`
 *
 * @param {string} key - Unique identifier for the submission summary
 * @returns {Object} An object containing:
 * @returns {SubmissionSummaryData} submissionSummaryData - Current form state
 * @returns {(id: string, value: string) => void} handleSubmissionSummaryDataChange - Generic handler for updating any field
 * @returns {(id: string) => void} handleQaFilledByChange - Handler for qaFilledBy changes (resets secondStpStatus and caseStatus)
 * @returns {(id: string) => void} handleSecondStpStatusChange - Handler for secondStpStatus changes (resets caseStatus)
 * @returns {boolean} isFormValid - Whether all required fields are filled
 *
 * @example
 * const {
 *   submissionSummaryData,
 *   handleSubmissionSummaryDataChange,
 *   handleQaFilledByChange,
 *   handleSecondStpStatusChange,
 *   isFormValid
 * } = useSubmissionSummaryData("submission-123");
 */
export const useSubmissionSummaryData = (key: string) => {
  const [submissionSummaryData, setSubmissionSummaryData] =
    useState<SubmissionSummaryData>({
      [SubmissionSummaryDataKeys.QA_FILLED_BY]: "",
      [SubmissionSummaryDataKeys.SECOND_STP_STATUS]: "",
      [SubmissionSummaryDataKeys.CASE_STATUS]: "",
      [SubmissionSummaryDataKeys.POC]: "",
      [SubmissionSummaryDataKeys.COMMENTS]: "",
      [SubmissionSummaryDataKeys.KEY]: key,
    });

  const handleSubmissionSummaryDataChange = useCallback(
    (id: string, value: string) => {
      setSubmissionSummaryData((prev) => ({
        ...prev,
        [id]: value,
      }));
    },
    [],
  );

  const handleQaFilledByChange = useCallback((id: string) => {
    setSubmissionSummaryData((prev) => ({
      ...prev,
      [SubmissionSummaryDataKeys.QA_FILLED_BY]: id,
      [SubmissionSummaryDataKeys.SECOND_STP_STATUS]: "",
      [SubmissionSummaryDataKeys.CASE_STATUS]: "",
    }));
  }, []);

  const handleSecondStpStatusChange = useCallback((id: string) => {
    setSubmissionSummaryData((prev) => ({
      ...prev,
      [SubmissionSummaryDataKeys.SECOND_STP_STATUS]: id,
      [SubmissionSummaryDataKeys.CASE_STATUS]: "",
    }));
  }, []);

  const isFormValid =
    submissionSummaryData.key !== "" &&
    submissionSummaryData.qaFilledBy !== "" &&
    submissionSummaryData.secondStpStatus !== "" &&
    submissionSummaryData.caseStatus !== "" &&
    submissionSummaryData.poc !== "";

  return {
    submissionSummaryData,
    handleSubmissionSummaryDataChange,
    handleQaFilledByChange,
    handleSecondStpStatusChange,
    isFormValid,
  };
};
