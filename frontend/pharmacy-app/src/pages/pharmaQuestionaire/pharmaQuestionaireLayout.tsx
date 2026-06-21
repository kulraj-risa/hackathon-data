import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { Button, closeModal, Footer, openModal } from "risa-oasis-ui_v2";
import { v4 as uuidv4 } from "uuid";
import { updateQuestionaireResponse } from "../../api/bigQuery/nycbsPharmaOrders";
import { fetchBqRecordByIdentifier } from "../../api/bigQuery/paCasesBigQuery";
import {
  getFileFromRapidsStorage,
  getRapidsFileDownloadUrl,
} from "../../api/firebase/rapidsFirestore";
import Breadcrumb, {
  buildBreadcrumbItems,
} from "../../components/breadcrumb/Breadcrumb";
import { LoaderMessage } from "../../components/loaderMessage/loaderMessage";
import DocumentsModal from "../../components/modals/documentsModal/documentsModal";
import SubmissionSummary from "../../components/modals/submissionSummary/submissionSummary";
import PdfRender from "../../components/pdfRender/pdfRender";
import { PharmaStpFileModel } from "../../data-model/nycbsPharmaOrder";
import { PharmaQuestionModel } from "../../data-model/pharmaQuestion";
import { ModalId } from "../../enums/modalId";
import { NycbsPharmaOrderKeys } from "../../enums/nycbsPharmaOrder";
import { ScreenNames } from "../../enums/screenNames";
import { fetchSingleOrderDetailsForCmm } from "../../redux/slice/cmm/cmmSingleOrderSlice";
import { fetchAllQuestionFromBigQuery } from "../../redux/slice/cmm/pharmaQuestionsSlice";
import { uploadFileToFirebaseStorage } from "../../redux/slice/fileUploadSliceNew";
import { setOpenedModalId } from "../../redux/slice/modalSliceNew";
import { AppDispatch, RootState } from "../../redux/store/store";
import { CopyIcon } from "../../svg/copy-icon";
import { calculateAge } from "../../utils/ageCalculator";
import { logDataToConsole } from "../../utils/customLogger";
import { generateFullName } from "../../utils/generateOrderDataForTable";
import { capitalizeString } from "../../utils/stringModifications";
import MedicalNecessityAgents from "./components/medicalNecessityAgents";
import PharmaQuestions from "./components/pharmaQuestions";
import { mergePdfs } from "./utils/pdfMerger";
import {
  generateTimestamp,
  processQuestions,
} from "./utils/pharamaQuestionHelper";

