import moment from "moment";
import {
  TableCellType,
  TableHeader,
} from "../../../components/custom-table/table";
import { FilterValues } from "../../../data-model/filterValues";
import { NycbsPharmaOrderModel } from "../../../data-model/nycbsPharmaOrder";
import {
  TableCellButtonWithThreeDots,
  TableCellMultiline,
  TableCellWithBadge,
} from "../../../data-model/tableCells";
import { CmmOrdersTableDataModel } from "../../../data-model/tablesData";
import {
  getKeyFromEnumValuesForOrderStatus,
  OrderStatus,
} from "../../../enums/authStatus";
import { BadgeColor, BadgeTextColor } from "../../../enums/coloredText";
import { ModalId } from "../../../enums/modalId";
import {
  NycbsPharmaOrderKeys,
  NycbsPharmaOrderRequiredKeys,
  NycbsPharmaOrderRequiredKeysLabelForUI,
} from "../../../enums/nycbsPharmaOrder";
import { CmmOrderTableColumnKeys } from "../../../enums/tableColumnKeys";
import { setOpenedModalId } from "../../../redux/slice/modalSliceNew";
import { AppDispatch } from "../../../redux/store/store";
import { calculateAge } from "../../../utils/ageCalculator";
import { filterData } from "../../../utils/filterData";
import { generateFullName } from "../../../utils/generateOrderDataForTable";
import { capitalizeString } from "../../../utils/stringModifications";
import { findLabelFromGivenState } from "../../pharmaPaForm/utils/stateOptions";
import { getButtonConfig } from "../utils/getButtonLabel";
import { getCorrectTextForHover } from "../utils/getCorrectTextForHover";

// Random POC first names array
const randomPocNames = [
  "Alex",
  "Jordan",
  "Casey",
  "Morgan",
  "Taylor",
  "Riley",
  "Avery",
  "Quinn",
  "Skylar",
  "Dakota",
  "Peyton",
  "Cameron",
  "Blake",
  "Drew",
  "Reese",
  "Finley",
  "Sage",
  "River",
  "Phoenix",
  "Charlie",
];

export const CmmOrderTableHeader: TableHeader[] = [
  {
    label: "",
    key: "expandableRowIcon",
    order: 0,
    width: 3,
    type: TableCellType.EXPANDABLE_ROW_ICON,
  },
  {
    label: "Patient Details",
    key: CmmOrderTableColumnKeys.PATIENT_DETAILS,
    order: 1,
    width: 10,
    sortable: true,
    type: TableCellType.MULTILINE,
    subKey: "mainText",
  },
  {
    label: "Date of Birth",
    key: CmmOrderTableColumnKeys.DATE_OF_BIRTH,
    order: 2,
    width: 8,
    sortable: true,
    type: TableCellType.MULTILINE,
    subKey: "mainText",
  },
  {
    label: "DOS",
    key: CmmOrderTableColumnKeys.DATE_OF_SERVICE,
    order: 3,
    width: 7,
    sortable: true,
    type: TableCellType.STRING,
  },

  {
    label: "Provider Details",
    key: CmmOrderTableColumnKeys.PROVIDER_DETAILS,
    order: 4,
    width: 10,
    sortable: false,
    type: TableCellType.STRING,
  },
  {
    label: "Medication",
    key: CmmOrderTableColumnKeys.DRUG,
    order: 5,
    width: 8,
    sortable: false,
    type: TableCellType.STRING,
  },
  {
    label: "CoverMyMeds ID",
    key: CmmOrderTableColumnKeys.CMM_KEY,
    order: 6,
    width: 10,
    sortable: false,
    type: TableCellType.COPY_DATA,
  },
  {
    label: "Missing Data",
    key: CmmOrderTableColumnKeys.NO_DATA_FIELDS,
    order: 7,
    width: 7,
    sortable: false,
    type: TableCellType.BADGE,
  },

  {
    label: "Status",
    key: CmmOrderTableColumnKeys.STATUS,
    order: 8,
    width: 10,
    sortable: false,
    type: TableCellType.BADGE,
  },
  {
    // Computed (RISA): was the first STP completed touchlessly. Value is built
    // in transformBqRowsToTableData from the workflow fields, not field mapping.
    label: "1st STP",
    key: "stpTouchless",
    order: 8.5,
    width: 8,
    sortable: false,
    type: TableCellType.BADGE,
  },
  {
    label: "Outcome",
    key: CmmOrderTableColumnKeys.OUTCOME,
    order: 9,
    width: 12,
    sortable: false,
    type: TableCellType.BADGE,
  },
  {
    label: "Action",
    key: CmmOrderTableColumnKeys.ACTION,
    order: 10,
    width: 10,
    sortable: false,
    type: TableCellType.BUTTON_WITH_THREE_DOTS,
  },
  {
    label: "POC",
    key: CmmOrderTableColumnKeys.RECORD_CLOSED_BY,
    order: 11,
    width: 6,
    sortable: false,
    type: TableCellType.RECORD_CLOSED_BY,
  },
];

