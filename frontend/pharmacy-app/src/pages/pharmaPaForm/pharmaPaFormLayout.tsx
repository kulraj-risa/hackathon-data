import Fuse from "fuse.js";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Button,
  closeModal,
  controlToastState,
  Footer,
} from "risa-oasis-ui_v2";
import {
  editCoverMyMedsRequest,
  sendtoPlanRequest,
} from "../../api/bigQuery/nycbsPharmaOrders";
import { addCmmEvent } from "../../api/firebase/firestoreService";
import Breadcrumb, {
  buildBreadcrumbItems,
} from "../../components/breadcrumb/Breadcrumb";
import FormSections from "../../components/formSections/formSections";
import { LoaderMessage } from "../../components/loaderMessage/loaderMessage";
import DrugLabelModal from "../../components/modals/drugLabelModal/drugLabelModal";
import InsuranceDetailsErrorModal from "../../components/modals/insuranceDetailsErrorModal/insuranceDetailsErrorModal";
import InsuranceModal from "../../components/modals/insuranceModal/insuranceModal";
import SendToPlanConfirmModal from "../../components/modals/sendToPlanConfirmModal/sendToPlanConfirmModal";
import SubmissionSummary from "../../components/modals/submissionSummary/submissionSummary";
import { usePharmaFormFields } from "../../context/pharmaFormFieldsContext";
import { mapToCoverMyMedsInputModel } from "../../data-model/cmmInputRequestModel";
import { CmmEvents } from "../../enums/cmmEvents";
import { ModalId } from "../../enums/modalId";
import { NycbsPharmaOrderKeys } from "../../enums/nycbsPharmaOrder";
import { ScreenNames } from "../../enums/screenNames";
import { useModalOpener } from "../../hooks/useModalOpener";
import { fetchAllCmmFormConfiguration } from "../../redux/slice/cmm/cmmFormConfig";
import { fetchSingleOrderDetailsForCmm } from "../../redux/slice/cmm/cmmSingleOrderSlice";
import { fetchAllDiagnosisDetailsForAnOrder } from "../../redux/slice/cmm/dignosisDetailsSlice";
import { fetchAllQuestionFromBigQuery } from "../../redux/slice/cmm/pharmaQuestionsSlice";
import { fetchPrescriptionData } from "../../redux/slice/cmm/prescriptionSlice";
import { fetchAllFormOptionsFromFirebase } from "../../redux/slice/formOptionsSlice";
import { closeModal as closeModalNew } from "../../redux/slice/modalSliceNew";
import { fetchSingleOrderDocs } from "../../redux/slice/nycbsPharmaExternal/nycbsDocumentsSlice";
import { AppDispatch, RootState } from "../../redux/store/store";
import { CopyIcon } from "../../svg/copy-icon";
import { calculateAge } from "../../utils/ageCalculator";
import { logDataToConsole } from "../../utils/customLogger";
import { generateFullName } from "../../utils/generateOrderDataForTable";
import { capitalizeString } from "../../utils/stringModifications";
import MedicalNecessityAgents from "../pharmaQuestionaire/components/medicalNecessityAgents";
import PaPreCheckDrawer, {
  RequiredFieldCheck,
} from "./components/paPreCheckDrawer";
import PharmaPaForm from "./components/pharmaPaForm";
import { getFooterButtonConfig } from "./utils/footerButtonConfig";
import { getUpdatedFormDataWithFilledValues } from "./utils/getUpdatedFormDataWithFilledValues";

