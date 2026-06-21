import { FilterSection } from "../../../data-model/filterValues";
import { PharmaStpFileModel } from "../../../data-model/nycbsPharmaOrder";
import { extractFormattedDateFromFileName } from "../table/utils/extractDateFromFileName";

export enum PharmaStpFileFilterKeys {
  BATCH = "batch",
  DOW = "dow",
}

export const createFilterForBatch = (
  data: PharmaStpFileModel[],
): FilterSection => {
  const uniqueBatches = Array.from(
    new Set(
      data
        .map((item) => {
          const fileName = item?.filename ?? "";
          return fileName;
        })
        .filter((batch): batch is string => Boolean(batch) && batch !== "--"),
    ),
  ).sort();

  return {
    id: PharmaStpFileFilterKeys.BATCH,
    label: "Batch",
    options: uniqueBatches.map((batch) => ({
      label: batch,
      value: batch,
    })),
    type: "string",
  };
};

export const createFilterForDOW = (
  data: PharmaStpFileModel[],
): FilterSection => {
  const uniqueDOWs = Array.from(
    new Set(
      data
        .map((item) => {
          const fileName = item?.filename ?? "";
          return extractFormattedDateFromFileName(fileName);
        })
        .filter((dow): dow is string => Boolean(dow) && dow !== "--"),
    ),
  ).sort();

  return {
    id: PharmaStpFileFilterKeys.DOW,
    label: "DOW",
    options: [],
    type: "date",
  };
};

export const createAllFilterSections = (
  data: PharmaStpFileModel[],
): FilterSection[] => {
  if (!data || data.length === 0) {
    return [];
  }

  return [createFilterForBatch(data)];
};
