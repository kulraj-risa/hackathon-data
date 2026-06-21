import {
  fetchPharmaStpFileData,
  PharmaStpFileApiResponse,
} from "../../../api/bigQuery/pharmaStpFileOrders";
import { PharmaStpFileModel } from "../../../data-model/nycbsPharmaOrder";
import { logError } from "../../../utils/customLogger";
import { PharmaStpFileFilterPayload } from "../hooks/useFilterPayload";
import { PharmaStpFileTableState } from "../hooks/usePharmaStpFileTableData";

/**
 * makePostCallForPharmaStpFile - API Call for Filter/Search Changes
 *
 * Purpose: Fetches data when filters or search term changes.
 * Resets tableData to new results and increments pagination reset count.
 *
 * @param payload - Filter payload containing search params
 * @param setPharmaStpFileState - State setter for API response
 * @param setTableData - State setter for table data
 * @param setPaginationResetCount - Function to reset pagination
 */
export const makePostCallForPharmaStpFile = async (
  payload: PharmaStpFileFilterPayload,
  setPharmaStpFileState: React.Dispatch<
    React.SetStateAction<PharmaStpFileTableState>
  >,
  setTableData: React.Dispatch<React.SetStateAction<PharmaStpFileModel[]>>,
  setPaginationResetCount: React.Dispatch<React.SetStateAction<number>>,
): Promise<void> => {
  try {
    setPharmaStpFileState((prev) => ({
      ...prev,
      loading: true,
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
      setTableData(response.rows);

      // Reset pagination to page 1 when filters/search change
      setPaginationResetCount((prev) => prev + 1);
    } else {
      setPharmaStpFileState((prev) => ({
        ...prev,
        loading: false,
        error: response.message || "Failed to fetch data",
      }));
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    setPharmaStpFileState((prev) => ({
      ...prev,
      loading: false,
      error: errorMessage,
    }));
    logError(error as Error, "Error in makePostCallForPharmaStpFile");
  }
};