const PharmaPaFormLayout = () => {
  const {
    isAllFieldsValidationFree,
    setShouldRefetchData,
    formFieldsData,
    isFormDirty,
  } = usePharmaFormFields();
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentFormId, setCurrentFormId] = useState<string | null>(null);
  const [fetchModalOpen, setFetchModalOpen] = useState(false);
  const [showInsuranceErrorModal, setShowInsuranceErrorModal] = useState(false);
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  const { metaData } = useSelector((state: RootState) => state.modalSliceNew);
  const { openedModalId } = useModalOpener();
  const dispatch = useDispatch<AppDispatch>();
  const { data, loading, error } = useSelector(
    (state: RootState) => state.cmmSingleOrder,
  );

  const {
    data: formOptions,
    loading: formOptionsLoading,
    error: formOptionsError,
  } = useSelector((state: RootState) => state.formOptions);

  const {
    data: formConfig,
    loading: formConfigLoading,
    error: formConfigError,
  } = useSelector((state: RootState) => state.cmmFormConfig);

  const { data: pharmaQuestionaire, loading: pharmaQuestionaireLoading } =
    useSelector((state: RootState) => state.pharmaQuestions);

  const { user } = useSelector(
    (state: RootState) => state.firebaseAuthentication,
  );

  const { loading: diagnosisDetailsLoading } = useSelector(
    (state: RootState) => state.diagnosisDetails,
  );

  const { loading: singleOrderDocsLoading } = useSelector(
    (state: RootState) => state.nycbsDocuments,
  );

  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [showPreCheck, setShowPreCheck] = useState(false);
  const [showAgents, setShowAgents] = useState(false);

  // ── Inputs for the AI Pre-Check + Medical Necessity agents (read from order) ──
  const preCheckDrug =
    (data?.[NycbsPharmaOrderKeys.DrugNameOncoEmr] as string) ||
    (data?.[NycbsPharmaOrderKeys.DrugName] as string) ||
    "";
  const preCheckPayer = (data?.[NycbsPharmaOrderKeys.PlanName] as string) || "";
  const preCheckMedClass =
    (data?.[NycbsPharmaOrderKeys.GenericBrand] as string) || "Brand";
  const diagnosisCode = (data?.[NycbsPharmaOrderKeys.PrimaryDiagnoses] as string) || "";
  const diagnosisDesc =
    (data?.[NycbsPharmaOrderKeys.PrimaryDiagnosesDescription] as string) || "";
  const drugConfidence =
    data?.[NycbsPharmaOrderKeys.DrugConfidenceScore] != null
      ? Number(data[NycbsPharmaOrderKeys.DrugConfidenceScore])
      : null;

  const requiredFields: RequiredFieldCheck[] = useMemo(() => {
    const v = (k: NycbsPharmaOrderKeys) => (data?.[k] != null ? String(data[k]) : "");
    return [
      { label: "Drug name", value: v(NycbsPharmaOrderKeys.DrugNameOncoEmr) || v(NycbsPharmaOrderKeys.DrugName), critical: true },
      { label: "Primary diagnosis (ICD)", value: v(NycbsPharmaOrderKeys.PrimaryDiagnoses), critical: true },
      { label: "Patient first name", value: v(NycbsPharmaOrderKeys.PatientFirstName), critical: true },
      { label: "Patient last name", value: v(NycbsPharmaOrderKeys.PatientLastName), critical: true },
      { label: "Date of birth", value: v(NycbsPharmaOrderKeys.PatientDob), critical: true },
      { label: "Member ID", value: v(NycbsPharmaOrderKeys.PatientMemberId), critical: true },
      { label: "Gender", value: v(NycbsPharmaOrderKeys.PatientGender) },
      { label: "Patient address", value: v(NycbsPharmaOrderKeys.PatientAddress) },
      { label: "Drug quantity", value: v(NycbsPharmaOrderKeys.DrugQuantity) },
      { label: "Days supply", value: v(NycbsPharmaOrderKeys.DrugDaysSupply) },
      { label: "Plan / PBM", value: v(NycbsPharmaOrderKeys.PlanName) },
      { label: "Provider NPI", value: v(NycbsPharmaOrderKeys.ProviderNpi) },
      { label: "Provider name", value: v(NycbsPharmaOrderKeys.ProviderLastName) },
      { label: "Provider fax", value: v(NycbsPharmaOrderKeys.ProviderFax) },
    ];
  }, [data]);

  // Aggregate chart evidence from the fetched questionnaire for the agents drawer.
  const { agentSupportive, agentContradictory } = useMemo(() => {
    const sup: string[] = [];
    const con: string[] = [];
    (pharmaQuestionaire?.questions || []).forEach((q: any) => {
      const facts = q?.api_response?.facts;
      (facts?.supportive_facts || []).forEach((f: string) => f && sup.push(f));
      (facts?.contradictory_facts || []).forEach((f: string) => f && con.push(f));
    });
    return { agentSupportive: sup, agentContradictory: con };
  }, [pharmaQuestionaire]);

  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const navigate = useNavigate();

  const shouldDisableSendToPlan = () => {
    if (
      data?.[NycbsPharmaOrderKeys.CmmResultKey] === undefined ||
      data?.[NycbsPharmaOrderKeys.CmmResultKey] === null ||
      data?.[NycbsPharmaOrderKeys.CmmResultKey]?.trim() === ""
    ) {
      return true;
    }

    if (!isAllFieldsValidationFree) return true;

    if (isFormDirty) return true;

    return false;
  };

  const onFormSubmit = async (sendToPlan: boolean) => {
    const updatedFormDataWithFilledValues = mapToCoverMyMedsInputModel(
      getUpdatedFormDataWithFilledValues(formFieldsData),
    );
    logDataToConsole("Final CMM Data", {
      cover_my_meds_input: updatedFormDataWithFilledValues,
      send_to_plan: false,
    });

    if (sendToPlan && pharmaQuestionaire === null) {
      sendtoPlanRequest(
        updatedFormDataWithFilledValues,
        id ?? "",
        ScreenNames.PHARMA_PA_FORM,
        user?.email ?? "",
      );
      controlToastState("send-to-plan-success");
    } else {
      editCoverMyMedsRequest(
        {
          cover_my_meds_input: updatedFormDataWithFilledValues,
          send_to_plan: false,
        },
        id ?? "",
        ScreenNames.PHARMA_PA_FORM,
        user?.email ?? "",
      );
      controlToastState("form-save-success");
    }
    if (pharmaQuestionaire) {
      navigate(`/pharma-pa-worklists/pharma-pa-questionaire/${id}`);
    } else {
      navigate(`/pharma-pa-worklists/`);
    }
  };

  const getFormConfigId = (planName: string, formConfiguration) => {
    if (!planName || planName === "") {
      return "default";
    }

    const fuzzySearchOptions = {
      includeScore: true,
      threshold: 0.3,
      distance: 200,
      useExtendedSearch: true,
      keys: ["id"],
    };

    const options = fuzzySearchOptions;
    const fuse = new Fuse(formConfiguration, options);
    const result = fuse.search(planName);
    const mostMatchedSearch = result?.[0]?.item;

    return mostMatchedSearch?.["id"] ?? "default";
  };

  useEffect(() => {
    if (formConfig && data) {
      const planNameFromDb = getFormConfigId(
        data?.[NycbsPharmaOrderKeys.PlanName] ?? "",
        formConfig,
      );
      setCurrentFormId(planNameFromDb);
    }
  }, [formConfig, data]);

  // Handle opening report inaccuracy modal from URL parameter
  useEffect(() => {
    const openReportInaccuracy = searchParams.get("openReportInaccuracy");
    if (openReportInaccuracy === "true" && !loading && data) {
      setShowInsuranceErrorModal(true);
      // Remove the parameter from URL
      searchParams.delete("openReportInaccuracy");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, loading, data]);

  useEffect(() => {
    if (!user) return;
    if (!formOptions && !formOptionsLoading && !formOptionsError) {
      dispatch(fetchAllFormOptionsFromFirebase());
    }
    if (!formConfig && !formConfigLoading && !formConfigError) {
      dispatch(fetchAllCmmFormConfiguration());
    }
  }, [user, formOptions, formOptionsLoading, formOptionsError, formConfig, formConfigLoading, formConfigError]);

  useEffect(() => {
    if (id) {
      dispatch(fetchSingleOrderDetailsForCmm(id));
      dispatch(fetchAllQuestionFromBigQuery(id));
      dispatch(fetchPrescriptionData(id));
      dispatch(fetchAllDiagnosisDetailsForAnOrder(id));
      dispatch(fetchSingleOrderDocs(id));
    }
  }, [id]);

  // Get the footer button configuration
  const footerButtonConfig = getFooterButtonConfig({
    data: data ?? null,
    isAllFieldsValidationFree,
    isFormDirty,
  });

  const isFormDataReady =
    formOptions && formOptions.length > 0 && formConfig && !loading;
  const hasFormDataError = formOptionsError || formConfigError;

  return (
    <>
      {!isFormDataReady && !hasFormDataError ? (
        <div className="full-screen__loader flex h-full flex-col">
          <LoaderMessage message="Fetching form information..." />
        </div>
      ) : hasFormDataError ? (
        <div style={{ padding: 40, fontFamily: "sans-serif", color: "#666" }}>
          <p>Unable to load form configuration. Please refresh the page.</p>
        </div>
      ) : (
        formOptions &&
        formOptions.length > 0 && (
          <div className="pharma-pa-form__container flex h-full flex-col bg-[#F7F9FA] px-[0.9375rem] py-[0.625rem]">
            <div className="pharma-pa-form__header mb-4">
              <Breadcrumb items={buildBreadcrumbItems("pa-form", id ?? "")} />
            </div>
            <div className="pharma-pa-form__body flex flex-1 flex-col overflow-hidden rounded bg-white p-4 pb-0">
              <div className="pharma-pa-form__body--header mb-4">
                <div className="pharma-pa-form__body--header-details flex items-center gap-2">
                  <div className="pharma-pa-form__body page-name text-large font-semiBold leading-6 text-black">
                    Prior Authorisation Form
                  </div>
                  <div className="insurance-details__body-patient-name rounded-[1.875rem] bg-primaryGray-16 px-4 text-small font-semibold leading-6 text-primaryGray-1">
                    {capitalizeString(
                      generateFullName(
                        data?.[NycbsPharmaOrderKeys.PatientFirstName] || "",
                        "",
                        data?.[NycbsPharmaOrderKeys.PatientLastName] || "",
                      ),
                    )}
                    &nbsp;&nbsp;<span>&#8226;</span>&nbsp;&nbsp;
                    {data?.[NycbsPharmaOrderKeys.PatientMrn] ?? ""}
                    &nbsp;&nbsp;<span>&#8226;</span>&nbsp;&nbsp;
                    {data?.[NycbsPharmaOrderKeys.PatientDob] ?? ""}
                    &nbsp;&nbsp;(
                    {calculateAge(
                      data?.[NycbsPharmaOrderKeys.PatientDob] ?? "",
                    )}
                    yrs) &nbsp;&nbsp;<span>&#8226;</span>&nbsp;&nbsp;
                    &nbsp;&nbsp;
                    {data?.[NycbsPharmaOrderKeys.DrugNameOncoEmr] ?? ""}
                  </div>
                  <div
                    className="rounded-[1.875rem] px-4 text-small font-semibold leading-6"
                    style={{ backgroundColor: "#CC0300", color: "#FFFFFF" }}
                  >
                    {data?.[NycbsPharmaOrderKeys.DrugType] || "—"}
                  </div>
                  <div
                    className="rounded-[1.875rem] px-4 text-small font-semibold leading-6"
                    style={{ backgroundColor: "#0056D6", color: "#FFFFFF" }}
                  >
                    {data?.[NycbsPharmaOrderKeys.GenericBrand] || "—"}
                  </div>

                  <div className="cmm-result-key ml-auto flex items-center gap-2 text-small">
                    Cmm Key:{" "}
                    <span className="font-bold">
                      {data?.[NycbsPharmaOrderKeys.CmmResultKey] ?? ""}&nbsp;
                    </span>
                    <div
                      className="cmm-result-key copy-icon mr-2 hover:cursor-pointer"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          data?.[NycbsPharmaOrderKeys.CmmResultKey] ?? "",
                        );
                      }}
                    >
                      <CopyIcon />
                    </div>
                    <Button
                      buttonType="secondary"
                      size="small"
                      disabled={false}
                      onClick={() => {
                        setFetchModalOpen(true);
                      }}
                    >
                      Fetch Drug Usage
                    </Button>
                    <Button
                      buttonType="secondary"
                      size="small"
                      disabled={false}
                      onClick={() => setShowAgents(true)}
                    >
                      AI Reasoning
                    </Button>
                    <Button
                      buttonType="primary"
                      size="small"
                      disabled={false}
                      onClick={() => setShowPreCheck(true)}
                    >
                      AI Pre-Check
                    </Button>
                  </div>
                </div>
              </div>
              <div className="pharma-pa-form__body content flex flex-1 overflow-hidden">
                <div className="pharma-pa-form__body form-sections w-1/5">
                  <FormSections
                    activeSection={
                      activeSectionId ? `section-${activeSectionId}` : undefined
                    }
                    formConfiguration={formConfig ?? []}
                    matchedKey={currentFormId ?? ""}
                  />
                </div>
                <div className="pharma-pa-form__body main-form h-full w-4/5 overflow-auto overflow-x-hidden border border-primaryGray-16 p-4">
                  <PharmaPaForm
                    sectionOnClick={(value) => {
                      setActiveSectionId(value as string);
                    }}
                    docId={id ?? ""}
                  />
                </div>
              </div>
            </div>
            <div className="pharma-pa-form__footer">
              <Footer
                cancelButtonText={"Save"}
                submitButtonText={"Continue"}
                onCancelClick={() => {
                  addCmmEvent(id ?? "", {
                    event: CmmEvents.SAVE_CLICKED_ON_FORM,
                    screen_name: ScreenNames.PHARMA_PA_FORM,
                    created_at: new Date(),
                    email: user?.email ?? "",
                  });
                  onFormSubmit(false);
                }}
                onSubmitClick={() => {
                  navigate(`/pharma-pa-worklists/pharma-pa-questionaire/${id}`);
                }}
                isDisabled={false}
                isCancelDisabled={!isFormDirty}
              >
                <button
                  className="footer-button-cancel"
                  onClick={() => {
                    navigate(`/pharma-pa-worklists/insurance-details/${id}`);
                  }}
                >
                  Go Back
                </button>
              </Footer>
              <PaPreCheckDrawer
                open={showPreCheck}
                onClose={() => setShowPreCheck(false)}
                drug={preCheckDrug}
                medicationClass={preCheckMedClass}
                payer={preCheckPayer}
                diagnosisCode={diagnosisCode}
                diagnosisDesc={diagnosisDesc}
                requiredFields={requiredFields}
                drugConfidence={drugConfidence}
              />
              <MedicalNecessityAgents
                open={showAgents}
                onClose={() => setShowAgents(false)}
                drug={preCheckDrug}
                payer={preCheckPayer}
                supportiveTexts={agentSupportive}
                contradictoryTexts={agentContradictory}
                questions={(pharmaQuestionaire?.questions as any) || []}
              />
              {openConfirmModal && (
                <SendToPlanConfirmModal
                  onClose={() => setOpenConfirmModal(false)}
                  onSaveClick={() => {
                    addCmmEvent(id ?? "", {
                      event: CmmEvents.SEND_TO_PLAN_MODAL_CONFIRM,
                      screen_name: ScreenNames.SEND_TO_PLAN_MODAL,
                      created_at: new Date(),
                      email: user?.email ?? "",
                    });
                    onFormSubmit(true);
                  }}
                />
              )}
              {fetchModalOpen && (
                <DrugLabelModal
                  onClose={() => {
                    setFetchModalOpen(false);
                    closeModal("drug-label-modal");
                  }}
                />
              )}
              {showInsuranceErrorModal && (
                <InsuranceDetailsErrorModal
                  onCloseModal={() => setShowInsuranceErrorModal(false)}
                  onSuccessfullSave={() => {
                    setShowInsuranceErrorModal(false);
                    setShowInsuranceModal(true);
                  }}
                />
              )}
              {showInsuranceModal && (
                <InsuranceModal
                  isModalOpen={(value) => setShowInsuranceModal(value)}
                  id={id ?? ""}
                  docId={id ?? ""}
                />
              )}
              {openedModalId === ModalId.SUBMISSION_SUMMARY_MODAL &&
                metaData &&
                "data" in metaData && (
                  <SubmissionSummary
                    onClose={() => {
                      dispatch(closeModalNew());
                    }}
                    metaData={metaData as { data: any }}
                    onSuccess={() => {
                      dispatch(closeModalNew());
                    }}
                  />
                )}
            </div>
          </div>
        )
      )}
    </>
  );
};

export default PharmaPaFormLayout;
