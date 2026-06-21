import { CmmOrderTableRowData } from "../../../../data-model/cmmOrderTableRowData";
import { ModalId } from "../../../../enums/modalId";
import {
  formatDaysSupply,
  formatDosageQuantity,
  formatDrugConfidenceScore,
  getCorrectText,
  isEmpty,
} from "../../utils/getCorrectText";
import InternalChildCard from "../internalChildCard/internalChildCard";
import InternalChildCardMedical from "../internalChildCard/internalChildCardMedical";
import ModalContainer from "../modalContainer/modalContainer";

interface CmmOrderExpandableRowProps {
  rowData: CmmOrderTableRowData;
}

const CmmOrderExpandableRow = ({ rowData }: CmmOrderExpandableRowProps) => {
  return (
    <div className="flex w-full min-w-0">
      <div className="border-primaryGray13 flex w-full min-w-0 flex-row items-stretch bg-tertiaryBlue-12">
        <InternalChildCardMedical
          title={`Medication ${rowData?.prescriptionData?.is_related_drug_match ? "(Related Drug)" : ""}`}
          primaryDescription={[
            isEmpty(rowData?.prescriptionData?.prescription_date)
              ? "N/A"
              : rowData?.prescriptionData?.prescription_date,
            isEmpty(rowData?.prescriptionData?.drug_name)
              ? "N/A"
              : rowData?.prescriptionData?.drug_name,
          ]}
          secondaryDescription={[
            isEmpty(rowData?.drugName) ? "N/A" : rowData?.drugName,
          ]}
          showIcon={true}
          modalId={ModalId.EXPANDABLE_TABLE_ROW_MEDICATION_MODAL}
          rowData={rowData}
        />

        <InternalChildCard
          title="Insurance"
          primaryDescription={[
            isEmpty(rowData?.formPickedFlag) ? "N/A" : rowData?.formPickedFlag,
            getCorrectText(rowData),
          ]}
          secondaryDescription={[
            isEmpty(rowData?.patientMemberId) ? "--" : rowData?.patientMemberId,
            isEmpty(rowData?.formName) ? "--" : rowData?.formName,
          ]}
          showIcon={true}
          isPrimaryInformation={false}
          modalId={ModalId.EXPANDABLE_TABLE_ROW_INSURANCE_MODAL}
          rowData={rowData}
        />

        <InternalChildCard
          title="Dosage"
          primaryDescription={[
            formatDrugConfidenceScore(
              rowData?.drugFetchedFrom === "llm"
                ? "1"
                : rowData?.drugConfidenceScore,
            ),
            isEmpty(rowData?.drugFetchedFrom)
              ? "N/A"
              : rowData?.drugFetchedFrom,
          ]}
          secondaryDescription={[
            formatDosageQuantity(
              rowData?.drugQuantity,
              rowData?.drugQuantityQualifier,
            ),
            formatDaysSupply(rowData?.drugDaysSupply),
          ]}
          modalId={ModalId.EXPANDABLE_TABLE_ROW_DOSAGE_MODAL}
          showIcon={true}
          isPrimaryInformation={false}
          rowData={rowData}
        />

        <InternalChildCard
          title="Primary ICD"
          primaryDescription={[
            isEmpty(rowData?.primaryDiagnosesData?.confidence_score)
              ? "N/A"
              : rowData?.primaryDiagnosesData?.confidence_score,
            isEmpty(rowData?.primaryDiagnosesData?.source)
              ? "N/A"
              : rowData?.primaryDiagnosesData?.source,
          ]}
          secondaryDescription={[
            isEmpty(rowData?.primaryDiagnoses)
              ? "--"
              : rowData?.primaryDiagnoses,
          ]}
          showIcon={true}
          isPrimaryInformation={false}
          modalId={ModalId.EXPANDABLE_TABLE_ROW_DIAGNOSIS_MODAL}
          rowData={rowData}
        />

        <InternalChildCard
          title="Secondary ICD"
          primaryDescription={[
            isEmpty(rowData?.secondaryDiagnosesData?.confidence_score)
              ? "N/A"
              : rowData?.secondaryDiagnosesData?.confidence_score,
            isEmpty(rowData?.secondaryDiagnosesData?.source)
              ? "N/A"
              : rowData?.secondaryDiagnosesData?.source,
          ]}
          secondaryDescription={[
            isEmpty(rowData?.secondaryDiagnoses)
              ? "--"
              : rowData?.secondaryDiagnoses,
          ]}
          showIcon={true}
          isPrimaryInformation={false}
          modalId={ModalId.EXPANDABLE_TABLE_ROW_SECONDARY_DIAGNOSIS_MODAL}
          rowData={rowData}
        />
      </div>
      <ModalContainer rowData={rowData} />
    </div>
  );
};

export default CmmOrderExpandableRow;
