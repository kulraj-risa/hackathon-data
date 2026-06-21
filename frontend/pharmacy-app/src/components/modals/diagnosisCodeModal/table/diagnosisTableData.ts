import { DiagnosesDetailsModel } from "../../../../data-model/dignosisDetailsModal";
import { DiagnosisSourceDisplayNames } from "../../../../enums/diagnosisSource";
import { DiagnosisCodeTableColumnKeys } from "../../../../enums/tableColumnKeys";
import { TableCellType, TableHeader } from "../../../custom-table/table";

export const DiagnosisCodesTableHeader: TableHeader[] = [
  {
    label: "ICD-10 Code",
    key: DiagnosisCodeTableColumnKeys.ICD_10_CODE,
    order: 1,
    width: 10,
    sortable: true,
    type: TableCellType.STRING,
  },
  {
    label: "Description",
    key: DiagnosisCodeTableColumnKeys.DESCRIPTION,
    order: 2,
    width: 30,
    type: TableCellType.STRING,
  },
  {
    label: "Is Primary",
    key: DiagnosisCodeTableColumnKeys.IS_PRIMARY,
    order: 3,
    width: 10,
    type: TableCellType.STRING,
  },
  {
    label: "Is Secondary",
    key: DiagnosisCodeTableColumnKeys.IS_SECONDARY,
    order: 4,
    width: 10,
    type: TableCellType.STRING,
  },
  {
    label: "Confidence Score",
    key: DiagnosisCodeTableColumnKeys.CONFIDENCE_SCORE,
    order: 5,
    width: 12,
    type: TableCellType.STRING,
  },
  {
    label: "Source",
    key: DiagnosisCodeTableColumnKeys.SOURCE,
    order: 6,
    width: 14,
    type: TableCellType.STRING,
  },
  {
    label: "LLM Thinking",
    key: DiagnosisCodeTableColumnKeys.VIEW_THINKING,
    order: 7,
    width: 14,
    type: TableCellType.THINKING_BUTTON,
  },
];

export const generateDiagnosisTableData = (
  diagnosisDetails: DiagnosesDetailsModel[],
  onViewThinking?: (thinking: string, diagnosisId: string) => void,
) => {
  return [...diagnosisDetails]
    .sort((a, b) => (b.isPrimary === true ? 1 : -1))
    .map((diagnosis) => {
      return {
        [DiagnosisCodeTableColumnKeys.ICD_10_CODE]: diagnosis?.icd10Code ?? "",
        [DiagnosisCodeTableColumnKeys.DESCRIPTION]:
          diagnosis?.description ?? "",
        [DiagnosisCodeTableColumnKeys.DRUG_NAME]: diagnosis?.drugName ?? "",
        [DiagnosisCodeTableColumnKeys.DIAGNOSIS_DATE]:
          diagnosis?.diagDate ?? "",
        [DiagnosisCodeTableColumnKeys.LAST_VERIFIED_DATE]:
          diagnosis?.lastVerifiedDate ?? "",
        [DiagnosisCodeTableColumnKeys.IS_PRIMARY]:
          diagnosis?.isPrimary === true ? "Yes" : "No",
        [DiagnosisCodeTableColumnKeys.IS_SECONDARY]:
          diagnosis?.isSecondary === true ? "Yes" : "No",
        [DiagnosisCodeTableColumnKeys.CONFIDENCE_SCORE]:
          diagnosis?.confidenceScore?.toString() ?? "",
        [DiagnosisCodeTableColumnKeys.SOURCE]:
          diagnosis?.source && DiagnosisSourceDisplayNames[diagnosis.source]
            ? DiagnosisSourceDisplayNames[diagnosis.source]
            : diagnosis?.source || "",
        [DiagnosisCodeTableColumnKeys.VIEW_THINKING]: {
          hasThinking: !!diagnosis?.llmThinking?.trim(),
          thinking: diagnosis?.llmThinking ?? "",
          diagnosisId: diagnosis?.identifier ?? "",
          onViewThinking: onViewThinking,
        },
      };
    });
};
