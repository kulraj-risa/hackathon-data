import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import { useTablesContext } from "../../../context/tablesContextProvider";
import { PharmaStpFileModel } from "../../../data-model/nycbsPharmaOrder";
import { TableNames } from "../../../enums/tableNames";
import { RootState } from "../../../redux/store/store";
import { makePostCallForInitialDataFetch } from "../apis/makePostCallForInitialDataFetch";
import { processFilterData } from "../utils/processFilterData";
import { PharmaStpFileFilterPayload } from "./useFilterPayload";
import { PharmaStpFileTableState } from "./usePharmaStpFileTableData";

export interface UseInitialDataFetchingForTableReturn {
  initialDataFetchingExecuted: boolean;
  setInitialDataFetchingExecuted: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useInitialDataFetchingForTable = (
  setPharmaStpFileState: React.Dispatch<
    React.SetStateAction<PharmaStpFileTableState>
  >,
  setTableData: React.Dispatch<React.SetStateAction<PharmaStpFileModel[]>>,
  dateFromStart: string,
  dateFromEnd: string,
  pageSize: number,
): UseInitialDataFetchingForTableReturn => {
  const { setTableDataForContext, getTableDataFromContext } =
    useTablesContext();
  const [initialDataFetchingExecuted, setInitialDataFetchingExecuted] =
    useState<boolean>(false);

  const tableAttributes = getTableDataFromContext(
    TableNames.PHARMA_STP_FILE_ORDERS,
  );

  const { filters } = useSelector((state: RootState) => state.filterValues);

  const validFilters = useMemo(() => {
    return filters.filter(
      (filter) => filter.name === TableNames.PHARMA_STP_FILE_ORDERS,
    );
  }, [filters]);

  const setPharmaStpFileStateRef = useRef(setPharmaStpFileState);
  const setTableDataRef = useRef(setTableData);
  const setTableDataForContextRef = useRef(setTableDataForContext);

  useEffect(() => {
    setPharmaStpFileStateRef.current = setPharmaStpFileState;
    setTableDataRef.current = setTableData;
    setTableDataForContextRef.current = setTableDataForContext;
  }, [setPharmaStpFileState, setTableData, setTableDataForContext]);

  useEffect(() => {
    if (!initialDataFetchingExecuted && dateFromStart && dateFromEnd) {
      const searchedText = tableAttributes?.searchedText ?? "";

      const { filters: apiFilters, dateRange } =
        processFilterData(validFilters);

      const payload: PharmaStpFileFilterPayload = {
        date_from_filename_start: dateRange?.startDate ?? dateFromStart,
        date_from_filename_end: dateRange?.endDate ?? dateFromEnd,
        filters: apiFilters,
        page: 1,
        page_size: pageSize,
        request_id: uuidv4(),
      };

      makePostCallForInitialDataFetch(
        payload,
        setPharmaStpFileStateRef.current,
        setTableDataRef.current,
      ).then(() => {
        setInitialDataFetchingExecuted(true);

        setTableDataForContextRef.current(TableNames.PHARMA_STP_FILE_ORDERS, {
          lastBatchFetched: 1,
        });
      });
    }
  }, [
    initialDataFetchingExecuted,
    dateFromStart,
    dateFromEnd,
    pageSize,
    tableAttributes?.searchedText,
    validFilters,
  ]);

  return {
    initialDataFetchingExecuted,
    setInitialDataFetchingExecuted,
  };
};