const PharmaQuestionaireLayout = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    data: pharmaQuestionaire,
    loading,
    error,
  } = useSelector((state: RootState) => state.pharmaQuestions);
  const { data: singleCmmOrderData, loading: singleCmmOrderDataLoading } =
    useSelector((state: RootState) => state.cmmSingleOrder);

  const [questionaire, setQuestionaire] = useState<PharmaQuestionModel[]>([]);
  const { id } = useParams();
  const [questionsWithResponse, setQuestionsWithResponse] = useState<
    PharmaQuestionModel[]
  >([]);
  const [url, setUrl] = useState<string | null>(null);
  const [documents, setDocuments] = useState<File[]>([]);
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setIsOpenModal] = useState<boolean>(false);
  const [errorInFetching, setErrorInFetching] = useState<boolean>(false);
  const [isFetchingDoc, setIsFetchingDoc] = useState<boolean>(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [activeDocTab, setActiveDocTab] = useState<
    "clinical_document" | "clinical_summary"
  >("clinical_document");
  const [clinicalSummaryPdfUrl, setClinicalSummaryPdfUrl] = useState<
    string | null
  >(null);
  const [clinicalSummaryDoc, setClinicalSummaryDoc] = useState<File | null>(
    null,
  );
  const [isFetchingSummaryDoc, setIsFetchingSummaryDoc] =
    useState<boolean>(false);
  const [errorInFetchingSummary, setErrorInFetchingSummary] =
    useState<boolean>(false);
  const [hasClinicalSummary, setHasClinicalSummary] = useState<boolean>(false);
  const { downloadURL } = useSelector(
    (state: RootState) => state.fileUploading,
  );
  const { user } = useSelector(
    (state: RootState) => state.firebaseAuthentication,
  );
  const { openedModalId } = useSelector(
    (state: RootState) => state.modalSliceNew,
  );

  const [responseStatusInfo, setResponseStatusInfo] = useState<any>(null);
  const [suggestedActions, setSuggestedActions] = useState<any[]>([]);
  const [outcomePrediction, setOutcomePrediction] = useState<any[]>([]);
  const [denialPrediction, setDenialPrediction] = useState<any>(null);
  const [bqDataLoading, setBqDataLoading] = useState(true);
  const [showDenialPredictionModal, setShowDenialPredictionModal] =
    useState(false);
  const [showAgentsDrawer, setShowAgentsDrawer] = useState(false);
  const [qaConfidence, setQaConfidence] = useState<number | null>(null);

  const unSubscriberRef = useRef<Promise<() => void>[]>([]);
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleCancelClick = () => {
    logDataToConsole("Cancel clicked");
    handleGoBack();
  };

  const uuid = useMemo(() => uuidv4(), []);

  // Case context fed to the Medical Necessity Engine (multi-agent reasoning).
  const necessityDrug =
    (singleCmmOrderData?.[NycbsPharmaOrderKeys.DrugNameOncoEmr] as string) || "";
  const necessityPayer =
    (singleCmmOrderData?.[NycbsPharmaOrderKeys.PlanName] as string) || "";
  const { supportiveTexts, contradictoryTexts } = useMemo(() => {
    const sup: string[] = [];
    const con: string[] = [];
    (questionaire || []).forEach((q) => {
      const facts = q?.api_response?.facts;
      (facts?.supportive_facts || []).forEach((f) => f && sup.push(f));
      (facts?.contradictory_facts || []).forEach((f) => f && con.push(f));
    });
    return { supportiveTexts: sup, contradictoryTexts: con };
  }, [questionaire]);

  const blobToFile = (blob: Blob, fileName: string): File => {
    return new File([blob], fileName, { type: blob.type });
  };

  const handleSubmitClick = async () => {
    if (questionaire && questionaire.length > 0) {
      setSubmitting(true);
      const mergedDocInfo = await mergePdfs(documents);
      if (mergedDocInfo) {
        dispatch(
          uploadFileToFirebaseStorage(
            blobToFile(mergedDocInfo.mergedPdf, `${uuid}.pdf`),
            "onco_emr/" +
              pharmaQuestionaire?.identifier +
              `/additional_docs/${uuid}.pdf`,
          ),
        );
      }
    }
  };

  const fetchDownloadUrl = async (refUrl: string) => {
    setIsFetchingDoc(true);
    try {
      const downloadUrl = await getRapidsFileDownloadUrl(refUrl);
      setUrl(downloadUrl);
      const downloadedDocument = await getFileFromRapidsStorage(refUrl);
      setDocuments([downloadedDocument]);
    } catch (err) {
      logDataToConsole("Error fetching document", err);
      setErrorInFetching(true);
      setUrl("");
      setDocuments([]);
    } finally {
      setIsFetchingDoc(false);
    }
  };

  React.useEffect(() => {
    if (id) {
      dispatch(fetchAllQuestionFromBigQuery(id));
      dispatch(fetchSingleOrderDetailsForCmm(id));
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setBqDataLoading(true);
    fetchBqRecordByIdentifier(id)
      .then((row) => {
        if (cancelled) return;
        if (row) {
          setResponseStatusInfo(row.response_status_information ?? null);
          setSuggestedActions(row.workflow?.suggested_actions ?? []);
          setOutcomePrediction(row.outcome_prediction ?? []);
          setDenialPrediction(row.denial_prediction ?? null);

          // Populate questionnaire from BigQuery row as fallback
          const bqQ = row.questionnaire;
          let docPath: string | null = null;
          let docName: string | null = null;

          if (bqQ?.qa_confidence != null) {
            const conf = parseFloat(bqQ.qa_confidence);
            if (!isNaN(conf)) setQaConfidence(conf);
          }

          if (
            bqQ?.questions &&
            Array.isArray(bqQ.questions) &&
            bqQ.questions.length > 0
          ) {
            const bqQuestions = bqQ.questions as PharmaQuestionModel[];
            setQuestionaire(bqQuestions);
            setQuestionsWithResponse(bqQuestions);
          }

          // Try questionnaire.file_path first
          if (bqQ?.file_path) {
            docPath = bqQ.file_path;
            docName = bqQ.document_name ?? null;
          }

          // Fallback: look for clinical_attachment in documents[]
          if (!docPath && row.documents && Array.isArray(row.documents)) {
            const clinicalDoc = row.documents.find(
              (d: any) => d.document_type === "clinical_attachment",
            );
            if (clinicalDoc?.file_path) {
              docPath = clinicalDoc.file_path;
              docName = clinicalDoc.document_name ?? null;
            }
          }

          if (docPath) setPdfUrl(docPath);
          if (docName) setFileNames([docName]);

          // Look for clinical_summary in documents[]
          if (row.documents && Array.isArray(row.documents)) {
            const summaryDoc = row.documents.find(
              (d: any) => d.document_type === "clinical_summary",
            );
            if (summaryDoc?.file_path) {
              setHasClinicalSummary(true);
              setClinicalSummaryPdfUrl(summaryDoc.file_path);
            }
          }
        }
      })
      .catch((err) => {
        if (!cancelled) console.error("BQ fetch error:", err);
      })
      .finally(() => {
        if (!cancelled) setBqDataLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  React.useEffect(() => {
    if (pharmaQuestionaire) {
      setQuestionaire(pharmaQuestionaire?.questions as PharmaQuestionModel[]);
      if (pharmaQuestionaire?.file_path)
        setPdfUrl(pharmaQuestionaire.file_path);
      if (pharmaQuestionaire?.document_name)
        setFileNames([pharmaQuestionaire.document_name]);
      setQuestionsWithResponse(
        pharmaQuestionaire?.questions as PharmaQuestionModel[],
      );
    }
  }, [pharmaQuestionaire, loading, error]);

  React.useEffect(() => {
    if (pdfUrl) {
      fetchDownloadUrl(pdfUrl);
    }
  }, [pdfUrl]);

  // Fetch clinical summary document
  useEffect(() => {
    if (!clinicalSummaryPdfUrl) return;
    let cancelled = false;
    setIsFetchingSummaryDoc(true);
    setErrorInFetchingSummary(false);
    (async () => {
      try {
        const file = await getFileFromRapidsStorage(clinicalSummaryPdfUrl);
        if (!cancelled) setClinicalSummaryDoc(file);
      } catch (err) {
        if (!cancelled) {
          console.error("Error fetching clinical summary:", err);
          setErrorInFetchingSummary(true);
        }
      } finally {
        if (!cancelled) setIsFetchingSummaryDoc(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clinicalSummaryPdfUrl]);

  React.useEffect(() => {
    modalOpen && openModal("documents-modal");
  }, [modalOpen]);

  React.useEffect(() => {
    if (openedModalId === ModalId.SUBMISSION_SUMMARY_MODAL) {
      openModal(ModalId.SUBMISSION_SUMMARY_MODAL);
    }
  }, [openedModalId]);

  React.useEffect(() => {
    if (downloadURL) {
      const newData = {
        ...pharmaQuestionaire,
        file_path: `onco_emr/${pharmaQuestionaire?.identifier}/additional_docs/${uuid}.pdf`,
        questions: processQuestions(questionsWithResponse),
        created_at: generateTimestamp(),
      };
      logDataToConsole("Final Data : ", newData);
      updateQuestionaireResponse(
        newData,
        id ?? "",
        ScreenNames.PHARMA_PA_QUESTIONNAIRE,
        user?.email ?? "",
      );
      setSubmitting(false);
      navigate("/pharma-pa-worklists/");
    }
  }, [downloadURL]);

  return (
    <div className="pharma-questionaire-form__container flex h-full flex-col bg-[#F7F9FA] px-[0.9375rem] py-[0.625rem]">
      {singleCmmOrderDataLoading ||
      loading ||
      (bqDataLoading && questionaire.length === 0) ? (
        <div className="flex h-full items-center justify-center">
          <LoaderMessage message={"Fetching relevant information..."} />
        </div>
      ) : (
        <>
          <div className="pharma-questionaire-form__header mb-4">
            <Breadcrumb
              items={buildBreadcrumbItems("medical-necessity", id ?? "")}
            />
          </div>
          <div className="pharma-questionaire-form__body flex flex-1 flex-col overflow-hidden rounded bg-white p-4 pb-0">
            <div className="pharma-questionaire-form__body--header mb-4">
              <div className="pharma-questionaire-form__body--header-details flex items-center justify-between gap-2">
                <div className="pharma-questionaire-form__body--header titles flex gap-2">
                  <div className="pharma-questionaire-form__body-page-name flex text-large font-semiBold leading-6 text-black">
                    Medical Necessity
                  </div>
                  <div className="insurance-details__body-patient-name rounded-[1.875rem] bg-primaryGray-16 px-4 text-small font-semibold leading-6 text-primaryGray-1">
                    {capitalizeString(
                      generateFullName(
                        singleCmmOrderData?.[
                          NycbsPharmaOrderKeys.PatientFirstName
                        ] || "",
                        "",
                        singleCmmOrderData?.[
                          NycbsPharmaOrderKeys.PatientLastName
                        ] || "",
                      ),
                    )}
                    &nbsp;&nbsp;<span>&#8226;</span>&nbsp;&nbsp;
                    {singleCmmOrderData?.[NycbsPharmaOrderKeys.PatientMrn] ??
                      ""}
                    &nbsp;&nbsp;<span>&#8226;</span>&nbsp;&nbsp;
                    {singleCmmOrderData?.[NycbsPharmaOrderKeys.PatientDob] ??
                      ""}
                    &nbsp;&nbsp;(
                    {calculateAge(
                      singleCmmOrderData?.[NycbsPharmaOrderKeys.PatientDob] ??
                        "",
                    )}
                    yrs) &nbsp;&nbsp;<span>&#8226;</span>&nbsp;&nbsp;
                    &nbsp;&nbsp;
                    {singleCmmOrderData?.[
                      NycbsPharmaOrderKeys.DrugNameOncoEmr
                    ] ?? ""}
                  </div>
                  <div
                    className="rounded-[1.875rem] px-4 text-small font-semibold leading-6"
                    style={{ backgroundColor: "#CC0300", color: "#FFFFFF" }}
                  >
                    {singleCmmOrderData?.[NycbsPharmaOrderKeys.DrugType] || "—"}
                  </div>
                  <div
                    className="rounded-[1.875rem] px-4 text-small font-semibold leading-6"
                    style={{ backgroundColor: "#0056D6", color: "#FFFFFF" }}
                  >
                    {singleCmmOrderData?.[NycbsPharmaOrderKeys.GenericBrand] ||
                      "—"}
                  </div>
                </div>
                <div className="cmm-result-key ml-auto mr-2 flex items-center gap-2 text-small">
                  Cmm Key:{" "}
                  <span className="font-bold">
                    {singleCmmOrderData?.[NycbsPharmaOrderKeys.CmmResultKey] ??
                      ""}
                    &nbsp;
                  </span>
                  <div
                    className="cmm-result-key copy-icon hover:cursor-pointer"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        singleCmmOrderData?.[
                          NycbsPharmaOrderKeys.CmmResultKey
                        ] ?? "",
                      );
                    }}
                  >
                    <CopyIcon />
                  </div>
                </div>
                <div className="procedure-pa-form__attachements flex gap-2">
                  <Button
                    disabled={false}
                    children={"Manage Attachments"}
                    onClick={() => setIsOpenModal(true)}
                    buttonType={"secondary"}
                    size={"medium"}
                  />
                  <Button
                    disabled={false}
                    children={"Denial Prediction"}
                    onClick={() => setShowDenialPredictionModal(true)}
                    buttonType={"secondary"}
                    size={"medium"}
                  />
                  <Button
                    disabled={false}
                    children={"AI Reasoning"}
                    onClick={() => setShowAgentsDrawer(true)}
                    buttonType={"primary"}
                    size={"medium"}
                  />
                </div>
              </div>
            </div>
            {/* ── Content panels ── */}
            <div className="pharma-questionaire-form__body-content flex flex-1 gap-4 overflow-hidden">
              {/* ── Left: Clinical Document / Clinical Summary ── */}
              <div className="pharma-questionaire-form__body-content--left flex w-1/2 flex-col overflow-hidden rounded-lg border border-primaryGray-12 bg-white shadow-sm">
                <div className="rounded-t-lg bg-[#F0F2F5] px-4 py-3">
                  <span className="text-body font-semibold text-primaryGray-1">
                    Clinical Notes
                  </span>
                </div>

                {hasClinicalSummary && (
                  <div className="mx-3 my-2 flex overflow-hidden rounded-lg border border-primaryGray-14">
                    <button
                      className={`flex-1 py-2 text-xs font-semibold transition-all duration-150 ${
                        activeDocTab === "clinical_document"
                          ? "bg-primaryGray-1 text-white"
                          : "bg-white text-primaryGray-9 hover:bg-primaryGray-16 hover:text-primaryGray-4"
                      }`}
                      onClick={() => setActiveDocTab("clinical_document")}
                    >
                      Clinical Document
                    </button>
                    <div className="w-px bg-primaryGray-14" />
                    <button
                      className={`flex-1 py-2 text-xs font-semibold transition-all duration-150 ${
                        activeDocTab === "clinical_summary"
                          ? "bg-primaryGray-1 text-white"
                          : "bg-white text-primaryGray-9 hover:bg-primaryGray-16 hover:text-primaryGray-4"
                      }`}
                      onClick={() => setActiveDocTab("clinical_summary")}
                    >
                      Clinical Summary
                    </button>
                  </div>
                )}
                <div className="flex-1 overflow-auto p-4">
                  {activeDocTab === "clinical_document" ? (
                    <>
                      {isFetchingDoc || loading || bqDataLoading ? (
                        <div className="flex h-full items-center justify-center">
                          <LoaderMessage message="Fetching documents..." />
                        </div>
                      ) : errorInFetching ? (
                        <div className="flex h-full items-center justify-center text-small text-red-500">
                          Error fetching document. Please try again later.
                        </div>
                      ) : documents && documents.length > 0 ? (
                        documents.map((file, index) => (
                          <PdfRender key={index} file={file} />
                        ))
                      ) : (
                        <div className="pharma_questionaire-form__docs flex h-full items-center justify-center text-h10 text-primaryGray-9">
                          No documents found
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {isFetchingSummaryDoc || bqDataLoading ? (
                        <div className="flex h-full items-center justify-center">
                          <LoaderMessage message="Fetching clinical summary..." />
                        </div>
                      ) : errorInFetchingSummary ? (
                        <div className="flex h-full items-center justify-center text-small text-red-500">
                          Error fetching clinical summary. Please try again
                          later.
                        </div>
                      ) : clinicalSummaryDoc ? (
                        <PdfRender file={clinicalSummaryDoc} />
                      ) : (
                        <div className="flex h-full items-center justify-center text-h10 text-primaryGray-9">
                          No clinical summary found
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* ── Right: Clinical Questionnaire ── */}
              <div className="pharma-questionaire-form__body-content--right flex w-1/2 flex-col overflow-hidden rounded-lg border border-primaryGray-12 bg-white shadow-sm">
                <div className="flex items-center justify-between rounded-t-lg bg-[#F0F2F5] px-4 py-2.5">
                  <span className="text-body font-semibold text-primaryGray-1">
                    Clinical Questionnaire
                  </span>
                  {qaConfidence != null &&
                    (() => {
                      const pct = qaConfidence * 100;
                      const barColor =
                        pct >= 80
                          ? "#22c55e"
                          : pct >= 50
                            ? "#eab308"
                            : "#ef4444";
                      return (
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-primaryGray-4">
                            QA Confidence
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-primaryGray-14">
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: barColor,
                                }}
                              />
                            </div>
                            <span className="text-xs font-bold text-primaryGray-1">
                              {pct.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                </div>
                <div className="flex-1 overflow-auto p-4">
                  {bqDataLoading || loading ? (
                    <div className="flex h-full items-center justify-center">
                      <LoaderMessage message="Fetching questionnaire..." />
                    </div>
                  ) : questionaire && questionaire.length > 0 ? (
                    <PharmaQuestions
                      questions={questionaire}
                      onQuestionUpdated={(questions) =>
                        setQuestionsWithResponse(questions)
                      }
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-h10 text-primaryGray-9">
                      No questionnaire data found
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="pharma-questionaire-form__footer">
            <Footer
              cancelButtonText={"Go Back"}
              submitButtonText={"Continue"}
              onCancelClick={() => {
                navigate(`/pharma-pa-worklists/pharma-pa-form/${id}`);
              }}
              onSubmitClick={() => {
                navigate(`/pharma-pa-worklists/pharma-pa-outcome/${id}`);
              }}
              isDisabled={false}
              children={undefined}
            />
          </div>
          <MedicalNecessityAgents
            open={showAgentsDrawer}
            onClose={() => setShowAgentsDrawer(false)}
            drug={necessityDrug}
            payer={necessityPayer}
            supportiveTexts={supportiveTexts}
            contradictoryTexts={contradictoryTexts}
            questions={questionaire || []}
          />
          {modalOpen && (
            <DocumentsModal
              onClose={() => setIsOpenModal(false)}
              documentsName={fileNames}
              documentsList={documents}
              id={pharmaQuestionaire?.identifier ?? ""}
              newDocumentNames={(urls) => setFileNames(urls)}
              newFiles={(files) => setDocuments(files)}
            />
          )}
          {openedModalId === ModalId.SUBMISSION_SUMMARY_MODAL && (
            <SubmissionSummary
              metaData={{
                data: singleCmmOrderData as unknown as PharmaStpFileModel,
              }}
              onClose={() => {
                dispatch(
                  setOpenedModalId({
                    id: "",
                  }),
                );
                closeModal(ModalId.SUBMISSION_SUMMARY_MODAL);
              }}
            />
          )}
          {showDenialPredictionModal && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
              onClick={() => setShowDenialPredictionModal(false)}
            >
              <div
                className="w-full max-w-2xl overflow-hidden rounded-lg bg-[#F7F9FA] shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between bg-white px-6 py-4">
                  <div className="flex items-center gap-2">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#374151"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <h2 className="text-large font-semibold text-primaryGray-1">
                      Denial Prediction
                    </h2>
                  </div>
                  <button
                    className="rounded-full p-1 text-primaryGray-9 transition-colors hover:bg-primaryGray-16 hover:text-primaryGray-1"
                    onClick={() => setShowDenialPredictionModal(false)}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                <div className="max-h-[70vh] overflow-auto p-5">
                  {/* All predictions in a single flat card */}
                  {denialPrediction ||
                  (outcomePrediction && outcomePrediction.length > 0) ? (
                    <div className="flex flex-col gap-4">
                      {/* Denial prediction fields */}
                      {denialPrediction && (
                        <>
                          {(denialPrediction.predicted_outcome ||
                            denialPrediction.prediction_confidence != null) && (
                            <div className="grid grid-cols-2 gap-4">
                              {denialPrediction.predicted_outcome && (
                                <PredictionFieldCard
                                  label="Predicted Outcome"
                                  value={denialPrediction.predicted_outcome}
                                  variant="badge"
                                />
                              )}
                              {denialPrediction.prediction_confidence !=
                                null && (
                                <PredictionFieldCard
                                  label="Confidence"
                                  value={denialPrediction.prediction_confidence}
                                  variant="confidence"
                                />
                              )}
                            </div>
                          )}
                          {denialPrediction.prediction_summary && (
                            <PredictionFieldCard
                              label="Prediction Summary"
                              value={denialPrediction.prediction_summary}
                            />
                          )}
                        </>
                      )}

                      {/* Outcome prediction fields */}
                      {outcomePrediction &&
                        outcomePrediction.length > 0 &&
                        outcomePrediction.map(
                          (prediction: any, idx: number) => (
                            <React.Fragment key={idx}>
                              {(prediction.predicted_outcome ||
                                prediction.prediction_confidence != null) && (
                                <div className="grid grid-cols-2 gap-4">
                                  {prediction.predicted_outcome && (
                                    <PredictionFieldCard
                                      label="Predicted Outcome"
                                      value={prediction.predicted_outcome}
                                      variant="badge"
                                    />
                                  )}
                                  {prediction.prediction_confidence != null && (
                                    <PredictionFieldCard
                                      label="Confidence"
                                      value={prediction.prediction_confidence}
                                      variant="confidence"
                                    />
                                  )}
                                </div>
                              )}
                              {prediction.prediction_summary && (
                                <PredictionFieldCard
                                  label="Prediction Summary"
                                  value={prediction.prediction_summary}
                                />
                              )}
                            </React.Fragment>
                          ),
                        )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 py-8 text-small text-primaryGray-9">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      No prediction data available
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const FieldCard = ({ label, value }: { label: string; value: any }) => (
  <div className="flex min-h-[3.5rem] items-center rounded-lg border border-primaryGray-12 px-4 py-3">
    <div className="w-full whitespace-pre-wrap text-body text-primaryGray-1">
      {value || <span className="font-medium text-primaryGray-9">{label}</span>}
    </div>
  </div>
);

/* ── Badge color matching worklist table ── */
const predictionBadgeStyle = (outcome: string) => {
  const lower = (outcome || "").toLowerCase().replace(/\s+/g, "_");
  if (
    lower.includes("approved") ||
    lower.includes("approval") ||
    lower.includes("auth_on_file") ||
    lower.includes("verified") ||
    lower.includes("success") ||
    lower.includes("no_auth_required") ||
    lower.includes("auth_not_required") ||
    lower.includes("request_response") ||
    lower.includes("approval_on_file")
  )
    return { bg: "#E6F3F0", color: "#005D49" };
  if (
    lower.includes("denied") ||
    lower.includes("denial") ||
    lower.includes("denial_on_file") ||
    lower.includes("drug_not_covered") ||
    lower.includes("error") ||
    lower.includes("inaccuracy")
  )
    return { bg: "#FFE8E8", color: "#CC0300" };
  if (
    lower.includes("pending") ||
    lower.includes("sent_to_plan") ||
    lower.includes("waiting") ||
    lower.includes("auth_needed")
  )
    return { bg: "#FFF3E0", color: "#C24400" };
  if (
    lower.includes("in_progress") ||
    lower.includes("inprogress") ||
    lower.includes("form_filled") ||
    lower.includes("first_stp")
  )
    return { bg: "#FFF3E0", color: "#C24400" };
  if (
    lower.includes("new") ||
    lower.includes("submitted") ||
    lower.includes("qa_fetched")
  )
    return { bg: "#EAF2FF", color: "#0056D6" };
  return { bg: "#F5F5F5", color: "#0F0F0F" };
};

/* ── Confidence color based on value ── */
const confidenceStyle = (val: number) => {
  if (val >= 0.8)
    return { color: "#005D49", bg: "#E6F3F0", barColor: "#00A67E" };
  if (val >= 0.5)
    return { color: "#C24400", bg: "#FFF3E0", barColor: "#F59E0B" };
  return { color: "#CC0300", bg: "#FFE8E8", barColor: "#EF4444" };
};

const PredictionFieldCard = ({
  label,
  value,
  variant = "default",
}: {
  label: string;
  value: any;
  variant?: "default" | "badge" | "confidence";
}) => {
  const [copied, setCopied] = React.useState(false);
  if (!value && value !== 0) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(String(value));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (variant === "badge") {
    const s = predictionBadgeStyle(String(value));
    return (
      <div>
        <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-primaryGray-9">
          {label}
        </div>
        <span
          className="inline-block rounded-full px-3 py-1 text-small font-semibold"
          style={{ backgroundColor: s.bg, color: s.color }}
        >
          {value}
        </span>
      </div>
    );
  }

  if (variant === "confidence") {
    const numVal = Number(value);
    const pct = numVal <= 1 ? Math.round(numVal * 100) : Math.round(numVal);
    const cs = confidenceStyle(numVal <= 1 ? numVal : numVal / 100);
    return (
      <div>
        <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-primaryGray-9">
          {label}
        </div>
        <div className="rounded-lg border border-primaryGray-14 bg-white px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-h10 font-bold" style={{ color: cs.color }}>
              {pct}%
            </span>
            <div className="flex-1">
              <div
                className="h-2 overflow-hidden rounded-full"
                style={{ backgroundColor: cs.bg }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: cs.barColor }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group">
      <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-primaryGray-9">
        {label}
      </div>
      <div className="relative rounded-lg border border-primaryGray-14 bg-white px-4 py-3 transition-shadow duration-150 hover:shadow-sm">
        <div className="w-full whitespace-pre-wrap text-body leading-relaxed text-primaryGray-1">
          {value}
        </div>
        <button
          onClick={handleCopy}
          className="absolute right-2 top-2 rounded p-1 text-primaryGray-9 opacity-0 transition-opacity duration-150 hover:bg-primaryGray-16 group-hover:opacity-100"
          title="Copy to clipboard"
        >
          {copied ? (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default PharmaQuestionaireLayout;
