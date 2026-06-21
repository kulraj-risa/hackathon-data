import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { FilterValues } from "../../../data-model/filterValues";
import { processFilterData } from "../utils/processFilterData";

export interface PharmaStpFileFilterPayload {
  date_from_filename_start: string;
  date_from_filename_end: string;
  filters?: {
    patient_mrn?: string[] | string;
    [key: string]: any;
  };
  page: number;
  page_size: number;
  request_id?: string;
}

export interface UseFilterPayloadReturn {
  filterPayload: PharmaStpFileFilterPayload | null;
  setFilterPayload: React.Dispatch<
    React.SetStateAction<PharmaStpFileFilterPayload | null>
  >;
}

export const useFilterPayload = (
  validFilters: FilterValues[],
  searchTerm: string,
  initialDataFetchingExecuted: boolean,
  dateFromStart: string,
  dateFromEnd: string,
  pageSize: number = 120,
): UseFilterPayloadReturn => {
  const [filterPayload, setFilterPayload] =
    useState<PharmaStpFileFilterPayload | null>(null);

  useEffect(() => {
    if (!initialDataFetchingExecuted) {
      setFilterPayload(null);
    } else {
      const { filters: apiFilters, dateRange } =
        processFilterData(validFilters);

      if (searchTerm && searchTerm.trim().length > 0) {
        const mrnArray = searchTerm
          .split(",")
          .map((mrn) => mrn.trim())
          .filter((mrn) => mrn.length > 0);

        if (mrnArray.length > 0) {
          apiFilters.patient_mrn = mrnArray;
        }
      }

      const payload: PharmaStpFileFilterPayload = {
        date_from_filename_start: dateRange?.startDate ?? dateFromStart,
        date_from_filename_end: dateRange?.endDate ?? dateFromEnd,
        filters: apiFilters,
        page: 1,
        page_size: pageSize,
        request_id: uuidv4(),
      };
      setFilterPayload(payload);
    }
  }, [
    validFilters,
    searchTerm,
    initialDataFetchingExecuted,
    dateFromStart,
    dateFromEnd,
    pageSize,
  ]);

  return {
    filterPayload,
    setFilterPayload,
  };
};
