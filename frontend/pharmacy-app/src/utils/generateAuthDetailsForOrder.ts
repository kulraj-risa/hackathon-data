//TODO:  Need to refactor the code and remove the unused imports
import moment from "moment";
import {
  AuthStatus,
  convertRISAPhoneNumberToAvailityPhoneNumber,
  CoverageStatus,
  Order,
  Provider,
} from "risa-data-model";
import {
  AuthDetails,
  OrderAuthStatus,
  PatientDetailsInAuth,
  ProviderDetailsInAuth,
} from "../data-model/authDetails";
import { InfoGridData } from "../data-model/infoGrid";
import { OrderStatus } from "../enums/authStatus";
import { ButtonText } from "../enums/buttonText";
import { generateAuthStatus } from "./generateAuthStatus";
import {
  generateFullName,
  getMemberIdOfPatient,
} from "./generateOrderDataForTable";
import { capitalizeString } from "./stringModifications";

export const generateAuthStatusDataForOrder = (
  authStatus: AuthStatus,
): OrderAuthStatus => {
  const id = authStatus?.Id || "N/A";
  const isSubmitted = authStatus?.IsSubmitted || false;
  const status = authStatus?.Code
    ? generateAuthStatus(authStatus?.Code)
    : "Unknown";

  const dates = authStatus?.history || {};

  return {
    id,
    isSubmitted,
    status,
    dates,
  };
};

export const generatePrimaryDetailsFromOrder = (order: Order): AuthDetails => {
  const priority = order?.Orders?.[0]?.Priority || undefined;
  const payorName = getPayorName(order?.CoverageStatus || {});
  const type = order?.Visit?.Location?.Type || undefined;
  const submittedBy = order?.OrderingFacility?.ManagingOrganization || "N/A";
  //TODO: get the value from proper place
  const placeOfService = order?.Visit?.Location?.Facility || undefined;
  const submittedOn = "N/A";
  const historyDates = order?.AuthStatus?.history || {};

  return {
    priority,
    payorName,
    type,
    submittedBy,
    placeOfService,
    submittedOn,
    historyDates,
  };
};

export const generateDataForPrimaryDetailsComponent = (
  authDetails: AuthDetails,
): {
  headerText: string;
  subText: string;
}[] => {
  return [
    {
      headerText: "Priority",
      subText: capitalizeString(authDetails?.priority) || "-",
    },
    {
      headerText: "Payor Name",
      subText: authDetails?.payorName || "-",
    },
    {
      headerText: "Type",
      subText: capitalizeString(authDetails?.type) || "N/A",
    },
    {
      headerText: "Submitted By",
      subText: capitalizeString(authDetails?.submittedBy) || "N/A",
    },
    {
      headerText: "Place of Service",
      subText: capitalizeString(authDetails?.placeOfService) || "N/A",
    },
    { headerText: "Submitted On", subText: authDetails?.submittedOn || "N/A" },
  ];
};

export const generatePatientDataForAuthScreen = (
  order?: Order,
): PatientDetailsInAuth => {
  const patientName = generateFullName(
    order?.Patient?.Demographics?.FirstName || "",
    order?.Patient?.Demographics?.MiddleName || "",
    order?.Patient?.Demographics?.LastName || "",
  );
  const mrnId = order?.Patient ? getMemberIdOfPatient(order?.Patient) : "N/A";
  const dob =
    moment(order?.Patient?.Demographics?.DOB).format("DD/MM/YYYY") || "N/A";
  const memberId = getMemberId(order?.CoverageStatus || {});

  return {
    patientName,
    mrnId,
    dob,
    memberId,
  };
};

export const generatePatientDataForInfoComponent = (
  data: PatientDetailsInAuth,
): InfoGridData[] => {
  return [
    {
      header: "Patient Name",
      text: capitalizeString(data?.patientName) || "N/A",
    },
    { header: "MRN ID", text: data?.mrnId || "N/A" },
    { header: "DOB", text: data?.dob || "N/A" },
    { header: "Member ID", text: data?.memberId || "N/A" },
  ];
};

export const generateProviderDetailsForAuthScreen = (
  provider?: Provider,
): ProviderDetailsInAuth => {
  const providerName = generateFullName(
    provider?.FirstName || "",
    "",
    provider?.LastName || "",
  );
  const npi = provider?.NPI || "N/A";
  //TODO : get the value from proper as TIN field is not available
  const tin = "N/A";
  const phoneNumber = convertRISAPhoneNumberToAvailityPhoneNumber(
    provider?.PhoneNumber,
  );
  return {
    providerName,
    npi,
    tin,
    phoneNumber,
  };
};

export const generateProviderDataForInfoComponent = (
  data: ProviderDetailsInAuth,
): InfoGridData[] => {
  return [
    { header: "Name", text: data?.providerName || "N/A" },
    { header: "NPI", text: data?.npi || "N/A" },
    { header: "TIN", text: data?.tin || "N/A" },
    { header: "Contact No", text: data?.phoneNumber || "N/A" },
  ];
};

export const showButtonInHeader = (status?: string) => {
  if (
    status === OrderStatus.Drafts ||
    status === OrderStatus.Pending ||
    status === OrderStatus.Approved ||
    status === OrderStatus.Denied ||
    status === OrderStatus.New
  ) {
    return true;
  }

  return false;
};

export const getButtonLabel = (status?: string) => {
  if (showButtonInHeader(status)) {
    switch (status) {
      case OrderStatus.Drafts:
        return ButtonText.CONTINUE_FILING;

      case OrderStatus.Pending:
        return ButtonText.UPLOAD_DOC;

      case OrderStatus.Approved:
        return ButtonText.VIEW_APPROVAL_LTR;

      case OrderStatus.Denied:
        return ButtonText.REVIEW_AND_APPEAL;

      case OrderStatus.New:
        return ButtonText.NEW_FILING;
    }
  } else {
    return "";
  }
};

/**
 * Retrieves the payer name from coverage data, prioritizing Primary, Secondary, and Tertiary coverages.
 * Returns "N/A" if no payer name is found.
 *
 * @param {CoverageStatus} coverages - The coverage data containing Primary, Secondary, and Tertiary coverages.
 * @returns {string} - The payer name or "N/A" if unavailable.
 */
export const getPayorName = (coverages: CoverageStatus): string =>
  coverages?.Primary?.EHRSpecificPayerName?.toUpperCase() ??
  coverages?.Secondary?.EHRSpecificPayerName?.toUpperCase() ??
  coverages?.Tertiary?.EHRSpecificPayerName?.toUpperCase() ??
  "N/A";

export const getMemberId = (coverages: CoverageStatus): string =>
  coverages?.Primary?.MemberId ??
  coverages?.Secondary?.MemberId ??
  coverages?.Tertiary?.MemberId ??
  "N/A";
