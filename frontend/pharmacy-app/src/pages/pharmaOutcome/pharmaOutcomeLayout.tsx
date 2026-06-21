import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { openModal } from "risa-oasis-ui_v2";
import { fetchBqRecordByIdentifier } from "../../api/bigQuery/paCasesBigQuery";
import {
  getFileFromRapidsStorage,
  getRapidsFileDownloadUrl,
} from "../../api/firebase/rapidsFirestore";
import Breadcrumb, {
  buildBreadcrumbItems,
} from "../../components/breadcrumb/Breadcrumb";
import { LoaderMessage } from "../../components/loaderMessage/loaderMessage";
import PdfRender from "../../components/pdfRender/pdfRender";
import { ModalId } from "../../enums/modalId";
import { NycbsPharmaOrderKeys } from "../../enums/nycbsPharmaOrder";
import { fetchSingleOrderDetailsForCmm } from "../../redux/slice/cmm/cmmSingleOrderSlice";
import { fetchAllQuestionFromBigQuery } from "../../redux/slice/cmm/pharmaQuestionsSlice";
import { AppDispatch, RootState } from "../../redux/store/store";
import { CopyIcon } from "../../svg/copy-icon";
import { calculateAge } from "../../utils/ageCalculator";
import { logDataToConsole } from "../../utils/customLogger";
import { generateFullName } from "../../utils/generateOrderDataForTable";
import { capitalizeString } from "../../utils/stringModifications";

