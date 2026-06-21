import moment from "moment";
import {
  TableCellType,
  TableHeader,
} from "../../../components/custom-table/table";
import { CmmProcessedResponseModel } from "../../../data-model/cmmProcessedOrderModel";
import { TableCellWithBadge } from "../../../data-model/tableCells";
import {
  getKeyFromEnumValuesForOrderStatus,
  OrderStatus,
} from "../../../enums/authStatus";
import { BadgeColor, BadgeTextColor } from "../../../enums/coloredText";
import { NycbsPharmaOrderKeys } from "../../../enums/nycbsPharmaOrder";
import { PharmaPaDiffTableColumnKeys } from "../../../enums/tableColumnKeys";
import { generateFullName } from "../../../utils/generateOrderDataForTable";
import {
  capitalizeString,
  capitalizeWordsSeperatedByUnderScore,
} from "../../../utils/stringModifications";

export const diffTableColumnHeaders: TableHeader[] = [
  {
    label: "Patient Details",
    key: PharmaPaDiffTableColumnKeys.PATIENT_DETAILS,
    order: 1,
    width: 12,
    sortable: true,
    type: TableCellType.MULTILINE,
  },
  {
    label: "Date of Service",
    key: PharmaPaDiffTableColumnKeys.DATE_OF_SERVICE,
    order: 2,
    width: 11,
    sortable: true,
    type: TableCellType.STRING,
  },
  {
    label: "Medication",
    key: PharmaPaDiffTableColumnKeys.MEDICATION,
    order: 3,
    width: 15,
    sortable: true,
    type: TableCellType.STRING,
  },
  {
    label: "Form Name",
    key: PharmaPaDiffTableColumnKeys.FORM_NAME,
    order: 4,
    width: 30,
    sortable: true,
    type: TableCellType.STRING,
  },
  {
    label: "Key",
    key: PharmaPaDiffTableColumnKeys.CMM_KEY,
    order: 7,
    width: 12,
    sortable: false,
    type: TableCellType.COPY_DATA,
  },
  {
    label: "Form Diff",
    key: PharmaPaDiffTableColumnKeys.FORM_DIFF_FIELDS,
    order: 8,
    width: 9,
    sortable: false,
    type: TableCellType.BADGE,
  },

  {
    label: "QA Diff",
    key: PharmaPaDiffTableColumnKeys.QA_DIFF_FIELDS,
    order: 9,
    width: 6,
    sortable: false,
    type: TableCellType.BADGE,
  },

  {
    label: "Status",
    key: PharmaPaDiffTableColumnKeys.STATUS,
    order: 10,
    width: 15,
    sortable: false,
    type: TableCellType.BADGE,
  },
  {
    label: "",
    key: PharmaPaDiffTableColumnKeys.VIEW_COMMENT,
    order: 11,
    width: 8,
    sortable: false,
    type: TableCellType.BUTTON_LINK,
  },
];

