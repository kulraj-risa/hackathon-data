import moment from "moment";
import {
  History,
  Insurance,
  Order,
  OrderData,
  Patient,
  Provider,
  RisaError,
  ValidationMessage,
} from "risa-data-model";
import {
  AllOrderForTable,
  EligibilityErrors,
  PatientOrdersForTable,
} from "../data-model/tablesData";
import { generateAuthStatus } from "./generateAuthStatus";
import { getFullNameOfTheProvider } from "./getFullNameOfTheProvider";
import {
  capitalizeString,
  capitalizeWordsSeparatedBySpace,
} from "./stringModifications";

export const generateFullName = (
  firstName: string,
  middleName: string | null,
  lastName: string | null,
): string => {
  return `${firstName}${middleName ? " " + middleName : ""}${
    lastName ? " " + lastName : ""
  }`;
};

export const getMemberIdOfPatient = (patient: Patient) => {
  const memberId = patient?.Identifiers?.find(
    (identifier) => identifier.IDType === "MR",
  );
  return memberId ? memberId.ID : "N/A";
};

export const countCptCodesWhichRequiresPA = (orders: OrderData[]) => {
  const authRequiredOrders = orders.filter(
    (order) => order.PriorAuthNeeded === true,
  );

  return `${authRequiredOrders.length}/${orders.length}`;
};

export const getPlanNameForPrimaryInsurance = (insurances: Insurance[]) => {
  const primaryInsurance = insurances.find(
    (insurance) => insurance.Priority === "Primary",
  );

  return primaryInsurance ? primaryInsurance?.Plan?.Name : "N/A";
};

export const getPlanIdForPrimaryInsurance = (insurances: Insurance[]) => {
  const primaryInsurance = insurances.find(
    (insurance) => insurance.Priority === "Primary",
  );

  return primaryInsurance ? primaryInsurance?.Plan?.ID : "N/A";
};

export const getCptCodesWhichRequiresPA = (orders: OrderData[]) => {
  const authRequiredOrders = orders.filter(
    (order) => order.PriorAuthNeeded === true,
  );

  return authRequiredOrders.map((order) => order?.Procedure?.Code);
};

export const getCptCodeWithPaStatus = (orders: OrderData[]) => {
  return orders.map((order) => ({
    text: order?.Procedure?.Code || "N/A",
    value: order?.PriorAuthNeeded || false,
  }));
};

export function generateOrderData(
  orders: Order[],
  allProviders: Provider[],
  orderType: string = "all-orders",
): AllOrderForTable[] {
  return orders.map((order) => {
    const patientName = generateFullName(
      order?.Patient?.Demographics?.FirstName || "",
      order?.Patient?.Demographics?.MiddleName || "",
      order?.Patient?.Demographics?.LastName || "",
    );
    const patientID = getMemberIdOfPatient(order?.Patient as Patient);
    const planName =
      capitalizeString(order?.Visit?.Insurances?.[0].Plan?.Name) || "N/A";
    const planID = order?.Visit?.Insurances?.[0].MemberNumber || "N/A";
    const authorizationId = order?.AuthStatus?.Id || "N/A";
    const authRequired = countCptCodesWhichRequiresPA(order?.Orders || []);
    const priority = order?.Orders ? order?.Orders[0]?.Priority || "N/A" : "";
    const type = order?.Visit?.Location?.Type || "N/A";
    const dateOfService = order?.Orders?.[0]?.CollectionDateTime
      ? moment(order?.Orders?.[0]?.CollectionDateTime).format("DD/MM/YYYY")
      : "N/A";

    const location = order?.OrderingFacility?.Address?.City || "N/A";
    const status = order?.AuthStatus?.Code
      ? generateAuthStatus(order?.AuthStatus?.Code)
      : "Unknown";
    const assignedTo = getFullNameOfTheProvider(
      order?.AssignedTo?.ProviderId || "",
      allProviders,
    );
    const cptCodesWithPaStatus = getCptCodeWithPaStatus(order?.Orders || []);
    const docId = order?.DocId || "N/A";

    return {
      patientName,
      patientID,
      planName,
      planID,
      authorizationId,
      authRequired,
      priority,
      type,
      dateOfService,
      location,
      status,
      cptCodesWithPaStatus,
      assignedTo,
      docId,
    };
  });
}

