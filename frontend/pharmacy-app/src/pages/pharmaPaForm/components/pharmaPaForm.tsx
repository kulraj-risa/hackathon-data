import Fuse from "fuse.js";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { openModal } from "risa-oasis-ui_v2";

import { getRapidsFileDownloadUrl } from "../../../api/firebase/rapidsFirestore";
import StatusBlock from "../../../components/statusBlock/statusBlock";
import { getMostMatchedStatusFromGivenComment } from "../../../constants/cmmStatusBeforeSendToPlan";
import { usePharmaFormFields } from "../../../context/pharmaFormFieldsContext";
import {
  FormDataModel,
  FormField,
} from "../../../data-model/pharmaPaFormModel";
import { OrderStatus } from "../../../enums/authStatus";
import { NycbsPharmaOrderKeys } from "../../../enums/nycbsPharmaOrder";
import { RootState } from "../../../redux/store/store";
import EyeIcon from "../../../svg/eye";
import WarningIcon from "../../../svg/warningIcon";
import { extractFieldMappings } from "../utils/getFormFieldsInfo";
import { getUpdatedFormDataWithFilledValues } from "../utils/getUpdatedFormDataWithFilledValues";
import { replaceOptionsWithRefDocId } from "../utils/updateFormOptions";

import RenderFields from "../../../components/formFields/renderFields";
import RenderSectionHeader from "../../../components/formFields/renderSectionHeader";
import DocViewerModal from "../../../components/modals/docViewerModal/docViewerModalNew";
import ImageviewerModal from "../../../components/modals/imageViewerModal/imageviewerModal";
import { CmmDocType } from "../../../enums/cmmDocType";
import InsuranceInfoBanner from "./insuranceInfoBanner";

interface PharmaPaFormProps {
  sectionOnClick?: (sectionKey: string) => void;
  docId: string;
}

