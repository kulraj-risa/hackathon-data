import {
  TableCellType,
  TableHeader,
} from "../../../components/custom-table/table";
import { CmmProcessedOrderModel } from "../../../data-model/cmmProcessedOrderModel";
import { TableCellWithBadge } from "../../../data-model/tableCells";
import { ProcessedOrdersTableColumnKeys } from "../../../enums/tableColumnKeys";

export const ProcessOrdersTableHeader: TableHeader[] = [
  {
    label: "Patient MRN",
    key: ProcessedOrdersTableColumnKeys.PATIENT_MRN,
    order: 1,
    width: 10,
    sortable: true,
    type: TableCellType.STRING,
  },
  {
    label: "Created At",
    key: ProcessedOrdersTableColumnKeys.CREATED_AT,
    order: 2,
    width: 10,
    sortable: true,
    type: TableCellType.DATE,
  },
  {
    label: "Drug Name",
    key: ProcessedOrdersTableColumnKeys.DRUG_NAME,
    order: 3,
    width: 15,
    sortable: true,
    type: TableCellType.STRING,
  },
  {
    label: "Identifier",
    key: ProcessedOrdersTableColumnKeys.ID,
    order: 4,
    width: 16,
    sortable: false,
    type: TableCellType.COPY_DATA,
  },
  {
    label: "Status",
    key: ProcessedOrdersTableColumnKeys.STATUS,
    order: 5,
    width: 8,
    sortable: false,
    type: TableCellType.BADGE,
  },
  {
    label: "",
    key: ProcessedOrdersTableColumnKeys.VIEW_CMM_INPUT,
    order: 6,
    width: 12,
    sortable: false,
    type: TableCellType.BUTTON_LINK,
  },
  {
    label: "",
    key: ProcessedOrdersTableColumnKeys.RE_RUN_ONCO_EMR,
    order: 7,
    width: 12,
    sortable: false,
    type: TableCellType.BUTTON_LINK,
  },
  {
    label: "",
    key: ProcessedOrdersTableColumnKeys.RE_RUN_CMM,
    order: 8,
    width: 12,
    sortable: false,
    type: TableCellType.BUTTON_LINK,
  },
  {
    label: "",
    key: ProcessedOrdersTableColumnKeys.REPORT_PRESCRIPTION_INACCURACY,
    order: 9,
    width: 15,
    sortable: false,
    type: TableCellType.BUTTON_LINK,
  },
];

export const generateProcessedOrdersTableData = (
  data: CmmProcessedOrderModel[],
) => {
  return data.map((item) => {
    const patientMrn = item?.patientMrn;
    const createdAt = item?.createdAt;
    const drugName = item?.drugName;
    const identifier = item?.identifier;
    const status: TableCellWithBadge = {
      text: getStatus(item?.status ?? ""),
      displayText: item?.status,
      bgColor: getStatusBgColor(item?.status ?? ""),
      color: "#FFFFFF",
    };
    const cmmInput = item?.cmmInput;
    const reRunOncoEmr = "Re-run from Onco Emr";
    const reRunCmm = "Re-run from CMM";
    const reportPrescriptionInaccuracy = "Report Prescription Inaccuracy";
    const viewCmmInput = "View CMM Input";

    return {
      patientMrn,
      createdAt,
      drugName,
      id: identifier,
      status,
      cmmInput,
      reRunOncoEmr,
      reRunCmm,
      viewCmmInput,
      reportPrescriptionInaccuracy,
    };
  });
};

const getStatus = (status: string) => {
  if (status.toLowerCase() === "success") {
    return "Success";
  }
  if (status.toLowerCase() === "in progress") {
    return "In Progress";
  }
  return "Error";
};

export const getStatusBgColor = (status: string) => {
  if (status.toLowerCase() === "success") {
    return "#008000";
  }
  if (status.toLowerCase() === "in progress") {
    return "#665D00";
  }
  return "#FF0000";
};