export function generateDataForPatientsOrdersTable(
  order: Order[],
): PatientOrdersForTable[] {
  return order.map((order) => {
    const authId = order?.AuthStatus?.Id || "N/A";
    const authRequired = countCptCodesWhichRequiresPA(order?.Orders || []);
    const dateOfService =
      moment(order?.AuthoredOn).format("DD/MM/YYYY") || "N/A";
    const location = capitalizeWordsSeparatedBySpace(
      order?.OrderingFacility?.Address?.City ?? "N/A",
    );
    const planName = "N/A";
    const priority = order?.Orders ? order?.Orders[0]?.Priority || "N/A" : "";
    const status = order?.AuthStatus?.Code
      ? generateAuthStatus(order?.AuthStatus?.Code)
      : "Unknown";
    const submissionDate = "01/09/24";
    const submittedBy = order?.AssignedTo?.ProviderId || "N/A";
    const docId = order?.DocId || "N/A";
    const cptCodesWithPaStatus = getCptCodeWithPaStatus(order?.Orders || []);

    return {
      authId,
      authRequired,
      dateOfService,
      location,
      planName,
      priority,
      status,
      submissionDate,
      submittedBy,
      docId,
      cptCodesWithPaStatus,
    };
  });
}

export function generateDataForEligibilityErrorTable(
  orders: Order[],
): EligibilityErrors[] {
  return orders.map((order) => {
    generateErrorMessageInReadableFormat(order?.error);
    return {
      patientName: generateFullName(
        order?.Patient?.Demographics?.FirstName || "",
        order?.Patient?.Demographics?.MiddleName || "",
        order?.Patient?.Demographics?.LastName || "",
      ),
      patientID: getMemberIdOfPatient(order?.Patient as Patient),
      payerName: order?.Visit?.Insurances?.[0].Plan?.Name || "N/A",
      payerId: order?.Visit?.Insurances?.[0].MemberNumber || "N/A",
      priority: order?.Orders ? order?.Orders[0]?.Priority || "N/A" : "",
      type: order?.Visit?.Location?.Type || "N/A",
      orderDate:
        moment(order?.AuthStatus?.history?.error).format("DD/MM/ YYYY") ||
        "N/A",
      location: capitalizeWordsSeparatedBySpace(
        order?.OrderingFacility?.Address?.City ?? "N/A",
      ),
      docId: order?.DocId || "N/A",
      error: generateErrorMessageInReadableFormat(order?.error) || "N/A",
      cptCodesWithPaStatus: getCptCodeWithPaStatus(order?.Orders || []),
      authRequired: countCptCodesWhichRequiresPA(order?.Orders || []),
    };
  });
}

export const generateErrorMessageInReadableFormat = (errors?: RisaError) => {
  var errorMessage = "";
  if (errors?.primaryError && errors?.primaryError?.statusCode !== "4") {
    const primaryErrorMessage = "Primary Error : " + errors.primaryError.status;
    errorMessage += primaryErrorMessage;
    if (errors?.primaryError?.validationMessages) {
      errorMessage += "\n";
      errorMessage += convertValidationMessagesToReadableFormat(
        errors?.primaryError?.validationMessages,
      );
    }
    errorMessage += "\n";
  }
  if (errors?.secondaryError && errors?.secondaryError?.statusCode !== "4") {
    const secondaryErrorMessage =
      "Secondary Error : " + errors.secondaryError.status;
    errorMessage += secondaryErrorMessage;
    if (errors?.secondaryError?.validationMessages) {
      errorMessage += "\n";
      errorMessage += convertValidationMessagesToReadableFormat(
        errors?.secondaryError?.validationMessages,
      );
    }
    errorMessage += "\n";
  }
  if (errors?.tertiaryError && errors?.tertiaryError?.statusCode !== "4") {
    const tertiaryErrorMessage =
      "Tertiary Error : " + errors.tertiaryError.status;
    errorMessage += tertiaryErrorMessage;
    if (errors?.tertiaryError?.validationMessages) {
      errorMessage += "\n";
      errorMessage += convertValidationMessagesToReadableFormat(
        errors?.tertiaryError?.validationMessages,
      );
    }
    errorMessage += "\n";
  }

  if (errorMessage === "") {
    errorMessage = "Unknown Error";
  }

  return errorMessage;
};

export const convertValidationMessagesToReadableFormat = (
  validationMessages: ValidationMessage[],
) => {
  var errorMessage = "";
  validationMessages.forEach((validationMessage) => {
    const fieldValue = validationMessage?.field || "";
    const fieldErrorMessage = validationMessage?.errorMessage || "";

    if (fieldValue != "") {
      errorMessage += "Field name : " + fieldValue + "\n";
    }

    if (fieldErrorMessage != "") {
      errorMessage += "Error message" + " : " + fieldErrorMessage + "\n";
    }
  });

  return errorMessage;
};

export const getDateBasedOnOrderType = (
  orderType: string,
  history?: History,
) => {
  if (!history) return;

  const dateKey =
    orderType === "all-orders"
      ? "received"
      : orderType === "pa-orders"
        ? "new"
        : null;

  if (dateKey) {
    return moment(history[dateKey] || "").format("DD/MM/YYYY");
  }
};
