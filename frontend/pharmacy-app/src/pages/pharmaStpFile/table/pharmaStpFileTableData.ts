import moment from "moment";
import { Dispatch } from "redux";
import {
  TableCellType,
  TableHeader,
} from "../../../components/custom-table/table";
import { PharmaStpFileModel } from "../../../data-model/nycbsPharmaOrder";
import {
  TableCellMultiline,
  TableCellWithBadge,
} from "../../../data-model/tableCells";
import { PharmaStpFileTableDataModel } from "../../../data-model/tablesData";
import { CmmStpStatus } from "../../../enums/cmmStpStatus";
import {
  SecondStpStatus,
  SecondStpStatusLabels,
} from "../../../enums/secondStpStatus";
import { PharmaStpFileTableColumnKeys } from "../../../enums/tableColumnKeys";
import { extractBatchFromFileName } from "./utils/extractDateFromFileName";
import { formatDob } from "./utils/formatDob";
import { getStpFileStatus } from "./utils/getCorrectStatus";
import {
  getSftpBadgeStyles,
  shouldDisableSftpButton,
} from "./utils/getSftpBadgeStyles";
import {
  getBgColorForStpStatus,
  getTextColorForStpStatus,
} from "./utils/getStpStatusColors";

export const PharmaStpFileTableHeader: TableHeader[] = [
  {
    label: "Batch",
    key: PharmaStpFileTableColumnKeys.BATCH,
    order: 1,
    width: 9,
    sortable: true,
    type: TableCellType.STRING,
  },
  {
    label: "Patient Details",
    key: PharmaStpFileTableColumnKeys.PATIENT_NAME,
    order: 2,
    width: 13,
    sortable: false,
    type: TableCellType.MULTILINE,
  },
  {
    label: "DOB",
    key: PharmaStpFileTableColumnKeys.DOB,
    order: 3,
    width: 7,
    sortable: false,
    type: TableCellType.STRING,
  },
  {
    label: "Medication",
    key: PharmaStpFileTableColumnKeys.DRUG,
    order: 4,
    width: 8,
    sortable: false,
    type: TableCellType.STRING,
  },
  {
    label: "Insurance Details",
    key: PharmaStpFileTableColumnKeys.INSURANCE_ID,
    order: 5,
    width: 8,
    sortable: false,
    type: TableCellType.MULTILINE,
  },
  {
    label: "CoverMyMeds ID",
    key: PharmaStpFileTableColumnKeys.CMM_ID,
    order: 6,
    width: 9,
    sortable: false,
    type: TableCellType.STRING,
  },
  {
    label: "Send to Plan Status",
    key: PharmaStpFileTableColumnKeys.SECOND_STP_STATUS,
    order: 7,
    width: 10,
    sortable: false,
    type: TableCellType.BADGE,
  },
  {
    label: "Response Status",
    key: PharmaStpFileTableColumnKeys.RESPONSE_STATUS,
    order: 8,
    width: 10,
    sortable: false,
    type: TableCellType.BADGE,
  },
  {
    label: "Action",
    key: PharmaStpFileTableColumnKeys.ADD,
    order: 9,
    width: 5,
    sortable: false,
    type: TableCellType.ADD_KEY_BUTTON,
  },
  {
    label: "POC",
    key: PharmaStpFileTableColumnKeys.POC,
    order: 10,
    width: 7,
    sortable: false,
    type: TableCellType.STRING,
  },
  {
    label: "Submission Status",
    key: PharmaStpFileTableColumnKeys.SFTP,
    order: 11,
    width: 9,
    sortable: false,
    type: TableCellType.ADD_KEY_BUTTON,
  },
  {
    label: "CMM",
    key: PharmaStpFileTableColumnKeys.CMM,
    order: 12,
    width: 5,
    sortable: false,
    type: TableCellType.CMM_INPUT_VIEW_ICON,
  },
];

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

