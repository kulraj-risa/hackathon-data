import moment from "moment";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { Footer, Pagination, SpinningLoader } from "risa-oasis-ui_v2";
import { fetchBqRecordByIdentifier } from "../../api/bigQuery/paCasesBigQuery";
import { addCmmEvent } from "../../api/firebase/firestoreService";
import { getRapidsFileDownloadUrl } from "../../api/firebase/rapidsFirestore";
import Breadcrumb, {
  buildBreadcrumbItems,
} from "../../components/breadcrumb/Breadcrumb";
import { LoaderMessage } from "../../components/loaderMessage/loaderMessage";
import PdfRender from "../../components/pdfRender/pdfRender";
import { usePharmaFormFields } from "../../context/pharmaFormFieldsContext";
import { NycbDocumentModel } from "../../data-model/nycbsPharmaOrder";
import { CmmEvents } from "../../enums/cmmEvents";
import { NycbsPharmaOrderKeys } from "../../enums/nycbsPharmaOrder";
import { ScreenNames } from "../../enums/screenNames";
import { fetchCmmSingleOrderSuccess } from "../../redux/slice/cmm/cmmSingleOrderSlice";
import { setInsuranceDetails } from "../../redux/slice/cmm/insuranceDetailsSlice";
import { setPatientEligibilityDetailsFromBq } from "../../redux/slice/cmm/patientEligibilitySlice";
import { fetchSingleOrderDocs } from "../../redux/slice/nycbsPharmaExternal/nycbsDocumentsSlice";
import { AppDispatch, RootState } from "../../redux/store/store";
import { CopyIcon } from "../../svg/copy-icon";
import { calculateAge } from "../../utils/ageCalculator";
import { generateFullName } from "../../utils/generateOrderDataForTable";
import { mapBqRowToFlatModel } from "../../utils/mapBqRowToFlatModel";
import { capitalizeString } from "../../utils/stringModifications";
import InsuranceInfoBanner from "../pharmaPaForm/components/insuranceInfoBanner";
import InsuranceDetails from "./components/insuranceDetails";
import {
  mapBqRowToInsuranceDetailsModels,
  mapBqRowToPatientEligibilityModels,
} from "./utils/mapBqToInsurance";

