import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { controlToastState, openModal } from "risa-oasis-ui_v2";
import { getBearerToken } from "../../api/postCall/bearerToken";
import { API_ENDPOINTS } from "../../enums/apiUrls";
import { RootState } from "../../redux/store/store";
import EyeIcon from "../../svg/eye";
import RefreshIcon from "../../svg/refresh-icon";
import DiagnosisCodeModal from "../modals/diagnosisCodeModal/diagnosisCodeModal";
import DrugDetailsModal from "../modals/drugDetailModal/drugDetailsModal";
import PrescriptionModal from "../modals/prescriptionModal/prescriptionModal";

interface RenderSectionHeaderProps {
  sectionTitle: string;
  sectionKey: string;
  id: string;
}
const RenderSectionHeader = (props: RenderSectionHeaderProps) => {
  const { data: singleCmmOrderData } = useSelector(
    (state: RootState) => state.cmmSingleOrder,
  );

  const prescriptionData = singleCmmOrderData?.prescription_data as any;

  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [isDiagnosisCodesModalOpen, setIsDiagnosisCodesModalOpen] =
    useState(false);
  const [isDrugDetailsModalOpen, setIsDrugDetailsModalOpen] = useState(false);

  useEffect(() => {
    if (isPrescriptionModalOpen) {
      openModal("prescription-modal");
    }
    if (isDiagnosisCodesModalOpen) {
      openModal("diagnosis-codes-modal");
    }
    if (isDrugDetailsModalOpen) {
      openModal("drug-details-modal");
    }
  }, [
    isPrescriptionModalOpen,
    isDiagnosisCodesModalOpen,
    isDrugDetailsModalOpen,
  ]);

  const handleRefetch = async (identifier: string) => {
    try {
      const token = await getBearerToken();
      const url = API_ENDPOINTS.REFETCH_CLINICAL_ATTACHMENT.replace(
        "Identifier",
        identifier,
      );
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: "",
      });
      if (!response.ok) {
        controlToastState("clinical-attachment-refetched-failure");
        throw new Error("Failed to refetch clinical attachment");
      }
      controlToastState("clinical-attachment-refetched-successfully");
    } catch (error) {
      console.error("Error refetching clinical attachment:", error);
    }
  };

  return (
    <div
      className="single-section__header mb-2 flex items-center justify-between bg-primaryGray-16 px-3 py-2 text-body font-semibold text-primaryGray-1"
      id={props.sectionKey}
    >
      {props.sectionTitle}
      {props.sectionTitle.includes("Attachments") && (
        <div
          className="flex w-full justify-end"
          onClick={() => {
            handleRefetch(props.id ?? "");
          }}
        >
          <RefreshIcon />
        </div>
      )}
      {props.sectionTitle.includes("Medication") && (
        <div className="ml-2 flex w-full justify-start">
          {prescriptionData?.is_related_drug_match ? "(Related Drug)" : ""}
        </div>
      )}
      {props.sectionKey.includes("drug") && (
        <div className="single-section__header-with-icon h flex items-center gap-4 hover:cursor-pointer">
          <div
            className="flex items-center gap-1"
            onClick={() => setIsDrugDetailsModalOpen(true)}
          >
            <div className="single-section__header-icon">
              <EyeIcon />
            </div>
            <div className="single-section__header-text text-small font-semibold text-tertiaryBlue-4">
              View Drug Details
            </div>
          </div>
          <div
            className="flex items-center gap-1"
            onClick={() => setIsPrescriptionModalOpen(true)}
          >
            <div className="single-section__header-icon">
              <EyeIcon />
            </div>
            <div className="single-section__header-text text-small font-semibold text-tertiaryBlue-4">
              View Prescription
            </div>
          </div>
          <div
            className="flex items-center gap-1"
            onClick={() => setIsDiagnosisCodesModalOpen(true)}
          >
            <div className="single-section__header-icon">
              <EyeIcon />
            </div>
            <div className="single-section__header-text text-small font-semibold text-tertiaryBlue-4">
              View Diagnosis Codes
            </div>
          </div>
        </div>
      )}
      {isPrescriptionModalOpen && (
        <PrescriptionModal
          onClose={() => setIsPrescriptionModalOpen(false)}
          id={props.id}
        />
      )}
      {isDiagnosisCodesModalOpen && (
        <DiagnosisCodeModal
          onClose={() => setIsDiagnosisCodesModalOpen(false)}
        />
      )}
      {isDrugDetailsModalOpen && (
        <DrugDetailsModal onClose={() => setIsDrugDetailsModalOpen(false)} />
      )}
    </div>
  );
};

export default RenderSectionHeader;
