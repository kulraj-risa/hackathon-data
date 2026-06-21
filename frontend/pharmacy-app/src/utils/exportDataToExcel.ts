import moment from "moment";
import * as XLSX from "xlsx";
import { AuthStatusChange } from "../components/modals/StatusUpdateModal/StatusUpdateModal";
import { AuthStatusOptionModel } from "../data-model/authStatusOptions";
import { FinalWorklistDataResponse } from "../data-model/finalWorklistModel";
import { MedicalPaOrder } from "../data-model/medicalPaOrdersModel";
import { generateFullName } from "./generateOrderDataForTable";
import { getAuthStatusTextOfMedicalPaOrder } from "./getAuthStatusOfMedicalPaOrder";
import { getFinalStatusOfOrder } from "./getFinalStatusOfOrder";
import { capitalizeString } from "./stringModifications";

export const exportDataToExcel = (data: any, filename: string) => {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths for better visibility
  const columnWidths = [
    { wch: 25 }, // order_id
    { wch: 25 }, // Patient Name
    { wch: 15 }, // Patient MRN
    { wch: 15 }, // Date of Service
    { wch: 40 }, // Medication
    { wch: 25 }, // Form Name
    { wch: 20 }, // CMM Key
    { wch: 15 }, // Form Diff
    { wch: 40 }, // Form Diff Details
    { wch: 15 }, // QA Diff
    { wch: 15 }, // Status
    { wch: 15 }, // Location
    { wch: 50 }, // Comment
    { wch: 15 }, // Record ID
  ];

  worksheet["!cols"] = columnWidths;

  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  const safeFilename = filename.endsWith(".xlsx")
    ? filename
    : `${filename}.xlsx`;
  XLSX.writeFile(workbook, safeFilename);
};

export const exportDataFromTableForMedicalPaOrders = (
  data: MedicalPaOrder[],
) => {
  if (data.length === 0) {
    return [];
  }
  return data.map((item) => {
    return {
      "Order ID": item?.id ?? "",
      "Created At": moment(item?.created_at).format("DD/MMM/YYYY") ?? "",
      "Patient Name": capitalizeString(
        generateFullName(
          item?.demographics?.first_name ?? "",
          "",
          item?.demographics?.last_name ?? "",
        ),
      ),
      "Patient DOB": item?.demographics?.date_of_birth ?? "",
      MRN: item?.demographics?.patient_mrn ?? "",
      "Plan Name (Primary)": item?.coverage?.primary?.payer_name ?? "",
      "Member ID (Primary)": item?.coverage?.primary?.member_id ?? "",
      "Plan Name (Secondary)": item?.coverage?.secondary?.payer_name ?? "",
      "Member ID (Secondary)": item?.coverage?.secondary?.member_id ?? "",
      Medication: item?.payload?.regimen_name ?? "",
      "Date Of Service":
        moment(item?.payload?.date_of_service).format("MM/DD/YYYY") ?? "",
      "Provider Name": capitalizeString(item?.payload?.practitioner_name ?? ""),
      "Auth Issue Comments":
        getAllComments(item)?.["Auth Issue Comments"] ?? "",
      "Auth Issue Reason": getAllReason(item)?.["Auth Issue Reason"] ?? "",
      "BO Status": item?.status?.bo_status ?? "",
      "Auth Verification": item?.auth_on_file?.auth_status ?? "",
      Location: item?.payload?.location ?? "",
      Assignee: item?.assigned_to?.provider_name ?? "",
      "Denial Comments": getAllComments(item)?.["Denial Comments"] ?? "",
      "Denial Reason": getAllReason(item)?.["Denial Reason"] ?? "",
    };
  });
};
// logic for cmm diff data
export const exportDataFromTableForCmmDiffData = (tableData: any[]) => {
  if (tableData.length === 0) {
    return [];
  }
  return tableData.map((item) => {
    return {
      "Patient Name": item.pharmaPaDiffPatientDetails?.mainText ?? "--",
      "Patient MRN":
        item.pharmaPaDiffPatientDetails?.secondaryText?.replace("MRN : ", "") ??
        "--",
      "Date of Service": item.pharmaPaDiffDateOfService ?? "--",
      Medication: item.pharmaPaDiffMedication ?? "--",
      "Form Name": item.pharmaPaDiffFormName ?? "--",
      "CMM Key": item.pharmaPaDiffCmmKey ?? "--",
      "Form Diff": item.pharmaPaDiffFormDiffFields?.text ?? "--",
      "Form Diff Details": item.pharmaPaDiffFormDiffFields?.displayText ?? "--",
      "QA Diff": item.pharmaPaDiffQaDiffFields?.text ?? "--",
      Status: item.pharmaPaDiffStatus?.text ?? "--",
      Comment: item.pharmaPaDiffCommentString ?? "--",
      "Record ID": item.id ?? "--",
    };
  });
};

