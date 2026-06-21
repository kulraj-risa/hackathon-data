import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useTablesContext } from "../../../context/tablesContextProvider";
import { FilterValues } from "../../../data-model/filterValues";
import { PharmaStpFileModel } from "../../../data-model/nycbsPharmaOrder";
import { TableNames } from "../../../enums/tableNames";
import { makePostCallForNextPagesDataFetch } from "../apis/makePostCallForNextPagesDataFetch";
import { processFilterData } from "../utils/processFilterData";
import {
  PharmaStpFileFilterPayload,
  useFilterPayload,
} from "./useFilterPayload";
import { PharmaStpFileTableState } from "./usePharmaStpFileTableData";

export interface UseNextPageDataFetchReturn {
  endIndex: number;
  setEndIndex: React.Dispatch<React.SetStateAction<number>>;
}

export const useNextPageDataFetch = (
  validFilters: FilterValues[],
  searchTerm: string,
  initialDataFetchingExecuted: boolean,
  pharmaStpFileState: PharmaStpFileTableState,
  setPharmaStpFileState: React.Dispatch<
    React.SetStateAction<PharmaStpFileTableState>
  >,
  setTableData: React.Dispatch<React.SetStateAction<PharmaStpFileModel[]>>,
  dateFromStart: string,
  dateFromEnd: string,
  pageSize: number = 120,
): UseNextPageDataFetchReturn => {
  const { setTableDataForContext } = useTablesContext();
  const [endIndex, setEndIndex] = useState<number>(0);

  const lastRequestedPageRef = useRef<number>(0);

  const { filterPayload } = useFilterPayload(
    validFilters,
    searchTerm,
    initialDataFetchingExecuted,
    dateFromStart,
    dateFromEnd,
    pageSize,
  );

  const initialDataFetchingExecutedRef = useRef(initialDataFetchingExecuted);
  const setPharmaStpFileStateRef = useRef(setPharmaStpFileState);
  const setTableDataRef = useRef(setTableData);
  const setTableDataForContextRef = useRef(setTableDataForContext);

  useEffect(() => {
    initialDataFetchingExecutedRef.current = initialDataFetchingExecuted;
    setPharmaStpFileStateRef.current = setPharmaStpFileState;
    setTableDataRef.current = setTableData;
    setTableDataForContextRef.current = setTableDataForContext;
  }, [
    initialDataFetchingExecuted,
    setPharmaStpFileState,
    setTableData,
    setTableDataForContext,
  ]);

  useEffect(() => {
    lastRequestedPageRef.current = 0;
  }, [validFilters, searchTerm, dateFromStart, dateFromEnd]);

  const shouldFetchMoreData = useMemo(() => {
    const currentPageRowCount = pharmaStpFileState.data?.row_count ?? 0;
    const currentPage = pharmaStpFileState.data?.page ?? 1;
    const totalPages = pharmaStpFileState.data?.total_pages ?? 1;
    const nextPageToFetch = currentPage + 1;

    const previousPagesRows = (currentPage - 1) * pageSize;
    const cumulativeRowsLoaded = previousPagesRows + currentPageRowCount;

    return (
      endIndex >= cumulativeRowsLoaded - 1 &&
      currentPage < totalPages &&
      !pharmaStpFileState.loading &&
      !pharmaStpFileState.showInlineLoader &&
      nextPageToFetch > lastRequestedPageRef.current
    );
  }, [
    endIndex,
    pharmaStpFileState.data?.row_count,
    pharmaStpFileState.data?.page,
    pharmaStpFileState.data?.total_pages,
    pharmaStpFileState.loading,
    pharmaStpFileState.showInlineLoader,
    pageSize,
  ]);

  const payloadFinal = useMemo<PharmaStpFileFilterPayload>(() => {
    if (filterPayload === null) {
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

      return {
        date_from_filename_start: dateRange?.startDate ?? dateFromStart,
        date_from_filename_end: dateRange?.endDate ?? dateFromEnd,
        filters: apiFilters,
        page: 1,
        page_size: pageSize,
        request_id: uuidv4(),
      };
    }
    return filterPayload;
  }, [
    filterPayload,
    validFilters,
    dateFromStart,
    dateFromEnd,
    searchTerm,
    pageSize,
  ]);

  const payloadFinalWithPage = useMemo<PharmaStpFileFilterPayload>(() => {
    return {
      ...payloadFinal,
      page: (pharmaStpFileState.data?.page ?? 0) + 1,
      request_id: uuidv4(),
    };
  }, [payloadFinal, pharmaStpFileState.data?.page]);

  const currentPage = pharmaStpFileState.data?.page ?? 0;

  const fetchNextPage = useCallback(() => {
    const nextPage = currentPage + 1;
    lastRequestedPageRef.current = nextPage;

    makePostCallForNextPagesDataFetch(
      payloadFinalWithPage,
      setPharmaStpFileStateRef.current,
      setTableDataRef.current,
    );
    setTableDataForContextRef.current(TableNames.PHARMA_STP_FILE_ORDERS, {
      lastBatchFetched: nextPage,
    });
  }, [payloadFinalWithPage, currentPage]);

  useEffect(() => {
    if (shouldFetchMoreData && initialDataFetchingExecutedRef.current) {
      fetchNextPage();
    }
  }, [shouldFetchMoreData, fetchNextPage]);

  return {
    endIndex,
    setEndIndex,
  };
};