const PharmaOutcomeLayout = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { data: singleCmmOrderData, loading: singleCmmOrderDataLoading } =
    useSelector((state: RootState) => state.cmmSingleOrder);
  const {
    data: pharmaQuestionaire,
    loading,
    error,
  } = useSelector((state: RootState) => state.pharmaQuestions);

  const { id } = useParams();
  const navigate = useNavigate();

  const [url, setUrl] = useState<string | null>(null);
  const [documents, setDocuments] = useState<File[]>([]);
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorInFetching, setErrorInFetching] = useState<boolean>(false);
  const [isFetchingDoc, setIsFetchingDoc] = useState<boolean>(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const { openedModalId } = useSelector(
    (state: RootState) => state.modalSliceNew,
  );

  const [responseStatusInfo, setResponseStatusInfo] = useState<any>(null);
  const [nextActionItems, setNextActionItems] = useState<any[]>([]);
  const [outcomePrediction, setOutcomePrediction] = useState<any[]>([]);
  const [finalOutcome, setFinalOutcome] = useState<string>("");
  const [workflowComment, setWorkflowComment] = useState<string>("");
  const [bqDataLoading, setBqDataLoading] = useState(true);
  const [selectedActionItem, setSelectedActionItem] = useState<any>(null);

  // Call log state (shown when CTA is "Call")
  const [showCallLog, setShowCallLog] = useState(false);
  const [callMode, setCallMode] = useState<"human" | "agentic">("human");
  const [callLogForm, setCallLogForm] = useState({
    repName: "",
    dateOfCall: new Date().toISOString().split("T")[0],
    summary: "",
  });

  // Re-route success message (shown inside the action item modal)
  const [rerouteSuccess, setRerouteSuccess] = useState(false);

  // CMM Outcome document state
  const [cmmOutcomePdfUrl, setCmmOutcomePdfUrl] = useState<string | null>(null);
  const [cmmOutcomeDoc, setCmmOutcomeDoc] = useState<File | null>(null);
  const [isFetchingCmmOutcome, setIsFetchingCmmOutcome] = useState(false);
  const [hasLetterDoc, setHasLetterDoc] = useState(false);
  const [activeDocTab, setActiveDocTab] = useState<"cmm_outcome" | "letter">(
    "letter",
  );

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleCancelClick = () => {
    logDataToConsole("Cancel clicked");
    handleGoBack();
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
          setNextActionItems(row.next_action_items ?? []);
          setOutcomePrediction(row.outcome_prediction ?? []);
          setFinalOutcome(row.workflow?.final_outcome ?? "");
          setWorkflowComment(row.workflow?.comment ?? "");

          // Extract documents from documents[] for Outcome page
          if (row.documents && Array.isArray(row.documents)) {
            // Letter document (approval/denial)
            const letterDoc = row.documents.find(
              (d: any) =>
                d.document_type === "approval_letter" ||
                d.document_type === "denial_letter",
            );
            if (letterDoc?.file_path) {
              setPdfUrl(letterDoc.file_path);
              setFileNames([letterDoc.document_name ?? ""]);
              setHasLetterDoc(true);
            }

            // CMM_Outcome document
            const cmmOutcome = row.documents.find(
              (d: any) => d.document_name === "CMM_Outcome",
            );
            if (cmmOutcome?.file_path) {
              setCmmOutcomePdfUrl(cmmOutcome.file_path);
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

  // Note: Outcome page shows approval/denial letter from documents[],
  // not the questionnaire document — so we skip pharmaQuestionaire here.

  React.useEffect(() => {
    if (pdfUrl) {
      fetchDownloadUrl(pdfUrl);
    }
  }, [pdfUrl]);

  // Fetch CMM Outcome document
  React.useEffect(() => {
    if (!cmmOutcomePdfUrl) return;
    let cancelled = false;
    setIsFetchingCmmOutcome(true);
    getFileFromRapidsStorage(cmmOutcomePdfUrl)
      .then((file) => {
        if (!cancelled) setCmmOutcomeDoc(file);
      })
      .catch((err) => {
        if (!cancelled) console.error("Error fetching CMM Outcome doc:", err);
      })
      .finally(() => {
        if (!cancelled) setIsFetchingCmmOutcome(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cmmOutcomePdfUrl]);

  React.useEffect(() => {
    if (openedModalId === ModalId.SUBMISSION_SUMMARY_MODAL) {
      openModal(ModalId.SUBMISSION_SUMMARY_MODAL);
    }
  }, [openedModalId]);

  return (
    <div className="pharma-questionaire-form__container flex h-full flex-col bg-[#F7F9FA] px-[0.9375rem] py-[0.625rem]">
      {singleCmmOrderDataLoading ||
      loading ||
      (bqDataLoading && !responseStatusInfo && !finalOutcome) ? (
        <div className="flex h-full items-center justify-center">
          <LoaderMessage message={"Fetching relevant information..."} />
        </div>
      ) : (
        <>
          <div className="pharma-questionaire-form__header mb-4">
            <Breadcrumb items={buildBreadcrumbItems("outcome", id ?? "")} />
          </div>
          <div className="pharma-questionaire-form__body flex min-h-0 flex-1 flex-col overflow-hidden rounded bg-white p-4 pb-0">
            <div className="pharma-questionaire-form__body--header mb-4">
              <div className="pharma-questionaire-form__body--header-details flex items-center justify-between gap-2">
                <div className="pharma-questionaire-form__body--header titles flex gap-2">
                  <div className="pharma-questionaire-form__body-page-name flex text-large font-semiBold leading-6 text-black">
                    Request Outcome
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
              </div>
            </div>
            <div className="pharma-questionaire-form__body-content flex min-h-0 flex-1 gap-4 overflow-hidden">
              {/* Left Panel - Documents */}
              <div className="pharma-questionaire-form__body-content--left flex w-1/2 flex-col overflow-hidden rounded-lg border border-primaryGray-12 bg-white shadow-sm">
                <div className="rounded-t-lg bg-[#F0F2F5] px-4 py-3">
                  <span className="text-body font-semibold text-primaryGray-1">
                    Summary Documents
                  </span>
                </div>

                {cmmOutcomePdfUrl && hasLetterDoc && (
                  <div className="mx-3 my-2 flex overflow-hidden rounded-lg border border-primaryGray-14">
                    <button
                      className={`flex-1 py-2 text-xs font-semibold transition-all duration-150 ${
                        activeDocTab === "letter"
                          ? "bg-primaryGray-1 text-white"
                          : "bg-white text-primaryGray-9 hover:bg-primaryGray-16 hover:text-primaryGray-4"
                      }`}
                      onClick={() => setActiveDocTab("letter")}
                    >
                      Letter
                    </button>
                    <div className="w-px bg-primaryGray-14" />
                    <button
                      className={`flex-1 py-2 text-xs font-semibold transition-all duration-150 ${
                        activeDocTab === "cmm_outcome"
                          ? "bg-primaryGray-1 text-white"
                          : "bg-white text-primaryGray-9 hover:bg-primaryGray-16 hover:text-primaryGray-4"
                      }`}
                      onClick={() => setActiveDocTab("cmm_outcome")}
                    >
                      CMM Outcome
                    </button>
                  </div>
                )}

                <div className="flex-1 overflow-auto p-4">
                  {/* CMM Outcome tab (or only doc when no letter) */}
                  {(activeDocTab === "cmm_outcome" || !hasLetterDoc) &&
                  cmmOutcomePdfUrl ? (
                    isFetchingCmmOutcome ? (
                      <div className="flex h-full items-center justify-center">
                        <LoaderMessage message="Fetching CMM Outcome..." />
                      </div>
                    ) : cmmOutcomeDoc ? (
                      <PdfRender file={cmmOutcomeDoc} />
                    ) : (
                      <div className="flex h-full items-center justify-center text-h10 text-primaryGray-9">
                        CMM Outcome document not found
                      </div>
                    )
                  ) : activeDocTab === "letter" ? (
                    isFetchingDoc || loading ? (
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
                      <div className="flex h-full items-center justify-center text-h10 text-primaryGray-9">
                        No letter document found
                      </div>
                    )
                  ) : /* Fallback: no CMM outcome, show letter by default */
                  isFetchingDoc || loading ? (
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
                    <div className="flex h-full items-center justify-center text-h10 text-primaryGray-9">
                      No documents found
                    </div>
                  )}
                </div>
              </div>

              {/* Right Panel - Outcome Details */}
              <div className="pharma-questionaire-form__body-content--right flex w-1/2 flex-col overflow-hidden rounded-lg border border-primaryGray-12 bg-white shadow-sm">
                <div className="flex flex-1 flex-col gap-6 overflow-auto p-4">
                  {bqDataLoading ? (
                    <LoaderMessage message="Fetching outcome data..." />
                  ) : (
                    <>
                      {/* Summary */}
                      <div className="overflow-hidden rounded-lg border border-primaryGray-14 shadow-sm">
                        <div className="flex items-center gap-2 border-b border-primaryGray-14 bg-primaryGray-16 px-4 py-3">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#374151"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                          </svg>
                          <span className="text-small font-bold text-primaryGray-1">
                            Summary
                          </span>
                        </div>
                        <div className="flex flex-col gap-4 p-5">
                          {/* Outcome row — badge + auth date side by side */}
                          {(finalOutcome || responseStatusInfo?.auth_date) && (
                            <div className="grid grid-cols-2 gap-4">
                              <FieldCard
                                label="Outcome"
                                value={finalOutcome}
                                variant="badge"
                                hideIfEmpty
                              />
                              <FieldCard
                                label="Auth Expiry Date"
                                value={responseStatusInfo?.auth_date}
                                hideIfEmpty
                              />
                            </div>
                          )}
                          <FieldCard
                            label="Comment"
                            value={workflowComment}
                            hideIfEmpty
                            maxHeight="10rem"
                          />
                          <FieldCard
                            label="Denial Reason"
                            value={responseStatusInfo?.denial_reason}
                            accent="#CC0300"
                            hideIfEmpty
                          />
                          <FieldCard
                            label="Denial Summary"
                            value={responseStatusInfo?.denial_summary}
                            accent="#CC0300"
                            hideIfEmpty
                          />
                        </div>
                      </div>
                      {/* Suggested Next Steps — inside right panel, outside Summary box */}
                      {nextActionItems.length > 0 && (
                        <div className="flex flex-col gap-3">
                          <span className="text-x-tiny font-semibold uppercase tracking-wider text-primaryGray-6">
                            Suggested Next Steps
                          </span>
                          {nextActionItems.map((item, idx) => (
                            <button
                              key={idx}
                              onClick={() => setSelectedActionItem(item)}
                              className="group flex w-full items-center gap-4 rounded-lg border border-primaryGray-14 bg-[#F7F9FA] px-5 py-3.5 text-left transition-all duration-150 hover:border-primaryGray-12 hover:shadow-sm active:scale-[0.995]"
                            >
                              <div className="flex min-w-0 flex-1 flex-col">
                                <span className="text-small font-semibold text-primaryGray-1">
                                  {item?.steps}
                                </span>
                                {item?.steps_summary && (
                                  <span className="mt-0.5 truncate text-xs text-primaryGray-9">
                                    {item.steps_summary}
                                  </span>
                                )}
                              </div>
                              <span className="shrink-0 rounded-md border border-primaryGray-1 bg-primaryGray-1 px-3 py-1 text-xs font-medium text-white transition-colors duration-150 group-hover:bg-black">
                                View
                              </span>
                              <svg
                                className="h-3.5 w-3.5 shrink-0 text-primaryGray-9 transition-transform duration-150 group-hover:translate-x-0.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="9 18 15 12 9 6" />
                              </svg>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="pharma-questionaire-form__footer">
            <div className="flex items-center justify-end gap-3 border-t border-primaryGray-14 px-4 py-3">
              <button
                className="rounded-md border border-primaryGray-1 px-5 py-2 text-small font-semibold text-primaryGray-1 transition-colors duration-150 hover:bg-primaryGray-16"
                onClick={() => {
                  navigate(`/pharma-pa-worklists/pharma-pa-questionaire/${id}`);
                }}
              >
                Go Back
              </button>
              <div className="group relative">
                <button
                  className="cursor-default rounded-md border border-primaryGray-1 bg-primaryGray-1 px-5 py-2 text-small font-semibold text-white"
                  onClick={(e) => e.preventDefault()}
                >
                  Close Case
                </button>
                <div className="pointer-events-none absolute bottom-full right-0 z-50 mb-2 w-72 rounded-lg border border-primaryGray-14 bg-primaryGray-1 px-3 py-2.5 text-xs leading-relaxed text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                  Closing a case will finalize its status and store the case
                  details in the database for future reference once a
                  determination is made.
                  <div className="absolute -bottom-1 right-6 h-2 w-2 rotate-45 bg-primaryGray-1" />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Action Item Detail Modal */}
      {selectedActionItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => {
            setSelectedActionItem(null);
            setShowCallLog(false);
            setRerouteSuccess(false);
            setCallLogForm({
              repName: "",
              dateOfCall: new Date().toISOString().split("T")[0],
              summary: "",
            });
            setCallMode("human");
          }}
          style={{ animation: "outcomeModalFadeIn .15s ease-out" }}
        >
          <div className="absolute inset-0 bg-black/40" />

          <div
            className="relative z-10 w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "outcomeModalSlideUp .2s ease-out" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-primaryGray-14 px-6 py-4">
              <h3 className="text-body font-bold text-primaryGray-1">
                {selectedActionItem.steps}
              </h3>
              <button
                className="rounded-full p-1.5 text-primaryGray-9 hover:bg-primaryGray-16 hover:text-primaryGray-1"
                onClick={() => {
                  setSelectedActionItem(null);
                  setShowCallLog(false);
                  setRerouteSuccess(false);
                  setCallLogForm({
                    repName: "",
                    dateOfCall: new Date().toISOString().split("T")[0],
                    summary: "",
                  });
                  setCallMode("human");
                }}
              >
                <svg
                  width="18"
                  height="18"
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

            {/* Body */}
            <div className="flex flex-col gap-5 bg-primaryGray-16/50 px-6 py-6">
              {selectedActionItem.task && (
                <div>
                  <p className="mb-1.5 text-x-tiny font-semibold uppercase tracking-wider text-primaryGray-6">
                    Task
                  </p>
                  <div className="rounded-lg border border-primaryGray-14 bg-white px-4 py-3 text-small leading-relaxed text-primaryGray-1">
                    {selectedActionItem.task}
                  </div>
                </div>
              )}

              {(selectedActionItem.phone || selectedActionItem.fax) && (
                <div
                  className={`grid gap-4 ${selectedActionItem.phone && selectedActionItem.fax ? "grid-cols-2" : "grid-cols-1"}`}
                >
                  {selectedActionItem.phone && (
                    <div>
                      <p className="mb-1.5 text-x-tiny font-semibold uppercase tracking-wider text-primaryGray-6">
                        Phone
                      </p>
                      <div className="rounded-lg border border-primaryGray-14 bg-white px-4 py-3 text-small text-primaryGray-1">
                        {selectedActionItem.phone}
                      </div>
                    </div>
                  )}
                  {selectedActionItem.fax && (
                    <div>
                      <p className="mb-1.5 text-x-tiny font-semibold uppercase tracking-wider text-primaryGray-6">
                        Fax
                      </p>
                      <div className="rounded-lg border border-primaryGray-14 bg-white px-4 py-3 text-small text-primaryGray-1">
                        {selectedActionItem.fax}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedActionItem.key && (
                <div>
                  <p className="mb-1.5 text-x-tiny font-semibold uppercase tracking-wider text-primaryGray-6">
                    Key
                  </p>
                  <div className="rounded-lg border border-primaryGray-14 bg-white px-4 py-3 text-small text-primaryGray-1">
                    {selectedActionItem.key}
                  </div>
                </div>
              )}

              {(selectedActionItem.alternate_insurance ||
                selectedActionItem.alternate_insurance_form_name) && (
                <div
                  className={`grid gap-4 ${selectedActionItem.alternate_insurance && selectedActionItem.alternate_insurance_form_name ? "grid-cols-2" : "grid-cols-1"}`}
                >
                  {selectedActionItem.alternate_insurance && (
                    <div>
                      <p className="mb-1.5 text-x-tiny font-semibold uppercase tracking-wider text-primaryGray-6">
                        Alternate Insurance
                      </p>
                      <div className="rounded-lg border border-primaryGray-14 bg-white px-4 py-3 text-small text-primaryGray-1">
                        {selectedActionItem.alternate_insurance}
                      </div>
                    </div>
                  )}
                  {selectedActionItem.alternate_insurance_form_name && (
                    <div>
                      <p className="mb-1.5 text-x-tiny font-semibold uppercase tracking-wider text-primaryGray-6">
                        Alternate Form Name
                      </p>
                      <div className="rounded-lg border border-primaryGray-14 bg-white px-4 py-3 text-small text-primaryGray-1">
                        {selectedActionItem.alternate_insurance_form_name}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Render any extra fields not already shown */}
              {(() => {
                const shown = new Set([
                  "steps",
                  "task",
                  "steps_summary",
                  "phone",
                  "fax",
                  "key",
                  "alternate_insurance",
                  "alternate_insurance_form_name",
                  "cta_microtext",
                ]);
                const extra = Object.entries(selectedActionItem).filter(
                  ([k, v]) => !shown.has(k) && v != null && v !== "",
                );
                if (extra.length === 0) return null;
                return (
                  <div className="grid grid-cols-2 gap-4">
                    {extra.map(([k, v]) => (
                      <div key={k}>
                        <p className="mb-1.5 text-x-tiny font-semibold uppercase tracking-wider text-primaryGray-6">
                          {k.replace(/_/g, " ")}
                        </p>
                        <div className="rounded-lg border border-primaryGray-14 bg-white px-4 py-3 text-small text-primaryGray-1">
                          {String(v)}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Call Log View */}
            {showCallLog && (
              <div className="flex flex-col gap-4 border-t border-primaryGray-14 bg-white px-6 py-5">
                {/* Mode selector */}
                <div>
                  <p className="mb-2 text-x-tiny font-semibold uppercase tracking-wider text-primaryGray-6">
                    Calling Mode
                  </p>
                  <div className="flex overflow-hidden rounded-lg border border-primaryGray-14">
                    <button
                      className={`flex flex-1 items-center justify-center gap-2 py-2.5 text-small font-semibold transition-all duration-150 ${
                        callMode === "human"
                          ? "bg-primaryGray-1 text-white"
                          : "bg-white text-primaryGray-9 hover:bg-primaryGray-16"
                      }`}
                      onClick={() => setCallMode("human")}
                    >
                      Human Calling
                    </button>
                    <div className="w-px bg-primaryGray-14" />
                    <button
                      className="flex flex-1 cursor-not-allowed items-center justify-center gap-1 bg-primaryGray-16/60 py-2.5 text-small font-semibold text-primaryGray-11"
                      disabled
                    >
                      Agentic Calling
                      <span className="rounded bg-primaryGray-14 px-1.5 py-0.5 text-overline font-bold text-primaryGray-9">
                        Coming Soon
                      </span>
                    </button>
                  </div>
                </div>

                {/* Capture fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-x-tiny font-semibold uppercase tracking-wider text-primaryGray-6">
                      Rep Name
                    </label>
                    <input
                      type="text"
                      value={callLogForm.repName}
                      onChange={(e) =>
                        setCallLogForm((p) => ({
                          ...p,
                          repName: e.target.value,
                        }))
                      }
                      placeholder="Enter representative name"
                      className="w-full rounded-md border border-primaryGray-14 bg-white px-3 py-2 text-small text-primaryGray-1 outline-none transition-all duration-150 placeholder:text-primaryGray-11 focus:border-primaryGray-9 focus:shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-x-tiny font-semibold uppercase tracking-wider text-primaryGray-6">
                      Date of Call
                    </label>
                    <input
                      type="date"
                      value={callLogForm.dateOfCall}
                      onChange={(e) =>
                        setCallLogForm((p) => ({
                          ...p,
                          dateOfCall: e.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-primaryGray-14 bg-white px-3 py-2 text-small text-primaryGray-1 outline-none transition-all duration-150 focus:border-primaryGray-9 focus:shadow-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-x-tiny font-semibold uppercase tracking-wider text-primaryGray-6">
                    Summary
                  </label>
                  <textarea
                    value={callLogForm.summary}
                    onChange={(e) =>
                      setCallLogForm((p) => ({
                        ...p,
                        summary: e.target.value,
                      }))
                    }
                    placeholder="Enter call summary..."
                    rows={6}
                    className="w-full resize-none rounded-md border border-primaryGray-14 bg-white px-3 py-2 text-small text-primaryGray-1 outline-none transition-all duration-150 placeholder:text-primaryGray-11 focus:border-primaryGray-9 focus:shadow-sm"
                  />
                </div>
              </div>
            )}

            {/* Re-route success banner */}
            {rerouteSuccess && (
              <div className="mx-6 mb-2 mt-1 flex items-center gap-2.5 rounded-lg bg-green-50 px-4 py-3 ring-1 ring-green-200">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#16a34a"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <span className="text-small font-semibold text-green-700">
                  New case initiated successfully
                </span>
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t border-primaryGray-14 px-6 py-4">
              {showCallLog && (
                <button
                  className="rounded-md border border-primaryGray-14 bg-white px-5 py-2 text-small font-semibold text-primaryGray-1 transition-colors duration-150 hover:bg-primaryGray-16"
                  onClick={() => setShowCallLog(false)}
                >
                  Back
                </button>
              )}
              {(() => {
                const ctaLower = (
                  selectedActionItem.cta_microtext || ""
                ).toLowerCase();
                const isKnownCta =
                  showCallLog ||
                  ctaLower.includes("call") ||
                  ctaLower.includes("check status") ||
                  ctaLower.includes("re-route") ||
                  ctaLower.includes("reroute");

                return (
                  <div className="group relative">
                    <button
                      className="rounded-md border border-primaryGray-1 bg-primaryGray-1 px-6 py-2.5 text-small font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={
                        !isKnownCta ||
                        rerouteSuccess ||
                        (showCallLog &&
                          (!callLogForm.repName.trim() ||
                            !callLogForm.dateOfCall.trim() ||
                            !callLogForm.summary.trim()))
                      }
                      onClick={() => {
                        if (
                          !showCallLog &&
                          (ctaLower.includes("call") ||
                            ctaLower.includes("check status"))
                        ) {
                          setShowCallLog(true);
                        } else if (
                          !rerouteSuccess &&
                          (ctaLower.includes("re-route") ||
                            ctaLower.includes("reroute"))
                        ) {
                          setRerouteSuccess(true);
                        } else {
                          // Submit call log or close
                          setShowCallLog(false);
                          setCallLogForm({
                            repName: "",
                            dateOfCall: new Date().toISOString().split("T")[0],
                            summary: "",
                          });
                          setCallMode("human");
                          setSelectedActionItem(null);
                        }
                      }}
                    >
                      {showCallLog
                        ? "Save"
                        : selectedActionItem.cta_microtext || "Close"}
                    </button>
                    {/* Coming Soon tooltip for unsupported CTAs */}
                    {!isKnownCta && (
                      <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-primaryGray-1 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                        Coming Soon
                        <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-primaryGray-1" />
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes outcomeModalFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes outcomeModalSlideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

/* ── Outcome status badge — mirrors buildBadgeValue in bqRowTransformer ── */
const outcomeBadgeStyle = (outcome: string) => {
  const lower = (outcome || "").toLowerCase().replace(/\s+/g, "_");

  if (
    lower.includes("approved") ||
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

const OutcomeBadge = ({ value }: { value: string }) => {
  const s = outcomeBadgeStyle(value);
  return (
    <span
      className="inline-block rounded-full px-3 py-0.5 text-small font-bold"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      {value}
    </span>
  );
};

/* ── Copyable field card ── */
const FieldCard = ({
  label,
  value,
  hideIfEmpty = false,
  variant = "default",
  accent,
  maxHeight,
}: {
  label: string;
  value: any;
  hideIfEmpty?: boolean;
  variant?: "default" | "highlight" | "badge";
  accent?: string;
  maxHeight?: string;
}) => {
  const [copied, setCopied] = React.useState(false);

  if (hideIfEmpty && !value) return null;

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(String(value));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (variant === "badge") {
    return (
      <div>
        <div className="mb-1 text-x-tiny font-semibold uppercase tracking-wider text-primaryGray-6">
          {label}
        </div>
        <OutcomeBadge value={value} />
      </div>
    );
  }

  const borderLeft = accent ? `3px solid ${accent}` : undefined;

  return (
    <div className="group">
      <div className="mb-1 text-x-tiny font-semibold uppercase tracking-wider text-primaryGray-6">
        {label}
      </div>
      <div
        className="relative rounded-lg border border-primaryGray-14 bg-white px-4 py-2.5 transition-shadow duration-150 hover:shadow-sm"
        style={{
          borderLeft,
          maxHeight: maxHeight ?? undefined,
          overflowY: maxHeight ? "auto" : undefined,
        }}
      >
        <div className="w-full whitespace-pre-wrap text-small leading-relaxed text-primaryGray-1">
          {value || "—"}
        </div>
        {value && (
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
        )}
      </div>
    </div>
  );
};

export default PharmaOutcomeLayout;