export const exportDataFromTableForExternalPaOrders = (
  data: FinalWorklistDataResponse[],
  authStatusOptions: AuthStatusOptionModel[],
) => {
  if (data.length === 0) {
    return [];
  }
  return data.map((item) => {
    return {
      "Patient Name": capitalizeString(
        generateFullName(item?.patient_name ?? "", "", ""),
      ),
      "Patient MRN": item?.mrn ?? "",
      "Date of Service":
        moment(item?.date_of_service).format("MM/DD/YYYY") ?? "",
      "Date of Work (DoW)":
        moment(item?.date_of_work).format("MM/DD/YYYY") ?? "",
      "Plan Name (Primary)": item?.primary_insurance ?? "",
      "Plan Name (Secondary)": item?.secondary_ins ?? "",
      "Date of Birth (DoB)": moment(item?.dob).format("MM/DD/YYYY") ?? "",
      "ID (Insurance ID)": item?.id ?? "",
      Medication: item?.regimen ?? "",
      Location: item?.location ?? "",
      "Provider Name": capitalizeString(item?.md ?? ""),
      "Created At": moment(item?.date_of_work).format("MM/DD/YYYY") ?? "",
      "Auth Verification": item?.auth_status ?? "",
      "BO status": getFinalStatusOfOrder(item?.bo_value).text ?? "",
      "Auth Issue Comments":
        getAllComments(item)?.["Auth Issue Comments"] ?? "",
      "Denial Comments": getAllComments(item)?.["Denial Comments"] ?? "",
    };
  });
};

export const exportDataFromTableForExternalPaOrdersNew = (
  data: MedicalPaOrder[],
  authStatusOptions: AuthStatusOptionModel[],
) => {
  if (data.length === 0) {
    return [];
  }
  return data.map((item) => {
    return {
      "Date Of Work": moment(item?.created_at).format("MM/DD/YYYY") ?? "",
      "Patient MRN": item?.demographics?.patient_mrn ?? "",
      "Patient Name": capitalizeString(
        generateFullName(
          item?.demographics?.first_name ?? "",
          "",
          item?.demographics?.last_name ?? "",
        ),
      ),
      "Date Of Birth": item?.demographics?.date_of_birth ?? "",
      MD: item?.payload?.practitioner_name ?? "",
      "Plan Name (Primary)": item?.coverage?.primary?.payer_name ?? "",
      "Member ID (Primary)": item?.coverage?.primary?.member_id ?? "",
      "Plan Name (Secondary)": item?.coverage?.secondary?.payer_name ?? "",
      "Member ID (Secondary)": item?.coverage?.secondary?.member_id ?? "",
      Medication: item?.payload?.regimen_name ?? "",
      "Date Of Service":
        moment(item?.payload?.date_of_service).format("lll") ?? "",
      "Auth Status":
        getAuthStatusTextOfMedicalPaOrder(item, authStatusOptions ?? []) ?? "",
      "BO Status": item?.status?.bo_status ?? "",
      Location: item?.payload?.location ?? "",
      "Auth Issue Comments":
        getAllComments(item)?.["Auth Issue Comments"] ?? "",
      "Denial Comments": getAllComments(item)?.["Denial Comments"] ?? "",
    };
  });
};

export const getAllComments = (item: MedicalPaOrder) => {
  const auth_status_changes = item?.auth_status_changes || [];
  const queryComments = auth_status_changes?.filter(
    (item: AuthStatusChange) => item.new_value === "query",
  );
  const denialComments = auth_status_changes?.filter(
    (item: AuthStatusChange) => item.new_value === "denied_by_risa",
  );
  const queryCommentsText = queryComments?.map(
    (item: AuthStatusChange) =>
      "created at: " +
      moment(item.updated_at).format("MM/DD/YYYY") +
      " " +
      "Query Comment : " +
      item.comment +
      " " +
      ";",
  );
  const denialCommentsText = denialComments?.map(
    (item: AuthStatusChange) =>
      "created at: " +
      moment(item.updated_at).format("MM/DD/YYYY") +
      " " +
      "Denial Comment: " +
      item.comment +
      " " +
      ";",
  );

  return {
    "Auth Issue Comments": queryCommentsText?.join(" "),
    "Denial Comments": denialCommentsText?.join(" "),
  };
};

export const getAllReason = (item: MedicalPaOrder) => {
  const auth_status_changes = item?.auth_status_changes || [];
  const queryComments = auth_status_changes?.filter(
    (item: AuthStatusChange) => item.new_value === "query",
  );
  const denialComments = auth_status_changes?.filter(
    (item: AuthStatusChange) => item.new_value === "denied_by_risa",
  );
  const queryCommentsText = queryComments?.map(
    (item: AuthStatusChange) => item.reason,
  );
  const denialCommentsText = denialComments?.map(
    (item: AuthStatusChange) => item.reason,
  );

  return {
    "Auth Issue Reason": queryCommentsText?.join(" ; "),
    "Denial Reason": denialCommentsText?.join(" ; "),
  };
};
