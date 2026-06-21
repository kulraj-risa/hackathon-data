import moment from "moment";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchFilenameSummary,
  FilenameSummaryApiResponse,
} from "../../../../api/bigQuery/filenameSummary";
import { PushToSftpTableDataModel } from "../../../../data-model/pushToSftpDataModel";
import { PushToSftpModalTableColumnKeys } from "../../../../enums/tableColumnKeys";

interface PushToSftpState {
  data: FilenameSummaryApiResponse | null;
  loading: boolean;
  showInlineLoader: boolean;
  error: string | null;
}

export const useTableDataForSftpPush = () => {
  const [tableData, setTableData] = useState<PushToSftpTableDataModel[]>([]);
  const [endIndex, setEndIndex] = useState<number>(0);
  const [pushToSftpState, setPushToSftpState] = useState<PushToSftpState>({
    data: null,
    loading: false,
    showInlineLoader: false,
    error: null,
  });

  const pageSize = 40;

  const transformResponseToTableData = (
    items: any[],
    startIndex: number,
  ): PushToSftpTableDataModel[] => {
    return items.map((item, index) => ({
      [PushToSftpModalTableColumnKeys.SELECT]: {
        id: `row-${startIndex + index}`,
        label: "",
        isChecked: false,
        disabled: item.sftp_status === "success",
      },
      [PushToSftpModalTableColumnKeys.FILENAME]: item.filename,
      [PushToSftpModalTableColumnKeys.ROW_COUNT]: item.row_count,
      [PushToSftpModalTableColumnKeys.DUMPED_AT]: `${moment(
        item.dumped_at,
      ).format("MM/DD/YYYY")}`,
      [PushToSftpModalTableColumnKeys.RECEIVE_TIME]: `${moment(
        item.dumped_at,
      ).format("HH:mm")}`,
    }));
  };

  // Initial data fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      setPushToSftpState((prev) => ({ ...prev, loading: true }));
      try {
        const response = await fetchFilenameSummary({
          page: 1,
          page_size: pageSize,
        });
        if (response.success && response.items) {
          const transformedData = transformResponseToTableData(
            response.items,
            0,
          );
          setTableData(transformedData);
          setPushToSftpState({
            data: response,
            loading: false,
            showInlineLoader: false,
            error: null,
          });
        }
      } catch (error) {
        console.error("Error fetching filename summary:", error);
        setPushToSftpState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }));
      }
    };

    fetchInitialData();
  }, []);

  // Calculate if we should fetch more data
  const shouldFetchMoreData = useMemo(() => {
    const totalRowsLoaded = tableData.length;
    const currentPage = pushToSftpState.data?.page ?? 1;
    const totalPages = pushToSftpState.data?.total_pages ?? 1;

    return (
      endIndex === totalRowsLoaded - 1 &&
      currentPage < totalPages &&
      !pushToSftpState.loading &&
      !pushToSftpState.showInlineLoader
    );
  }, [
    endIndex,
    tableData.length,
    pushToSftpState.data?.page,
    pushToSftpState.data?.total_pages,
    pushToSftpState.loading,
    pushToSftpState.showInlineLoader,
  ]);

  // Refs to store latest values
  const setPushToSftpStateRef = useRef(setPushToSftpState);
  const setTableDataRef = useRef(setTableData);

  useEffect(() => {
    setPushToSftpStateRef.current = setPushToSftpState;
    setTableDataRef.current = setTableData;
  }, [setPushToSftpState, setTableData]);

  // Fetch next page
  const fetchNextPage = useCallback(async () => {
    const nextPage = (pushToSftpState.data?.page ?? 0) + 1;

    setPushToSftpStateRef.current((prev) => ({
      ...prev,
      showInlineLoader: true,
    }));

    try {
      const response = await fetchFilenameSummary({
        page: nextPage,
        page_size: pageSize,
      });

      if (response.success && response.items) {
        const startIndex = tableData.length;
        const transformedData = transformResponseToTableData(
          response.items,
          startIndex,
        );

        setTableDataRef.current((prevData) => [
          ...prevData,
          ...transformedData,
        ]);
        setPushToSftpStateRef.current({
          data: response,
          loading: false,
          showInlineLoader: false,
          error: null,
        });
      }
    } catch (error) {
      console.error("Error fetching next page:", error);
      setPushToSftpStateRef.current((prev) => ({
        ...prev,
        showInlineLoader: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }));
    }
  }, [pushToSftpState.data?.page, tableData.length]);

  // Trigger fetch when needed
  useEffect(() => {
    if (shouldFetchMoreData) {
      fetchNextPage();
    }
  }, [shouldFetchMoreData, fetchNextPage]);

  return {
    tableData,
    setTableData,
    isLoading: pushToSftpState.loading,
    showInlineLoader: pushToSftpState.showInlineLoader,
    totalCount: pushToSftpState.data?.total_count ?? 0,
    setEndIndex,
  };
};