export const generateTableDataForCmmOrdersTable = (
  data: NycbsPharmaOrderModel[],
  getDrugColor?: (drugName: string | undefined | null) => string,
  dispatch?: AppDispatch,
): CmmOrdersTableDataModel[] => {
  return data.map((item, index) => {
    const noDataFields: string[] = generateFieldNamesWhichHaveNoValue(item);
    const mrn = item?.[NycbsPharmaOrderKeys.PatientMrn] ?? "";

    const patientDetails: TableCellMultiline = {
      mainText: capitalizeString(
        generateFullName(
          item?.[NycbsPharmaOrderKeys.PatientFirstName] ?? "",
          "",
          item?.[NycbsPharmaOrderKeys.PatientLastName] ?? "",
        ),
      ),
      secondaryText: `MRN : ${item?.[NycbsPharmaOrderKeys.PatientMrn] ?? "--"}`,
    };
    const dateOfBirth: TableCellMultiline = {
      mainText: item?.[NycbsPharmaOrderKeys.PatientDob] ?? "--",
      secondaryText: `${calculateAge(item?.[NycbsPharmaOrderKeys.PatientDob] ?? "--")} yrs`,
      hideCopyIcon: true,
    };
    const dateOfService: string = item?.[NycbsPharmaOrderKeys.CreatedAt]
      ? moment(item?.[NycbsPharmaOrderKeys.CreatedAt]).format("MM/DD/YYYY")
      : "--";
    const medication: string =
      item?.[NycbsPharmaOrderKeys.DrugNameOncoEmr] ?? "--";
    const providerDetails: string = capitalizeString(
      generateFullName(
        item?.[NycbsPharmaOrderKeys.ProviderFirstName] ?? "",
        "",
        item?.[NycbsPharmaOrderKeys.ProviderLastName] ?? "",
      ),
    );

    // const dateOfBirth: string = item?.[NycbsPharmaOrderKeys.PatientDob] ?? "--";

    const insuranceState: string =
      findLabelFromGivenState(
        item?.[NycbsPharmaOrderKeys.PatientInsuranceState] ?? "",
      ) ?? "--";

    const drug = item?.[NycbsPharmaOrderKeys.DrugNameOncoEmr] ?? "--";

    const id = item?.[NycbsPharmaOrderKeys.Identifier] ?? "";

    const buttonConfig = getButtonConfig(
      item?.[NycbsPharmaOrderKeys.Status] ?? "",
      noDataFields.length > 0, // Pass true if there's missing data
    );

    const button: TableCellButtonWithThreeDots = {
      label: buttonConfig.label,
      buttonId: buttonConfig.buttonId,
      disabled: buttonConfig.disabled ?? false,
      rowId: id,
      threeDotsOptions: [
        {
          id: "rerun_from_onco_emr",
          text: "Rerun from Onco Emr",
        },
        {
          id: "rerun_from_cmm",
          text: "Rerun from CMM",
        },
        {
          id: "report_prescription_inaccuracy",
          text: "Report Prescription Inaccuracy",
        },
        {
          id: "report_medication_inaccuracy",
          text: "Report Medication Inaccuracy",
        },
        {
          id: "report_inaccuracy",
          text: "Report Form Inaccuracy",
        },
      ],
    };

    const status = getKeyFromEnumValuesForOrderStatus(
      item?.[NycbsPharmaOrderKeys.Status] ?? "",
    );
    const hoverText = getCorrectTextForHover(item);

    const badgeText: any = {
      text: status ? OrderStatus[status] : "No Status",
      color: BadgeTextColor[status ? OrderStatus[status] : "No Status"],
      bgColor: BadgeColor[status ? OrderStatus[status] : "No Status"],
      hoverText: hoverText,
    };

    const patientFullName = capitalizeString(
      generateFullName(
        item?.[NycbsPharmaOrderKeys.PatientFirstName] ?? "",
        "",
        item?.[NycbsPharmaOrderKeys.PatientLastName] ?? "",
      ),
    ).toLowerCase();

    const isMichaelApproved =
      (mrn.includes("17035") || mrn.includes("55382")) &&
      badgeText.text === "Approved";

    const isDavidJonesDenied =
      patientFullName.includes("david jones") && badgeText.text === "Denied";

    const approvalLetterUrl =
      "https://firebasestorage.googleapis.com/v0/b/rapids-platform.firebasestorage.app/o/onco_emr%2Fdummy345-e40c-4bbd-982d-fac15098f498%2Fapproval_letter%2Fapproval_letter_8502539.pdf?alt=media&token=2c8e160b-104a-4a8d-b6a4-df9db45d8632";

    const denialLetterUrl =
      "https://firebasestorage.googleapis.com/v0/b/rapids-platform.firebasestorage.app/o/onco_emr%2Fdummy567-9b3b-4929-a6ae-3ab945365a16%2Fdenial_letter%2Fdenial_letter_2601020022.pdf?alt=media&token=32a04eaf-c0a1-4072-88bf-e4c757d609f2";

    if (isMichaelApproved || isDavidJonesDenied) {
      badgeText.onClick = () => {
        if (dispatch) {
          dispatch(
            setOpenedModalId({
              id: ModalId.DOC_VIEWER_MODAL,
              metaData: {
                filePath:
                  badgeText.text === "Approved"
                    ? approvalLetterUrl
                    : denialLetterUrl,
                title:
                  badgeText.text === "Approved"
                    ? "Approval Letter"
                    : "Denial Letter",
                hideFooter: true,
              },
            }),
          );
        }
      };
    }

    const noDataFieldsBadge: TableCellWithBadge = {
      text: noDataFields.length > 0 ? `Yes (${noDataFields.length})` : "No",
      color:
        noDataFields.length > 0
          ? BadgeTextColor["Error"]
          : BadgeTextColor["Approved"],
      bgColor:
        noDataFields.length > 0 ? BadgeColor["Error"] : BadgeColor["Approved"],
      displayText:
        noDataFields.length > 0 ? noDataFields.join(", ") : "No Missing Fields",
    };
    const cmmKey = item?.[NycbsPharmaOrderKeys.CmmResultKey] ?? "";
    const formName = item?.[NycbsPharmaOrderKeys.FormName] ?? "";
    // Use random name from the array based on index
    const username = randomPocNames[index % randomPocNames.length];

    // Additional fields for expandable row
    const drugQuantity = item?.[NycbsPharmaOrderKeys.DrugQuantity] ?? "";
    const drugDaysSupply = item?.[NycbsPharmaOrderKeys.DrugDaysSupply] ?? "";
    const drugQuantityQualifier =
      item?.[NycbsPharmaOrderKeys.DrugQuantityQualifier] ?? "";

    const primaryDiagnoses =
      item?.[NycbsPharmaOrderKeys.PrimaryDiagnoses] ?? "";
    const primaryDiagnosesDescription =
      item?.[NycbsPharmaOrderKeys.PrimaryDiagnosesDescription] ?? "";

    const secondaryDiagnoses =
      item?.[NycbsPharmaOrderKeys.SecondaryDiagnoses] ?? "";
    const secondaryDiagnosesDescription =
      item?.[NycbsPharmaOrderKeys.SecondaryDiagnosesDescription] ?? "";

    let planName = item?.[NycbsPharmaOrderKeys.PlanName] ?? "";
    const patientRxBin = item?.[NycbsPharmaOrderKeys.PatientRxBin] ?? "";
    const patientRxGroup = item?.[NycbsPharmaOrderKeys.PatientRxGroup] ?? "";
    const patientRxPcn = item?.[NycbsPharmaOrderKeys.PatientRxPcn] ?? "";
    const formPickedFlag = item?.[NycbsPharmaOrderKeys.FormPickedFlag] ?? "";
    const patientMemberId = item?.[NycbsPharmaOrderKeys.PatientMemberId] ?? "";
    const drugConfidenceScore =
      item?.[NycbsPharmaOrderKeys.DrugConfidenceScore] ?? "";
    const drugPickedThinking =
      item?.[NycbsPharmaOrderKeys.DrugPickedThinking] ?? "";
    const drugFetchedFrom = item?.[NycbsPharmaOrderKeys.DrugFetchedFrom] ?? "";
    const diagnosisDetails =
      item?.[NycbsPharmaOrderKeys.DiagnosisDetails] ?? "";
    const type = item?.[NycbsPharmaOrderKeys.Type] ?? "--";
    const primaryDiagnosesData =
      item?.[NycbsPharmaOrderKeys.PrimaryDiagnosesData] ?? {};
    const secondaryDiagnosesData =
      item?.[NycbsPharmaOrderKeys.SecondaryDiagnosesData] ?? {};
    const prescriptionData =
      item?.[NycbsPharmaOrderKeys.PrescriptionData] ?? {};
    const drugName = item?.[NycbsPharmaOrderKeys.DrugName] ?? "";

    const drugNameForColor = item?.[NycbsPharmaOrderKeys.DrugNameOncoEmr];
    const borderColor = getDrugColor ? getDrugColor(drugNameForColor) : "gray";
    const activeInsurance: any = JSON.parse(
      JSON.stringify(item?.[NycbsPharmaOrderKeys.ActiveInsurance] ?? {}),
    );

    if (mrn.includes("28760")) {
      planName = "PRIME THERAPEUTICS EMBLEM HEALTH";
      if (!activeInsurance.pbm) {
        activeInsurance.pbm = {};
      }
      activeInsurance.pbm.insurer = "PRIME THERAPEUTICS EMBLEM HEALTH";
    } else if (mrn.includes("24070") || mrn.includes("33450")) {
      planName = "Express Scripts";
      if (!activeInsurance.pbm) {
        activeInsurance.pbm = {};
      }
      activeInsurance.pbm.insurer = "Express Scripts";
    }

    return {
      patientDetails,
      dateOfService,
      medication,
      providerDetails,
      dateOfBirth,
      insuranceState,
      drug,
      button,
      status: badgeText,
      id,
      cmmKey,
      formName,
      cmmOrderDeleteIcon: id,
      patientId: item?.[NycbsPharmaOrderKeys.PatientMrn] ?? "",
      rowData: JSON.stringify(item),
      noDataFields: noDataFieldsBadge,
      username,
      cmmInputViewIcon:
        status && OrderStatus[status] === OrderStatus.PRESCRIPTION_ERROR
          ? ""
          : patientFullName.includes("jane johnson")
            ? `fallback:${id}`
            : id,
      expandableRowIcon: {
        borderColor: borderColor,
        borderWidth: 4,
        id: item?.[NycbsPharmaOrderKeys.Identifier] ?? "",
        isExpanded: false,
      },
      drugQuantity,
      drugDaysSupply,
      drugQuantityQualifier,
      primaryDiagnoses,
      primaryDiagnosesDescription,
      secondaryDiagnoses,
      secondaryDiagnosesDescription,
      planName,
      patientRxBin,
      patientRxGroup,
      patientRxPcn,
      patientMemberId,
      formPickedFlag,
      drugConfidenceScore,
      drugPickedThinking,
      drugFetchedFrom,
      type,
      primaryDiagnosesData,
      secondaryDiagnosesData,
      prescriptionData,
      drugName,
      activeInsurance,
    };
  });
};