const InsuranceDetailsLayout = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error: insuranceError } = useSelector(
    (state: RootState) => state.insuranceDetails,
  );
  const {
    data: singleCmmOrderData,
    loading: singleOrderLoading,
    error: singleOrderError,
  } = useSelector((state: RootState) => state.cmmSingleOrder);
  const { data: nycbsDocuments, loading: nycbsDocumentsLoading } = useSelector(
    (state: RootState) => state.nycbsDocuments,
  );

  const { formFieldsData, setFormFieldsData, resetFormFieldsData } =
    usePharmaFormFields();

  const { data: patientEligibilityData, loading: patientEligibilityLoading } =
    useSelector((state: RootState) => state.patientEligibility);

  const [insuranceDocuments, setInsuranceDocuments] = useState<
    NycbDocumentModel[]
  >([]);
  const [fetchingDocUrl, setFetchingDocUrl] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [docUrl, setDocUrl] = useState<string>("");
  const { user } = useSelector(
    (state: RootState) => state.firebaseAuthentication,
  );
  const { id } = useParams();
  const navigate = useNavigate();

  const [bqSource, setBqSource] = useState(false);

  const loadFromBigQuery = useCallback(
    async (identifier: string) => {
      const row = await fetchBqRecordByIdentifier(identifier);
      if (!row) return;

      // Order header: patient name, MRN, DOB, BIN/PCN/Group, drug, type
      dispatch(fetchCmmSingleOrderSuccess(mapBqRowToFlatModel(row)));
      setBqSource(true);

      // Insurance cards: active insurance + PBM (insurance.active_insurance.*)
      dispatch(setInsuranceDetails(mapBqRowToInsuranceDetailsModels(row)));

      // PBM Eligibility: insurance_records[] or derived from pbm + patient
      dispatch(
        setPatientEligibilityDetailsFromBq(
          mapBqRowToPatientEligibilityModels(row),
        ),
      );
    },
    [dispatch],
  );

  useEffect(() => {
    if (!id) return;
    loadFromBigQuery(id); // all data from one BQ fetch
    dispatch(fetchSingleOrderDocs(id)); // PDF docs from Firebase Storage
  }, [id]);

  useEffect(() => {
    if (nycbsDocuments && nycbsDocuments.length > 0) {
      const insuranceDocument = nycbsDocuments.filter(
        (doc) => doc.document_type === "insurance_card",
      );
      const sortedInsuranceDocumentsByVisistDate = insuranceDocument.sort(
        (a, b) => {
          return (
            new Date(b?.visit_date ?? "").getTime() -
            new Date(a?.visit_date ?? "").getTime()
          );
        },
      );
      setInsuranceDocuments(sortedInsuranceDocumentsByVisistDate);
    }
  }, [nycbsDocuments]);

  const getDownloadUrlOfEachDocument = async () => {
    setFetchingDocUrl(true);
    const insuranceDocument = insuranceDocuments[currentPage - 1];
    const downloadUrl = await getRapidsFileDownloadUrl(
      insuranceDocument.file_path ?? "",
    );
    setDocUrl(downloadUrl);
    setFetchingDocUrl(false);
  };

  useEffect(() => {
    if (insuranceDocuments.length > 0) {
      getDownloadUrlOfEachDocument();
    }
  }, [currentPage, insuranceDocuments]);

  useEffect(() => {
    if (
      singleCmmOrderData &&
      !singleOrderLoading &&
      singleCmmOrderData?.[NycbsPharmaOrderKeys.Identifier] === id
    ) {
      const createInsuranceField = (
        key: string,
        isRequired: boolean,
      ): {
        isRequired: boolean;
        filledValue: any;
        regexMatcher: string;
        type: string;
        isFieldDirty: boolean;
      } => ({
        isRequired,
        filledValue:
          formFieldsData[key]?.filledValue || singleCmmOrderData?.[key] || "",
        regexMatcher: "",
        type: "text",
        isFieldDirty: (() => {
          const formValue = formFieldsData[key]?.filledValue;
          const orderValue = singleCmmOrderData?.[key];
          if (formValue === undefined) return false;
          return formValue != orderValue;
        })(),
      });
      const insuranceFormFields = {
        [NycbsPharmaOrderKeys.PatientInsuranceState]: createInsuranceField(
          NycbsPharmaOrderKeys.PatientInsuranceState,
          true,
        ),
        [NycbsPharmaOrderKeys.PatientRxBin]: createInsuranceField(
          NycbsPharmaOrderKeys.PatientRxBin,
          false,
        ),
        [NycbsPharmaOrderKeys.PatientRxPcn]: createInsuranceField(
          NycbsPharmaOrderKeys.PatientRxPcn,
          false,
        ),
        [NycbsPharmaOrderKeys.PatientRxGroup]: createInsuranceField(
          NycbsPharmaOrderKeys.PatientRxGroup,
          false,
        ),
        [NycbsPharmaOrderKeys.FormName]: createInsuranceField(
          NycbsPharmaOrderKeys.FormName,
          false,
        ),
        [NycbsPharmaOrderKeys.PlanName]: createInsuranceField(
          NycbsPharmaOrderKeys.PlanName,
          false,
        ),
        [NycbsPharmaOrderKeys.FormNameInside]: createInsuranceField(
          NycbsPharmaOrderKeys.FormNameInside,
          false,
        ),
      };

      setFormFieldsData((prev) => ({
        ...prev,
        ...insuranceFormFields,
      }));
    }
  }, [singleCmmOrderData, singleOrderLoading]);

  return (
    <div className="insurance-details__container flex h-full flex-col bg-[#F7F9FA] px-[0.9375rem] py-[0.625rem]">
      {loading ||
      singleOrderLoading ||
      nycbsDocumentsLoading ||
      patientEligibilityLoading ? (
        <div className="flex h-full items-center justify-center">
          <LoaderMessage message="Loading Insurance Details..." />
        </div>
      ) : insuranceError || singleOrderError ? (
        <div className="flex h-full items-center justify-center">
          <div className="error-message p-4 text-red-500">
            <p>Failed to load insurance details. Please try again later.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="insurance-details__header mb-4">
            <Breadcrumb items={buildBreadcrumbItems("ev-bv", id ?? "")} />
          </div>
          <div className="insurance-details__body flex flex-1 flex-col overflow-hidden rounded bg-white p-4 pb-0">
            <div className="insurance-details__body--header mb-4">
              <div className="insurance-details__body--header-details flex items-center justify-between gap-2">
                {singleOrderLoading ? (
                  <div className="flex h-14 w-full items-center justify-center gap-2">
                    <SpinningLoader />
                    <div className="message">Loading Insurance Details...</div>
                  </div>
                ) : (
                  <div className="insurance-details__body--header titles flex w-full gap-2">
                    <div className="insurance-details__body-page-name flex items-center gap-2 text-large font-semiBold leading-6 text-black">
                      Eligibility and Benefit Verification
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
                      {singleCmmOrderData?.[NycbsPharmaOrderKeys.DrugType] ||
                        "—"}
                    </div>
                    <div
                      className="rounded-[1.875rem] px-4 text-small font-semibold leading-6"
                      style={{ backgroundColor: "#0056D6", color: "#FFFFFF" }}
                    >
                      {singleCmmOrderData?.[
                        NycbsPharmaOrderKeys.GenericBrand
                      ] || "—"}
                    </div>
                    <div className="cmm-result-key ml-auto flex items-center gap-2 text-small">
                      Cmm Key:{" "}
                      <span className="font-bold">
                        {singleCmmOrderData?.[
                          NycbsPharmaOrderKeys.CmmResultKey
                        ] ?? ""}
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
                )}
              </div>
            </div>

            <div className="insurance-details__body-content flex flex-1 overflow-hidden rounded-t-lg border bg-[#F7F9FA]">
              {nycbsDocumentsLoading ? (
                <div className="flex h-full w-1/2 items-center justify-center gap-2">
                  <SpinningLoader />
                  <div className="message">Loading Insurance Details...</div>
                </div>
              ) : (
                <div className="insurance-details__body-content--left relative flex w-1/2 flex-col">
                  <div className="insurance-details__body-content--left header flex items-center justify-between border-b border-primaryGray-15 bg-white p-2">
                    <div className="text-small font-semibold leading-6 text-primaryGray-1">
                      {insuranceDocuments[currentPage - 1]?.document_name ??
                        "Unknown"}
                    </div>
                    <div className="text-small font-normal italic leading-6 text-primaryGray-1">
                      Updated on :{" "}
                      {insuranceDocuments[currentPage - 1]?.visit_date
                        ? moment(
                            insuranceDocuments[currentPage - 1]?.visit_date,
                          ).format("MM/DD/YYYY")
                        : "N/A"}
                    </div>
                  </div>
                  <div className="ml-4 mr-4 mt-4 flex-1 overflow-auto">
                    {fetchingDocUrl ? (
                      <div className="flex h-full w-full items-center justify-center">
                        <LoaderMessage message="Fetching Document..." />
                      </div>
                    ) : insuranceDocuments.length === 0 ? (
                      <div className="flex h-full w-full items-center justify-center">
                        {" "}
                        <p className="text-gray-500">
                          No insurance documents available.
                        </p>{" "}
                      </div>
                    ) : (
                      <PdfRender file={docUrl} />
                    )}
                  </div>
                  <div className="insurance-details__body-content--left pagination absolute inset-x-0 bottom-4 z-10 flex w-full items-center justify-center">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={insuranceDocuments.length}
                      onPrevious={() => {
                        setCurrentPage(currentPage - 1);
                      }}
                      onNext={() => {
                        setCurrentPage(currentPage + 1);
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="insurance-details__body-content--right flex w-1/2 flex-col gap-4 overflow-auto border-l bg-white p-4">
                {singleOrderLoading ? (
                  <div className="flex h-1/2 w-full items-center justify-center gap-2 bg-primaryGray-16">
                    <SpinningLoader />
                    <div className="message text-sm">
                      Loading Order Details...
                    </div>
                  </div>
                ) : (
                  <InsuranceInfoBanner docId={id ?? ""} />
                )}
                {loading || patientEligibilityLoading ? (
                  <div className="flex h-1/2 w-full items-center justify-center gap-2 bg-primaryGray-16">
                    <SpinningLoader />
                    <div className="message text-sm">
                      Loading Patient Eligibility Details...
                    </div>
                    x{" "}
                  </div>
                ) : (
                  <InsuranceDetails />
                )}
              </div>
            </div>
          </div>
          <div className="insurance-details__footer">
            <Footer
              cancelButtonText={"Go Back"}
              submitButtonText={"Continue"}
              onCancelClick={() => {
                navigate("/pharma-pa-worklists");
              }}
              onSubmitClick={() => {
                addCmmEvent(id ?? "", {
                  event: CmmEvents.CONTINUE_CLICKED_ON_INSURANCE_DETAILS,
                  screen_name: ScreenNames.INSURANCE_DETAILS,
                  created_at: new Date(),
                  email: user?.email ?? "",
                });
                navigate(`/pharma-pa-worklists/pharma-pa-form/${id}`);
              }}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default InsuranceDetailsLayout;