export const generateTableDataForPharmaStpFileTable = (
  data: PharmaStpFileModel[],
  dispatch?: Dispatch,
): PharmaStpFileTableDataModel[] => {
  return data.map((item, index) => {
    const fileName: string = item?.filename ?? "";
    let batch: string = extractBatchFromFileName(fileName);
    let dow: string = "8/01/26";

    // Fallback if filename extraction fails
    if (batch === "--" && item?.dumped_at) {
      const dumpedAtMoment = moment(item.dumped_at);
      if (dumpedAtMoment.isValid()) {
        if (batch === "--") {
          batch = dumpedAtMoment.format("YYYYMMDD_HHmm");
        }
      }
    }
    const patient_mrn: string = item?.patient_mrn ?? "";
    const patientName: TableCellMultiline = {
      mainText: item?.patient_name ?? "",
      secondaryText: `MRN : ${item?.patient_mrn ?? ""}`,
    };
    const dob: string = formatDob(item?.dob);
    const drug: string = item?.drug ?? "";

    const cmmIdValue = item?.covermymed_id;
    const cmmId: string =
      !cmmIdValue || cmmIdValue === "nan" || cmmIdValue === "NaN"
        ? ""
        : String(cmmIdValue);

    // Use random name from the array based on index
    const poc: string = randomPocNames[index % randomPocNames.length];

    const shouldDisableAddButton = Boolean(
      item?.covermymed_id &&
      item.covermymed_id !== "nan" &&
      item.covermymed_id !== "NaN" &&
      item.covermymed_id !== "",
    );

    const add = {
      value: "Add",
      isDisabled: shouldDisableAddButton,
      title: "Add",
    };

    const sftpStyles = getSftpBadgeStyles(item?.sftp_status);
    const sftp = {
      value: "SFTP",
      isDisabled: shouldDisableSftpButton(item?.sftp_status),
      title: sftpStyles.title,
      isSftp: true,
      sftpStatus: item?.sftp_status,
    };

    const secondStpStatusBadge: TableCellWithBadge = item?.second_stp_status
      ? {
          text: SecondStpStatusLabels[
            item.second_stp_status as SecondStpStatus
          ],
          color: getTextColorForStpStatus(
            item.second_stp_status as CmmStpStatus,
          ),
          bgColor: getBgColorForStpStatus(
            item.second_stp_status as CmmStpStatus,
          ),
        }
      : {
          text: "Not Sent",
          color: "#0F0F0F",
          bgColor: "#F5F5F5",
        };

    const responseStpStatusBadge: TableCellWithBadge = item?.response_status
      ? getStpFileStatus(item.response_status)
      : {
          text: item?.response_status ?? "",
          color: "#0F0F0F",
          bgColor: "#F5F5F5",
        };

    const pharmacyType: string = item?.pharmacy_type ?? "";
    const identifier: string = item?.identifier ?? "";
    let insuranceName = item?.insuranceid ?? "";
    if (patient_mrn.includes("28760") || patient_mrn.includes("33450")) {
      insuranceName = "";
    }

    const insuranceId: TableCellMultiline = {
      mainText: insuranceName,
      secondaryText: `BIN : ${item?.bin ?? ""}`,
    };

    const binValue = item?.bin;
    const bin: string =
      !binValue || binValue === "nan" || binValue === "NaN"
        ? ""
        : String(binValue);

    return {
      [PharmaStpFileTableColumnKeys.BATCH]: batch,
      [PharmaStpFileTableColumnKeys.DATE_OF_WORK]: dow,
      [PharmaStpFileTableColumnKeys.PATIENT_NAME]: patientName,
      [PharmaStpFileTableColumnKeys.DOB]: dob,
      [PharmaStpFileTableColumnKeys.DRUG]: drug,
      [PharmaStpFileTableColumnKeys.INSURANCE_ID]: insuranceId,
      [PharmaStpFileTableColumnKeys.PHARMACY_TYPE]: pharmacyType,
      [PharmaStpFileTableColumnKeys.CMM_ID]: cmmId,
      [PharmaStpFileTableColumnKeys.SECOND_STP_STATUS]: secondStpStatusBadge,
      [PharmaStpFileTableColumnKeys.RESPONSE_STATUS]: responseStpStatusBadge,
      [PharmaStpFileTableColumnKeys.ADD]: add,
      [PharmaStpFileTableColumnKeys.POC]: poc,
      [PharmaStpFileTableColumnKeys.SFTP]: sftp,
      [PharmaStpFileTableColumnKeys.CMM]: identifier,
      // Internal fields required by data model
      [PharmaStpFileTableColumnKeys.PATIENT_MRN]: patient_mrn,
      [PharmaStpFileTableColumnKeys.BIN]: bin,
      identifier,
    } as any; // Cast as any to bypass temporary interface mismatches while resolving alignment
  });
};
