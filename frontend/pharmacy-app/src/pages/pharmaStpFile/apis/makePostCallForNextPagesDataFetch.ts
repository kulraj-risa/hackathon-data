import {
  fetchPharmaStpFileData,
  PharmaStpFileApiResponse,
} from "../../../api/bigQuery/pharmaStpFileOrders";
import { PharmaStpFileModel } from "../../../data-model/nycbsPharmaOrder";
import { logError } from "../../../utils/customLogger";
import { PharmaStpFileFilterPayload } from "../hooks/useFilterPayload";
import { PharmaStpFileTableState } from "../hooks/usePharmaStpFileTableData";

/**
 * makePostCallForNextPagesDataFetch - API Call for Pagination
 *
 * Purpose: Fetches next page of data when user scrolls to the end.
 * Appends new data to existing tableData without resetting.
 *
 * @param payload - Filter payload containing search params with incremented page number
 * @param setPharmaStpFileState - State setter for API response
 * @param setTableData - State setter for table data (appends to existing data)
 */
export const makePostCallForNextPagesDataFetch = async (
  payload: PharmaStpFileFilterPayload,
  setPharmaStpFileState: React.Dispatch<
    React.SetStateAction<PharmaStpFileTableState>
  >,
  setTableData: React.Dispatch<React.SetStateAction<PharmaStpFileModel[]>>,
): Promise<void> => {
  try {
    setPharmaStpFileState((prev) => ({
      ...prev,
      showInlineLoader: true,
      error: null,
    }));

    const response: PharmaStpFileApiResponse =
      await fetchPharmaStpFileData(payload);

    if (response.success) {
      setPharmaStpFileState({
        data: response,
        loading: false,
        error: null,
        showInlineLoader: false,
      });

      // Append new data to existing data
      setTableData((prevData) => [...prevData, ...response.rows]);
    } else {
      setPharmaStpFileState((prev) => ({
        ...prev,
        showInlineLoader: false,
        error: response.message || "Failed to fetch next page",
      }));
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    setPharmaStpFileState((prev) => ({
      ...prev,
      showInlineLoader: false,
      error: errorMessage,
    }));
    logError(error as Error, "Error in makePostCallForNextPagesDataFetch");
  }
};
