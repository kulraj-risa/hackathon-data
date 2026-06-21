import { useCallback, useEffect, useRef } from "react";
import { PharmaStpFileModel } from "../../../data-model/nycbsPharmaOrder";
import { makePostCallForPharmaStpFile } from "../apis/makePostCallForPharmaStpFile";
import { PharmaStpFileFilterPayload } from "./useFilterPayload";
import { PharmaStpFileTableState } from "./usePharmaStpFileTableData";

export const useFilterAndSearchEffect = (
  filterPayload: PharmaStpFileFilterPayload | null,
  initialDataFetchingExecuted: boolean,
  setTableData: React.Dispatch<React.SetStateAction<PharmaStpFileModel[]>>,
  setPharmaStpFileState: React.Dispatch<
    React.SetStateAction<PharmaStpFileTableState>
  >,
  setPaginationResetCount: React.Dispatch<React.SetStateAction<number>>,
): void => {
  const initialDataFetchingExecutedRef = useRef(initialDataFetchingExecuted);
  const setTableDataRef = useRef(setTableData);
  const setPharmaStpFileStateRef = useRef(setPharmaStpFileState);
  const setPaginationResetCountRef = useRef(setPaginationResetCount);

  useEffect(() => {
    initialDataFetchingExecutedRef.current = initialDataFetchingExecuted;
    setTableDataRef.current = setTableData;
    setPharmaStpFileStateRef.current = setPharmaStpFileState;
    setPaginationResetCountRef.current = setPaginationResetCount;
  }, [
    initialDataFetchingExecuted,
    setTableData,
    setPharmaStpFileState,
    setPaginationResetCount,
  ]);

  const fetchData = useCallback(() => {
    if (filterPayload) {
      makePostCallForPharmaStpFile(
        filterPayload,
        setPharmaStpFileStateRef.current,
        setTableDataRef.current,
        setPaginationResetCountRef.current,
      );
    }
  }, [filterPayload]);

  useEffect(() => {
    if (filterPayload && initialDataFetchingExecutedRef.current) {
      fetchData();
    }
  }, [filterPayload, fetchData]);
};
