import { useState } from "react";
import { controlToastState, Modal, TextInput } from "risa-oasis-ui_v2";

import {
  POC_OPTIONS,
  QA_FILLED_BY_OPTIONS,
} from "../../../constants/submissionSummaryOptions";
import { PharmaStpFileModel } from "../../../data-model/nycbsPharmaOrder";
import { ModalId } from "../../../enums/modalId";
import { NycbsPharmaOrderKeys } from "../../../enums/nycbsPharmaOrder";
import { QaFilledBy } from "../../../enums/qaFilledBy";
import { SecondStpStatus } from "../../../enums/secondStpStatus";
import BadgeDropdown from "../../badgeDropdown/badgeDropdown";
import LabelValueRow from "../../labelValueRow/labelValueRow";
import { onSubmissionSave } from "./actionHandlers/onSubmissionSave";
import {
  SubmissionSummaryDataKeys,
  useSubmissionSummaryData,
} from "./hooks/useSubmissionSummaryData";
import {
  getNestedOptionsForCaseStatus,
  getNestedOptionsForSecondStpStatus,
} from "./utils/getNestedOptions";
interface SubmissionSummaryProps {
  onClose: () => void;
  metaData: {
    data: PharmaStpFileModel;
  };
  onSuccess?: () => void;
}

const SubmissionSummary = (props: SubmissionSummaryProps) => {
  const { data } = props.metaData;

  const {
    submissionSummaryData,
    handleSubmissionSummaryDataChange,
    handleQaFilledByChange,
    handleSecondStpStatusChange,
    isFormValid,
  } = useSubmissionSummaryData(
    data?.[NycbsPharmaOrderKeys.CmmResultKey] || data?.covermymed_id || "",
  );
  const [resetCounter, setResetCounter] = useState<{
    secondStpStatus: number;
    caseStatus: number;
  }>({
    secondStpStatus: 0,
    caseStatus: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSave = async () => {
    setIsLoading(true);
    await onSubmissionSave({
      data,
      qaFilledBy: submissionSummaryData.qaFilledBy,
      secondStpStatus: submissionSummaryData.secondStpStatus,
      caseStatus: submissionSummaryData.caseStatus,
      poc: submissionSummaryData.poc,
      comments: submissionSummaryData.comments,
      key: submissionSummaryData.key,
      onSuccess: () => {
        controlToastState("submission-summary-save-success");
        props.onSuccess?.();
        props.onClose();
      },
      onError: (error) => {
        console.error("Error saving submission:", error);
        controlToastState("submission-summary-save-error");
      },
    });
    setIsLoading(false);
  };

  return (
    <Modal
      dialogId={ModalId.SUBMISSION_SUMMARY_MODAL}
      title={"Submission Summary"}
      saveButtonText={isLoading ? "Submitting..." : "Submit"}
      cancelText={"Cancel"}
      onCancel={props.onClose}
      onClose={props.onClose}
      onSave={handleSave}
      disableSave={!isFormValid || isLoading}
    >
      <div className="flex flex-col gap-1">
        <div className="flex flex-col gap-2">
          <LabelValueRow label="MRN:">
            <div className="text-sm font-normal text-primaryGray-2">
              {data?.[NycbsPharmaOrderKeys.PatientMrn]}
            </div>
          </LabelValueRow>

          <LabelValueRow label="Drug:">
            <div className="text-sm font-normal text-primaryGray-2">
              {data?.[NycbsPharmaOrderKeys.DrugNameOncoEmr] || data?.drug}
            </div>
          </LabelValueRow>

          <LabelValueRow label="Key:">
            <TextInput
              id="key-input"
              label="Key"
              hideLabel={true}
              defaultValue={submissionSummaryData.key}
              onChange={(e) =>
                handleSubmissionSummaryDataChange("key", e.value)
              }
            />
          </LabelValueRow>
        </div>

        <div className="flex flex-col justify-center gap-2">
          <LabelValueRow label="QA Filled By:">
            <BadgeDropdown
              badgeList={QA_FILLED_BY_OPTIONS}
              showBorder={true}
              borderColor="#A8A8A8"
              onClick={(id: string) => {
                handleQaFilledByChange(id);
                setResetCounter((prev) => ({
                  ...prev,
                  secondStpStatus: prev.secondStpStatus + 1,
                  caseStatus: prev.caseStatus + 1,
                }));
              }}
            />
          </LabelValueRow>

          <LabelValueRow label="Second STP Status:">
            <BadgeDropdown
              badgeList={getNestedOptionsForSecondStpStatus(
                submissionSummaryData.qaFilledBy as QaFilledBy,
              )}
              showBorder={true}
              borderColor="#A8A8A8"
              onClick={(id: string) => {
                handleSecondStpStatusChange(id);
                setResetCounter((prev) => ({
                  ...prev,
                  caseStatus: prev.caseStatus + 1,
                }));
              }}
              resetCounter={resetCounter.secondStpStatus}
            />
          </LabelValueRow>

          <LabelValueRow label="Case Status:">
            <BadgeDropdown
              badgeList={getNestedOptionsForCaseStatus(
                submissionSummaryData.secondStpStatus as SecondStpStatus,
              )}
              showBorder={true}
              borderColor="#A8A8A8"
              onClick={(id: string) => {
                handleSubmissionSummaryDataChange(
                  SubmissionSummaryDataKeys.CASE_STATUS,
                  id,
                );
              }}
              resetCounter={resetCounter.caseStatus}
            />
          </LabelValueRow>

          <LabelValueRow label="POC:" showDivider={false}>
            <BadgeDropdown
              badgeList={POC_OPTIONS}
              showBorder={true}
              borderColor="#A8A8A8"
              onClick={(id: string) => {
                handleSubmissionSummaryDataChange(
                  SubmissionSummaryDataKeys.POC,
                  id,
                );
              }}
            />
          </LabelValueRow>
        </div>
        <div className="my-2">
          <TextInput
            label="Comments"
            placeholder="Enter submission summary"
            id="submission-summary-input"
            defaultValue={submissionSummaryData.comments}
            onChange={(e) =>
              handleSubmissionSummaryDataChange(
                SubmissionSummaryDataKeys.COMMENTS,
                e.value,
              )
            }
          />
        </div>
      </div>
    </Modal>
  );
};

export default SubmissionSummary;
