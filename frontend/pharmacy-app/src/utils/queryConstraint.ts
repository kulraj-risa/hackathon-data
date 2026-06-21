import { QueryConstraint, where } from "firebase/firestore";
import moment from "moment";
import { FilterValues } from "../data-model/filterValues";
import { MedicalPaOrder } from "../data-model/medicalPaOrdersModel";
import { MedicalPaOrderFilterKeys } from "../enums/medicalPaKeys";

export const createQueryConstraintforFilters = (
  filterValues: FilterValues[],
  searchedTerm?: string,
) => {
  const queryConstraints: QueryConstraint[] = [];
  if (searchedTerm && searchedTerm !== "") {
    queryConstraints.push(
      where("search_index", "array-contains", searchedTerm.toLowerCase()),
    );
  }
  const filtersAfterProcessing = processFilterData(filterValues);
  const queryConstarintKey = Object.keys(filtersAfterProcessing);
  for (const key of queryConstarintKey) {
    if (key === MedicalPaOrderFilterKeys.DrugNames) {
      queryConstraints.push(
        createQueryConstraintforDrugNames(filtersAfterProcessing[key]),
      );
    }
    if (key === MedicalPaOrderFilterKeys.PayerNames) {
      queryConstraints.push(
        createQueryConstraintforPayerNames(filtersAfterProcessing[key]),
      );
    }
  }

  return queryConstraints;
};

export const createQueryConstraintforDrugNames = (drugNames: string[]) => {
  return where("payload.regimen_name", "in", drugNames);
};

export const createQueryConstraintforPayerNames = (payerNames: string[]) => {
  return where("coverage.primary.payer_name", "in", payerNames);
};

export const processFilterData = (validFilters: FilterValues[]) => {
  if (!validFilters?.[0]?.["filterCount"]) return {};

  const allFilters = validFilters[0];
  const filters = Object.keys(allFilters).filter((key) => key === "values");
  const filterValues = filters.map((filter) => allFilters[filter]);

  return Object.keys(filterValues?.[0] || {})
    .map((key) => ({
      [key]: filterValues?.[0]?.[key]?.values,
    }))
    .reduce((acc, curr) => ({ ...acc, ...curr }), {});
};

export const createFilteredDataForUiManipulation = (
  filterValues: FilterValues[],
  ordersData: MedicalPaOrder[],
) => {
  let filteredData = ordersData;
  const filtersAfterProcessing = processFilterData(filterValues);
  const filterKeys = Object.keys(filtersAfterProcessing);
  for (const key of filterKeys) {
    if (key === MedicalPaOrderFilterKeys.DrugNames) {
      filteredData = filteredData.filter((order) => {
        const drugName = order.payload?.regimen_name;
        if (drugName) {
          return filtersAfterProcessing[key].includes(drugName);
        }
        return false;
      });
    }
    if (key === MedicalPaOrderFilterKeys.PayerNames) {
      filteredData = filteredData.filter((order) => {
        const payerName = order.coverage?.primary?.payer_name;
        if (payerName) {
          return filtersAfterProcessing[key].includes(payerName);
        }
        return false;
      });
    }
    if (key === MedicalPaOrderFilterKeys.Status) {
      filteredData = filteredData.filter((order) => {
        const status = order?.status?.financial_review;
        if (status) {
          return filtersAfterProcessing[key].includes(status);
        }
        return false;
      });
    }
    if (key === MedicalPaOrderFilterKeys.AuthVerificationStatus) {
      filteredData = filteredData.filter((order) => {
        const authStatus = order?.auth_on_file?.auth_status;
        if (authStatus) {
          return filtersAfterProcessing[key].includes(authStatus);
        }
        return false;
      });
    }

    if (key === MedicalPaOrderFilterKeys.BoStatus) {
      filteredData = filteredData.filter((order) => {
        const boStatus = order?.status?.bo_status;
        if (boStatus) {
          return filtersAfterProcessing[key].includes(boStatus);
        }
        return false;
      });
    }

    if (key === MedicalPaOrderFilterKeys.Assignee) {
      const assignee = filtersAfterProcessing[key];
      const assigneeList = assignee.includes("unassigned")
        ? [...assignee, ""]
        : assignee;
      filteredData = filteredData.filter((order) => {
        return assigneeList.includes(order?.assigned_to?.provider_id ?? "");
      });
    }
    if (key === MedicalPaOrderFilterKeys.DateOfService) {
      filteredData = filteredData.filter((order) => {
        const serviceDate = moment(order?.payload?.date_of_service);
        const startDate = moment(filtersAfterProcessing[key][0]);
        const endDate = moment(filtersAfterProcessing[key][1]);

        return (
          serviceDate.isSameOrAfter(startDate, "day") &&
          serviceDate.isSameOrBefore(endDate, "day")
        );
      });
    }

    if (key === MedicalPaOrderFilterKeys.CreatedAt) {
      filteredData = filteredData.filter((order) => {
        const createdAt = moment(order?.created_at);
        const startDate = moment(filtersAfterProcessing[key][0]);
        const endDate = moment(filtersAfterProcessing[key][1]);

        return (
          createdAt.isSameOrAfter(startDate, "day") &&
          createdAt.isSameOrBefore(endDate, "day")
        );
      });
    }
    if (key === MedicalPaOrderFilterKeys.EvWriteBackStatus) {
      filteredData = filteredData.filter((order) => {
        const evWriteBackStatus = order?.status?.ev_write_back_status;
        if (evWriteBackStatus) {
          return filtersAfterProcessing[key].includes(evWriteBackStatus);
        }
        return false;
      });
    }
    if (key === MedicalPaOrderFilterKeys.DocumentUploadStatus) {
      filteredData = filteredData.filter((order) => {
        const documentUploadStatus = order?.status?.document_upload_status;
        if (documentUploadStatus) {
          return filtersAfterProcessing[key].includes(documentUploadStatus);
        }
        return false;
      });
    }
  }
  return filteredData;
};
export const transformObjectToKeyValueArray = (
  obj: Record<string, string[]>,
) => {
  return Object.entries(obj)
    .filter(
      ([key]) =>
        key !== "created_at" &&
        key !== "date_of_service" &&
        key !== "date_of_work",
    )
    .map(([key, values]) =>
      values.map((value) => {
        return `${key}:${value}`;
      }),
    );
};

export const transformDateFields = (obj: Record<string, string[]>) => {
  const result: Record<string, string> = {};

  ["created_at", "date_of_service", "date_of_work"].forEach((field) => {
    if (obj[field]) {
      const formatted = obj[field].map((v) => {
        const [mm, dd, yyyy] = v.split("/");
        return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
      });

      // Sort to find min/max
      const sorted = formatted.sort();
      result[`${field}_start`] = sorted[0];
      result[`${field}_end`] = sorted[sorted.length - 1];
    }
  });

  return result;
};