const PharmaPaForm = (props: PharmaPaFormProps) => {
  const { sectionOnClick, docId } = props;

  const [formConfig, setFormConfig] = useState<FormDataModel | null>(null);
  const [currentFormId, setCurrentFormId] = useState<string>("");
  const {
    formFieldsData,
    setFormFieldsData,
    resetFormFieldsData,
    shouldRefetchData,
  } = usePharmaFormFields();
  const [docViewerModalOpen, setDocViewerModalOpen] = useState(false);
  const [docDownloadUrl, setDocDownloadUrl] = useState<string | null>(null);
  const [initialFormData, setInitialFormData] = useState<any>(null);
  const [cmmScreenshotDocDownloadUrl, setCmmScreenshotDocDownloadUrl] =
    useState<string | null>(null);
  const [prescriptionDocDownloadUrl, setPrescriptionDocDownloadUrl] = useState<
    string | null
  >(null);
  const [imageViewerModalOpen, setImageViewerModalOpen] = useState(false);
  const [docViewerModalType, setDocViewerModalType] = useState<
    "clinical_attachment" | "cmm_screenshot" | null
  >(null);

  const { data: singleCmmOrderData } = useSelector(
    (state: RootState) => state.cmmSingleOrder,
  );

  const { data: formOptions } = useSelector(
    (state: RootState) => state.formOptions,
  );

  const { data: formConfiguration } = useSelector(
    (state: RootState) => state.cmmFormConfig,
  );

  const { data: singleOrderDocs } = useSelector(
    (state: RootState) => state.nycbsDocuments,
  );

  const getStatusOfTheOrder = useMemo(() => {
    if (
      initialFormData?.[NycbsPharmaOrderKeys.Comment] &&
      initialFormData?.[NycbsPharmaOrderKeys.Comment]?.length > 3
    ) {
      return getMostMatchedStatusFromGivenComment(
        initialFormData?.[NycbsPharmaOrderKeys.Comment] ?? "",
      );
    }
  }, [initialFormData]);

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
    if (formOptions && formConfiguration && initialFormData) {
      const planNameFromDb = getFormConfigId(
        initialFormData?.[NycbsPharmaOrderKeys.PlanName] ?? "",
        formConfiguration,
      );
      setCurrentFormId(planNameFromDb);
    }
  }, [formOptions, formConfiguration, initialFormData]);

  useEffect(() => {
    if (!formConfig || !initialFormData || !singleCmmOrderData) return;

    const fieldMappings = extractFieldMappings(formConfig.fields);
    const oldFormFieldsData = { ...fieldMappings, ...formFieldsData };
    const formDataFromServer = initialFormData ?? {};

    if (Object.keys(formDataFromServer).length === 0) return;

    const updatedFormFieldsData = Object.entries(formDataFromServer).reduce(
      (acc, [key, value]) => ({
        ...acc,
        [key]: {
          ...(acc[key] || {
            isRequired: false,
            regexMatcher: null,
            type: "",
            isFieldDirty: false,
          }),
          filledValue:
            formFieldsData[key]?.filledValue !== undefined
              ? formFieldsData[key]?.filledValue
              : value,
          ...(key === NycbsPharmaOrderKeys.PrimaryDiagnoses
            ? {
                isRequired: Boolean(
                  formDataFromServer[
                    NycbsPharmaOrderKeys.IsDiagnosisCodeAvailableOnForm
                  ],
                ),
              }
            : {}),
        },
      }),
      oldFormFieldsData,
    );

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
        formFieldsData[key]?.filledValue || formDataFromServer[key] || "",
      regexMatcher: "",
      type: "text",
      isFieldDirty:
        formFieldsData[key]?.filledValue != singleCmmOrderData?.[key],
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
    };

    setFormFieldsData({
      ...insuranceFormFields,
      ...updatedFormFieldsData,
    });
  }, [formConfig, initialFormData, singleCmmOrderData]);

  useEffect(() => {
    const pickedFormConfig = formConfiguration?.find(
      (form) => form.id === currentFormId,
    );

    setFormConfig(
      replaceOptionsWithRefDocId(
        pickedFormConfig?.data ?? null,
        formOptions ?? [],
      ),
    );
  }, [currentFormId]);

  useEffect(() => {
    const observedSections = document.querySelectorAll(
      ".single-section__container",
    );

    const root = document.querySelector(".main-form.pharma-pa-form__body");

    if (observedSections.length === 0) return;
    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.intersectionRatio > 0.9) {
          sectionOnClick?.(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      root: root,
      threshold: [0.5, 0.9],
    });

    observedSections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [formFieldsData]);

  useEffect(() => {
    if (docViewerModalOpen) {
      openModal("doc-viewer-modal");
    }
  }, [docViewerModalOpen]);

  useEffect(() => {
    if (imageViewerModalOpen) {
      openModal("image-viewer-modal");
    }
  }, [imageViewerModalOpen]);

  const getLatestDocDownloadUrlOfRequiredDocType = async (
    docType: CmmDocType,
  ) => {
    const docs = singleOrderDocs?.filter(
      (doc) => doc.document_type === docType,
    );
    if (docs && docs.length > 0) {
      const latestDoc = docs.sort(
        (a, b) =>
          new Date(b?.created_at ?? "").getTime() -
          new Date(a?.created_at ?? "").getTime(),
      )[0];
      const url = await getRapidsFileDownloadUrl(latestDoc?.file_path ?? "");
      return url;
    }
    return null;
  };

  useEffect(() => {
    if (singleOrderDocs) {
      getLatestDocDownloadUrlOfRequiredDocType(CmmDocType.CMM_SCREENSHOT).then(
        (url) => {
          setCmmScreenshotDocDownloadUrl(url);
        },
      );
      getLatestDocDownloadUrlOfRequiredDocType(
        CmmDocType.CLINICAL_ATTACHMENT,
      ).then((url) => {
        setDocDownloadUrl(url);
      });
      getLatestDocDownloadUrlOfRequiredDocType(CmmDocType.PRESCRIPTION).then(
        (url) => {
          setPrescriptionDocDownloadUrl(url);
        },
      );
    }
  }, [singleOrderDocs]);

  useEffect(() => {
    if (!shouldRefetchData) {
      setInitialFormData(singleCmmOrderData);
    } else {
      const existingFormData =
        getUpdatedFormDataWithFilledValues(formFieldsData);
      setInitialFormData(existingFormData);
    }
  }, [shouldRefetchData]);

  const renderEachSectionOfTheForm = (
    section: FormField,
    onClick?: (sectionKey: string) => void,
  ) => {
    if (section.type !== "section" || !("fields" in section)) {
      return null;
    }

    const HIDDEN_FIELD_KEYS = [
      "checkEligibility",
      "check_patient_eligibility",
      "shareOutcome",
      "share_outcome",
    ];

    const groupedFields = section.fields
      .filter((field) => !HIDDEN_FIELD_KEYS.includes(field.key))
      .reduce<Record<number, FormField[]>>((acc, field) => {
        const rowIndex = field.rowIndex ?? 0;
        if (!acc[rowIndex]) {
          acc[rowIndex] = [];
        }
        acc[rowIndex].push(field);
        return acc;
      }, {});

    return (
      <div
        key={section.key}
        id={`${section.key}`}
        className="single-section__container mb-6"
        onClick={() => {
          onClick?.(section.key);
        }}
      >
        <RenderSectionHeader
          sectionTitle={section.label}
          sectionKey={`${section.key}`}
          id={initialFormData?.[NycbsPharmaOrderKeys.Identifier] ?? ""}
        />
        <div>
          {Object.keys(groupedFields).map((rowIndex) => (
            <div
              key={rowIndex}
              className="single-row__container mb-2 flex gap-2"
            >
              {groupedFields[rowIndex]
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((field) => (
                  <RenderFields
                    field={field}
                    key={field.key}
                    data={initialFormData}
                    originalData={singleCmmOrderData}
                  />
                ))}
            </div>
          ))}
        </div>
        {(section.additionalInfoHeader || section.additionalInfoContent) && (
          <div className="section-additonal-info flex w-full flex-col gap-2 bg-secondaryYellow-11 p-3">
            <div className="section-additonal-info__header text-tiny font-bold">
              {section.additionalInfoHeader ?? ""}
            </div>
            <div className="section-additonal-info__content text-[0.8125rem] font-normal">
              {section.additionalInfoContent ?? ""}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {formConfig &&
        Object.keys(formConfig).length > 0 &&
        formFieldsData &&
        Object.keys(formFieldsData).length > 0 && (
          <div className="pharma-form__container">
            {initialFormData?.[NycbsPharmaOrderKeys.Comment] &&
              initialFormData?.[NycbsPharmaOrderKeys.Comment]?.length > 3 &&
              initialFormData?.[NycbsPharmaOrderKeys.Status] ===
                OrderStatus.SENT_TO_PLAN && (
                <StatusBlock data={getStatusOfTheOrder} />
              )}
            <InsuranceInfoBanner docId={docId} />
            {formConfig?.fields
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map((section) =>
                renderEachSectionOfTheForm(section, sectionOnClick),
              )}
            <div
              key={"attachments"}
              id={"attachments"}
              className="single-section__container mb-6"
              onClick={() => {
                sectionOnClick?.("attachments");
              }}
            >
              <RenderSectionHeader
                sectionTitle={"Attachments"}
                sectionKey={"attachments"}
                id={initialFormData?.[NycbsPharmaOrderKeys.Identifier] ?? ""}
              />
              {singleOrderDocs &&
              singleOrderDocs?.filter(
                (doc) => doc.document_type === "clinical_attachment",
              ).length > 0 ? (
                <div
                  className="document-card flex w-full items-center justify-between rounded border border-primaryGray-15 px-3 py-2 text-small font-semibold shadow hover:cursor-pointer"
                  onClick={() => {
                    setDocViewerModalOpen(true);
                    setDocViewerModalType("clinical_attachment");
                  }}
                >
                  <div className="document-card--text">Clinical Document</div>

                  <div className="document-card--icon flex items-center gap-1 text-tertiaryBlue-4">
                    <EyeIcon />
                    View Document
                  </div>
                </div>
              ) : (
                <div className="document-card flex w-full items-center gap-2 px-3 py-2 text-small font-normal text-tertiaryRed-3">
                  <div className="document-card--info">
                    <WarningIcon height="16" width="16" />
                  </div>
                  <div className="document-card--text">
                    No Attachments Found
                  </div>
                </div>
              )}
              {docViewerModalOpen && (
                <DocViewerModal
                  fileUrl={
                    docViewerModalType === "clinical_attachment"
                      ? (docDownloadUrl ?? "")
                      : (cmmScreenshotDocDownloadUrl ?? "")
                  }
                  onClose={() => {
                    setDocViewerModalOpen(false);
                  }}
                  type={docViewerModalType ?? "clinical_attachment"}
                />
              )}
            </div>
            {imageViewerModalOpen && (
              <ImageviewerModal
                fileUrls={[prescriptionDocDownloadUrl ?? ""]}
                onClose={() => {
                  setImageViewerModalOpen(false);
                }}
              />
            )}
          </div>
        )}
    </>
  );
};

export default PharmaPaForm;
