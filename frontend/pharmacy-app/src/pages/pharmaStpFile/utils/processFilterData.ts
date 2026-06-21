import { FilterValues } from "../../../data-model/filterValues";
import { convertDateToAPIFormat } from "./convertDateToApiFormat";
import { PharmaStpFileFilterKeys } from "./createFilterSections";

export interface ProcessedFilterData {
  filters: { [key: string]: string[] };
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}

export const processFilterData = (
  validFilters: FilterValues[],
): ProcessedFilterData => {
  const filters: { [key: string]: string[] } = {};
  let dateRange: { startDate: string; endDate: string } | undefined;

  if (!validFilters || validFilters.length === 0) {
    return { filters };
  }

  const filter = validFilters[0];

  if (!filter || !filter.values) {
    return { filters };
  }

  Object.entries(filter.values).forEach(([filterId, filterData]) => {
    const selectedValues = filterData.values || [];

    if (selectedValues.length > 0) {
      switch (filterId) {
        case PharmaStpFileFilterKeys.BATCH:
          filters.filename = selectedValues;
          break;
        case PharmaStpFileFilterKeys.DOW:
          if (selectedValues.length >= 2) {
            dateRange = {
              startDate: convertDateToAPIFormat(selectedValues[0]),
              endDate: convertDateToAPIFormat(selectedValues[1]),
            };
          } else if (selectedValues.length === 1) {
            const convertedDate = convertDateToAPIFormat(selectedValues[0]);
            dateRange = {
              startDate: convertedDate,
              endDate: convertedDate,
            };
          }
          break;
        default:
          break;
      }
    }
  });

  return { filters, dateRange };
};
