import Fuse from "fuse.js";
import { CmmStatusModel } from "../data-model/cmmStatusModel";
import {
  CmmStatusType,
  SubmissionStatusHeaderText,
} from "../enums/cmmStatusType";
import { logDataToConsole } from "../utils/customLogger";

const fuzzySearchOptions = {
  includeScore: true,
  threshold: 0.5,
  distance: 400,
  useExtendedSearch: true,
  keys: ["message"],
};

export const CmmStatusMessageBeforeSendToPlan: CmmStatusModel[] = [
  {
    type: CmmStatusType.WARNING,
    message:
      "Caremark is processing your PA request and will respond shortly with next steps. You are currently using the fastest method to process this prior authorization. Please do not fax or call Caremark to resubmit this request. To check for an update later, open this request again from your dashboard.",
    status: SubmissionStatusHeaderText.SUBMISSION_IN_PROGRESS,
  },
  {
    type: CmmStatusType.WARNING,
    message:
      "The demographic data for this request is being submitted to Caremark Medicare Part D.",
    status: SubmissionStatusHeaderText.SUBMISSION_IN_PROGRESS,
  },
  {
    type: CmmStatusType.WARNING,
    message:
      "The demographic data for this request is being submitted to Fidelis Care.",
    status: SubmissionStatusHeaderText.SUBMISSION_IN_PROGRESS,
  },
  {
    type: CmmStatusType.WARNING,
    message:
      "The demographic data for this request is being submitted to Express Scripts.",
    status: SubmissionStatusHeaderText.SUBMISSION_IN_PROGRESS,
  },
  {
    type: CmmStatusType.WARNING,
    message:
      "Your demographic data has been sent to Caremark successfully! Caremark typically takes up to one hour to respond, but it may take a little longer in some cases. You will be notified by email when available. You can also check for an update later by opening this request from your dashboard. Please do not fax or call Caremark to resubmit this request. If you need assistance, please chat with CoverMyMeds or call us at [1-866-452-5017](tel:18664525017). If it has been longer than 24 hours, please reach out to Caremark.",
    status: SubmissionStatusHeaderText.SUBMISSION_IN_PROGRESS,
  },
  {
    type: CmmStatusType.WARNING,
    message:
      "Wait for Questions. Caremark NCPDP 2017 typically responds with questions in less than 15 minutes, but may take up to 24 hours.",
    status: SubmissionStatusHeaderText.SUBMISSION_IN_PROGRESS,
  },
  {
    type: CmmStatusType.WARNING,
    message:
      "The Pharmacy benefit of this member is carved out to FFS vendor for processing.",
    status: SubmissionStatusHeaderText.SUBMISSION_IN_PROGRESS,
  },
  {
    type: CmmStatusType.WARNING,
    message:
      "Your demographic data has been sent to Express Scripts. Please wait while we retrieve the set of questions required to initiate the PA request",
    status: SubmissionStatusHeaderText.SUBMISSION_IN_PROGRESS,
  },
  {
    type: CmmStatusType.SUCCESS,
    message:
      "Caremark is unable to send clinical questionnaires, Please see the information below : Your PA has been resolved, no additional PA is required. For further inquiries please contact the number on the back of the member prescription card. (Message 1005)",
    status: SubmissionStatusHeaderText.SUBMISSION_APPROVED,
  },
  {
    type: CmmStatusType.SUCCESS,
    message:
      "Drug is covered by current benefit plan. No further PA activity needed",
    status: SubmissionStatusHeaderText.SUBMISSION_APPROVED,
  },
  {
    type: CmmStatusType.SUCCESS,
    message:
      "The patient currently has access to the requested medication and a Prior Authorization is not needed for the patient/medication",
    status: SubmissionStatusHeaderText.SUBMISSION_HAS_ACCES_TO_MED,
  },
  {
    type: CmmStatusType.SUCCESS,
    message:
      "This medication or product was previously approved on PA-E7179694 from 2025-04-08 to 2025-12-31. **Please note: This request was submitted electronically. Formulary lowering, tiering exception, cost reduction and/or pre-benefit determination review (including prospective Medicare hospice reviews) requests cannot be requested using this method of submission. Providers contact us at 1-800-711-4555 for further assistance.",
    status: SubmissionStatusHeaderText.SUBMISSION_HAS_ACCES_TO_MED,
  },
  {
    type: CmmStatusType.SUCCESS,
    message:
      "Clinical Questions Are Ready. Fill out the questions below and click Send to Plan. The plan requires answers to the clinical questions for this electronic prior authorization.",
    status: SubmissionStatusHeaderText.SUBMISSION_CLINICAL_QUESTIONS_READY,
  },
  {
    type: CmmStatusType.ERROR,
    message: "Drug is not covered by plan.",
    status: SubmissionStatusHeaderText.SUBMISSION_DRUG_NOT_COVERED,
  },
  {
    type: CmmStatusType.ERROR,
    message:
      "Information regarding your request. Caremark is not the processor for this request.For additional information, please contact customer service using the number on the back of the benefit card.",
    status: SubmissionStatusHeaderText.SUBMISSION_INCORRECT_PBM,
  },
  {
    type: CmmStatusType.ERROR,
    message:
      "Information regarding your request. ESI does not manage prior authorizations for this patient. Please resubmit the ePA request to Centene.",
    status: SubmissionStatusHeaderText.SUBMISSION_INCORRECT_PBM,
  },
  {
    type: CmmStatusType.ERROR,
    message:
      "CVS Caremark was not able to process the request because the previous Prior Authorization Request was Denied",
    status: SubmissionStatusHeaderText.SUBMISSION_ALREADY_DENIED,
  },
  {
    type: CmmStatusType.ERROR,
    message:
      "Information regarding your request.Electronic Prior Authorization not available for this member. Please call: 800-935-6103",
    status: SubmissionStatusHeaderText.SUBMISSION_NOT_VIA_ELECTRONICALLY,
  },
];

export const getMostMatchedStatusFromGivenComment = (comment: string) => {
  const fuse = new Fuse(CmmStatusMessageBeforeSendToPlan, fuzzySearchOptions);
  const result = fuse.search(comment);
  if (result.length > 0) {
    logDataToConsole(JSON.stringify(result));
    const status = result[0]?.item?.status;
    const type = result[0]?.item?.type;
    return {
      type: type,
      message: comment,
      status: status,
    };
  }
  return {
    type: CmmStatusType.NO_STATUS,
    message: comment,
    status: SubmissionStatusHeaderText.SUBMISSION_INFORMATION,
  };
};