export const generateTableDataForCmmFormDiffTable = (
  data: CmmProcessedResponseModel[],
) => {
  return data.map((item) => {
    const patientFullName = generateFullName(
      item?.["cmm_input"]?.["cover_my_meds_input"]?.[
        NycbsPharmaOrderKeys.PatientFirstName
      ] ?? "",
      "",
      item?.["cmm_input"]?.["cover_my_meds_input"]?.[
        NycbsPharmaOrderKeys.PatientLastName
      ] ?? "",
    );

    const cmmCount = (differencesFromBaseline) => {
      if (!differencesFromBaseline) {
        return 0;
      }

      const cmmInputKeysCount =
        differencesFromBaseline?.cmm_input &&
        typeof differencesFromBaseline?.cmm_input === "object"
          ? Object.keys(differencesFromBaseline?.cmm_input).filter(
              (key) => key !== "comment" && key !== "status",
            ).length
          : 0;
      return cmmInputKeysCount;
    };

    const qaCount = (differencesFromBaseline) => {
      if (
        differencesFromBaseline?.questionnaire?.questionnaire_baseline_null ===
        true
      ) {
        return 0;
      } else {
        const questionsCount =
          differencesFromBaseline?.questionnaire?.questions &&
          Array.isArray(differencesFromBaseline?.questionnaire?.questions)
            ? differencesFromBaseline?.questionnaire?.questions?.length
            : 0;

        return questionsCount;
      }
    };

    const dateOfService = moment(item?.["created_at"]).format("MM/DD/YYYY");

    const drugName = item?.[NycbsPharmaOrderKeys.DrugName] ?? "--";

    const cmmKey =
      item?.final_cmm_data?.[NycbsPharmaOrderKeys.CmmResultKey] ?? "--";

    const status = getKeyFromEnumValuesForOrderStatus(
      item?.final_cmm_data?.[NycbsPharmaOrderKeys.Status] ?? "",
    );

    const formName =
      item?.final_cmm_data?.[NycbsPharmaOrderKeys.FormName] ?? "--";

    const badgeText = {
      text: status
        ? capitalizeString(OrderStatus[status])
        : (item?.final_cmm_data?.[NycbsPharmaOrderKeys.Status] ?? "No Status"),
      color: BadgeTextColor[status ? OrderStatus[status] : "No Status"],
      bgColor: BadgeColor[status ? OrderStatus[status] : "No Status"],
    };

    const cmmCountToShow = cmmCount(item?.differences_from_baseline);
    const qaCountToShow = qaCount(item?.differences_from_baseline);

    const cmmInputKeys = Object.keys(
      item?.differences_from_baseline?.cmm_input ?? {},
    );

    const formDiffFieldsBadge: TableCellWithBadge = {
      text: cmmCountToShow > 0 ? `Yes (${cmmCountToShow})` : "No",
      color:
        cmmCountToShow > 0
          ? BadgeTextColor["Error"]
          : BadgeTextColor["Approved"],
      bgColor:
        cmmCountToShow > 0 ? BadgeColor["Error"] : BadgeColor["Approved"],
      displayText:
        cmmCountToShow > 0
          ? cmmInputKeys
              .filter((key) => key !== "comment" && key !== "status")
              .map((key) => capitalizeWordsSeperatedByUnderScore(key))
              .join(", ")
          : "No Missing Fields",
    };

    const qaDiffFieldsBadge: TableCellWithBadge = {
      text:
        (item?.differences_from_baseline?.questionnaire as any)
          ?.questionnaire_baseline_null === true
          ? "QA Error"
          : qaCountToShow > 0
            ? `Yes (${qaCountToShow})`
            : "No",
      color:
        (item?.differences_from_baseline?.questionnaire as any)
          ?.questionnaire_baseline_null === true
          ? BadgeTextColor["Unknown"]
          : qaCountToShow > 0
            ? BadgeTextColor["Error"]
            : BadgeTextColor["Approved"],
      bgColor:
        (item?.differences_from_baseline?.questionnaire as any)
          ?.questionnaire_baseline_null === true
          ? BadgeColor["Unknown"]
          : qaCountToShow > 0
            ? BadgeColor["Error"]
            : BadgeColor["Approved"],
    };

    const statusString =
      item?.final_cmm_data?.[NycbsPharmaOrderKeys.Status] ?? "";
    const commentString =
      item?.final_cmm_data?.[NycbsPharmaOrderKeys.Comment] ?? "";

    return {
      [PharmaPaDiffTableColumnKeys.PATIENT_DETAILS]: {
        mainText: capitalizeString(patientFullName),
        secondaryText: `MRN : ${item?.[NycbsPharmaOrderKeys.PatientMrn] ?? "--"}`,
      },
      [PharmaPaDiffTableColumnKeys.DATE_OF_SERVICE]: dateOfService,
      [PharmaPaDiffTableColumnKeys.MEDICATION]: drugName,

      [PharmaPaDiffTableColumnKeys.CMM_KEY]: cmmKey,
      [PharmaPaDiffTableColumnKeys.FORM_DIFF_FIELDS]: formDiffFieldsBadge,
      [PharmaPaDiffTableColumnKeys.QA_DIFF_FIELDS]: qaDiffFieldsBadge,
      [PharmaPaDiffTableColumnKeys.STATUS]: badgeText,
      [PharmaPaDiffTableColumnKeys.VIEW_COMMENT]: "More Info",
      [PharmaPaDiffTableColumnKeys.ACTION]: "See Diff",
      [PharmaPaDiffTableColumnKeys.ID]: item?.["id"] ?? "--",
      [PharmaPaDiffTableColumnKeys.FORM_NAME]: formName,
      [PharmaPaDiffTableColumnKeys.STATUS_STRING]: statusString,
      [PharmaPaDiffTableColumnKeys.COMMENT_STRING]: commentString,
    };
  });
};

export const createFilterForFormName = () => {
  return {
    id: PharmaPaDiffTableColumnKeys.FORM_NAME,
    label: "Form Name",
    options: [],
    type: "string" as const,
  };
};

export const createFilterForDateOfService = () => {
  return {
    id: PharmaPaDiffTableColumnKeys.DATE_OF_SERVICE,
    label: "Date of Service",
    options: [],
    type: "date" as const,
  };
};

export const createFilterForStatus = () => {
  return {
    id: PharmaPaDiffTableColumnKeys.STATUS,
    label: "Status",
    options: [],
    type: "string" as const,
  };
};

export const createFilterForDrugName = () => {
  return {
    id: PharmaPaDiffTableColumnKeys.MEDICATION,
    label: "Drug Name",
    options: [],
    type: "string" as const,
  };
};
