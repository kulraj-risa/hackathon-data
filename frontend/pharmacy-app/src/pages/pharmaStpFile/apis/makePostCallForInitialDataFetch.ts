import {
  fetchPharmaStpFileData,
  PharmaStpFileApiResponse,
} from "../../../api/bigQuery/pharmaStpFileOrders";
import { PharmaStpFileModel } from "../../../data-model/nycbsPharmaOrder";
import { logError } from "../../../utils/customLogger";
import { PharmaStpFileFilterPayload } from "../hooks/useFilterPayload";
import { PharmaStpFileTableState } from "../hooks/usePharmaStpFileTableData";

/**
 * makePostCallForInitialDataFetch - API Call for Initial Load
 *
 * Purpose: Fetches initial data when component mounts.
 * This is called once on component mount to load the first page of data.
 *
 * @param payload - Filter payload containing search params
 * @param setPharmaStpFileState - State setter for API response
 * @param setTableData - State setter for table data
 */
export const makePostCallForInitialDataFetch = async (
  payload: PharmaStpFileFilterPayload,
  setPharmaStpFileState: React.Dispatch<
    React.SetStateAction<PharmaStpFileTableState>
  >,
  setTableData: React.Dispatch<React.SetStateAction<PharmaStpFileModel[]>>,
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
    logError(error as Error, "Error in makePostCallForInitialDataFetch");
  }
};