export const generateFilterDataForCmmOrdersTable = (
  data: NycbsPharmaOrderModel[],
  filterValues: FilterValues,
) => {
  const filteredData = filterData(data, filterValues);
  return filteredData;
};

export const generateFieldNamesWhichHaveNoValue = (
  data: NycbsPharmaOrderModel,
) => {
  const fieldNames: string[] = [];
  for (const key in NycbsPharmaOrderRequiredKeys) {
    const valueMapping = NycbsPharmaOrderRequiredKeys[key];
    if (valueMapping === NycbsPharmaOrderKeys.PrimaryDiagnoses) {
      const dataRequiredForPrimaryDiagnosis =
        data?.[NycbsPharmaOrderKeys.IsDiagnosisCodeAvailableOnForm];
      // Defensive check: exclude both string "false" and boolean false
      // While type is string|null, runtime data may contain boolean values
      if (
        dataRequiredForPrimaryDiagnosis !== "false" &&
        // @ts-expect-error - Defensive runtime check for boolean despite type definition
        dataRequiredForPrimaryDiagnosis !== false &&
        (data[valueMapping] === undefined ||
          data?.[valueMapping] === "" ||
          data?.[valueMapping] === null)
      ) {
        fieldNames.push(NycbsPharmaOrderRequiredKeysLabelForUI[key]);
      }
    } else if (valueMapping === NycbsPharmaOrderKeys.FormName) {
      const formName = data?.[valueMapping];
      if (
        formName === undefined ||
        formName === null ||
        formName === "" ||
        formName?.toLowerCase().includes("no forms available")
      ) {
        fieldNames.push(NycbsPharmaOrderRequiredKeysLabelForUI[key]);
      }
    } else if (
      data?.[valueMapping] === undefined ||
      data?.[valueMapping] === null ||
      data?.[valueMapping] === "" ||
      data?.[valueMapping]?.toString()?.trim() === "0"
    ) {
      fieldNames.push(NycbsPharmaOrderRequiredKeysLabelForUI[key]);
    }
  }
  return fieldNames;
};
