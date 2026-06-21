import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  orderBy,
  QueryCompositeFilterConstraint,
  QueryConstraint,
  Timestamp,
  where,
} from "firebase/firestore";
import { FirestoreService } from "../../../api/firebase/firestoreService";
import { FirestoreCollectionReference } from "../../../api/firebase/references";
import { CmmDiffDataModel } from "../../../data-model/cmmDiffData";
import { CmmProcessedResponseModel } from "../../../data-model/cmmProcessedOrderModel";
import { LocalStorageKeys } from "../../../enums/localStorageKeys";
import { createCompositeFilterForCmmFormDiffTable } from "../../../utils/createCompositeFilterForTables";
import { logDataToConsole } from "../../../utils/customLogger";
import { getItemFromLocalStorage } from "../../../utils/localStorageHelper";

interface CmmFormDiffTableDataModel {
  data: CmmProcessedResponseModel[] | null;
  loading: boolean;
  error: string | null;
  lastVisible: any;
  showinLineLoader: boolean;
  totalDocuments: number;
  currentlyLoadedCount: number;
}

const initialState: CmmFormDiffTableDataModel = {
  data: null,
  loading: false,
  error: null,
  lastVisible: null,
  showinLineLoader: false,
  totalDocuments: 0,
  currentlyLoadedCount: 0,
};

const cmmFormDiffTableDataSlice = createSlice({
  name: "cmmFormDiffTableData",
  initialState,
  reducers: {
    setCmmFormDiffTableData: (
      state,
      action: PayloadAction<CmmProcessedResponseModel[]>,
    ) => {
      state.data = action.payload;
      state.currentlyLoadedCount = action.payload.length;
      state.loading = false;
      state.error = null;
    },
    appendCmmFormDiffTableData: (
      state,
      action: PayloadAction<CmmProcessedResponseModel[]>,
    ) => {
      state.data = state.data
        ? [...state.data, ...action.payload]
        : action.payload;
      state.currentlyLoadedCount = state.data.length;
      state.loading = false;
      state.error = null;
      state.showinLineLoader = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
      state.data = null;
    },
    resetCmmFormDiffTableData: (state) => {
      state.data = null;
      state.loading = false;
      state.error = null;
    },

    setInlineLoader: (state, action: PayloadAction<boolean>) => {
      state.showinLineLoader = action.payload;
    },

    setLastVisible: (state, action: PayloadAction<any>) => {
      state.lastVisible = action.payload;
    },
    setTotalDocuments: (state, action: PayloadAction<number>) => {
      state.totalDocuments = action.payload;
    },
    resetPagination: (state) => {
      state.lastVisible = null;
      state.currentlyLoadedCount = 0;
      state.data = null;
      state.totalDocuments = 0;
    },
  },
});

export const {
  setCmmFormDiffTableData,
  appendCmmFormDiffTableData,
  setLoading,
  setError,
  resetCmmFormDiffTableData,
  setInlineLoader,
  setLastVisible,
  setTotalDocuments,
  resetPagination,
} = cmmFormDiffTableDataSlice.actions;

export default cmmFormDiffTableDataSlice.reducer;

export const fetchTotalDocumentsCountForCmmFormDiffTableData =
  (searchTerm?: string) => async (dispatch, getState) => {
    const selectedOrganization =
      getItemFromLocalStorage(LocalStorageKeys.HEALTHCARE_FACILITY_ID) ?? "";
    try {
      const allDocs =
        await FirestoreService.fetchQueryCollectionByCompositeFilter<CmmProcessedResponseModel>(
          FirestoreCollectionReference.cmmWorkflow(),
          createCompositeFilterForCmmFormDiffTable(
            selectedOrganization,
            searchTerm,
          ) as QueryCompositeFilterConstraint,
        );

      dispatch(setTotalDocuments(allDocs.length));
    } catch (error) {
      logDataToConsole("Error fetching total document count", error);
      return 0;
    }
  };

export const fetchCmmFormDiffTableData =
  (pageSize: number) => async (dispatch, getState) => {
    const selectedOrganization =
      getItemFromLocalStorage(LocalStorageKeys.HEALTHCARE_FACILITY_ID) ?? "";

    try {
      if (getState().cmmFormDiffTableData.loading) {
        return;
      }
      dispatch(resetPagination());
      dispatch(setLoading(true));
      const searchqueryConstraints: QueryConstraint[] = [
        where("diff_documents_created", "==", true),
        where("org_id", "==", selectedOrganization),
        orderBy("created_at", "desc"),
      ];

      await dispatch(fetchTotalDocumentsCountForCmmFormDiffTableData());

      FirestoreService.paginateQuery<CmmProcessedResponseModel>(
        FirestoreCollectionReference.cmmWorkflow(),
        pageSize,
        ({ docs, lastVisible }) => {
          dispatch(setCmmFormDiffTableData(docs));
          dispatch(setLastVisible(lastVisible));
        },
        (error) => {
          dispatch(setError(error.message));
        },
        undefined,
        searchqueryConstraints,
      );
    } catch (error) {
      logDataToConsole("Error in fetchingCmmDiffFormDataTable", error);
      dispatch(setError(error as string));
    }
  };

export const fetchMorefetchCmmFormDiffTableData =
  (pageSize: number) => async (dispatch, getState) => {
    const selectedOrganization =
      getItemFromLocalStorage(LocalStorageKeys.HEALTHCARE_FACILITY_ID) ?? "";
    try {
      dispatch(setInlineLoader(true));
      const searchqueryConstraints: QueryConstraint[] = [
        where("diff_documents_created", "==", true),
        where("org_id", "==", selectedOrganization),
        orderBy("created_at", "desc"),
      ];
      FirestoreService.paginateQuery<CmmProcessedResponseModel>(
        FirestoreCollectionReference.cmmWorkflow(),
        pageSize,
        ({ docs, lastVisible }) => {
          dispatch(appendCmmFormDiffTableData(docs));
          dispatch(setLastVisible(lastVisible));
        },
        (error) => {
          dispatch(setError(error.message));
        },
        getState().cmmFormDiffTableData.lastVisible,
        searchqueryConstraints,
      );
    } catch (error) {
      logDataToConsole("Error in fetchingCmmDiffFormDataTable", error);
      dispatch(setError(error as string));
    }
  };

export const fetchCmmFormDiffTableDataAfterSearch =
  (searchTerm: string) => async (dispatch, getState) => {
    const selectedOrganization =
      getItemFromLocalStorage(LocalStorageKeys.HEALTHCARE_FACILITY_ID) ?? "";

    try {
      dispatch(resetPagination());
      dispatch(setLoading(true));

      const allDocs =
        await FirestoreService.fetchQueryCollectionByCompositeFilter<CmmProcessedResponseModel>(
          FirestoreCollectionReference.cmmWorkflow(),
          createCompositeFilterForCmmFormDiffTable(
            selectedOrganization,
            searchTerm,
          ) as QueryCompositeFilterConstraint,
          [orderBy("created_at", "desc")],
        );
      dispatch(setTotalDocuments(allDocs.length));
      dispatch(setCmmFormDiffTableData(allDocs));
    } catch (error) {
      console.error("error", error);
      logDataToConsole("Error in fetchingCmmDiffFormDataTable", error);
      dispatch(setError(error as string));
    }
  };

export const fetchFinalCmmFormDataDocument = async (identifier: string) => {
  try {
    const documents =
      await FirestoreService.getDocumentsByQuery<CmmDiffDataModel>(
        FirestoreCollectionReference.cmmChangesTracking(identifier),
        [orderBy("created_at", "desc")],
      );
    if (documents.length > 1) {
      return documents[0];
    }
    return null;
  } catch (error) {
    logDataToConsole("Error in fetchingFinalCmmFormDataDocument", error);
    return null;
  }
};

export const fetchCmmFormDiffTableDataForDateRange =
  (startDate: Date, endDate: Date) => async (dispatch: any, getState: any) => {
    const selectedOrganization =
      getItemFromLocalStorage(LocalStorageKeys.HEALTHCARE_FACILITY_ID) ?? "";

    try {
      // Convert dates to Firestore Timestamps
      const startTimestamp = Timestamp.fromDate(startDate);

      // For end date, extend to the end of the day to include all data for that date
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      const endTimestamp = Timestamp.fromDate(endOfDay);

      // Check if start and end dates are the same
      const isSameDay = startDate.toDateString() === endDate.toDateString();

      let dateRangeQueryConstraints: QueryConstraint[];

      if (isSameDay) {
        // For same day, create a range that covers the entire day
        const startOfDay = new Date(startDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfSameDay = new Date(endDate);
        endOfSameDay.setHours(23, 59, 59, 999);

        const startOfDayTimestamp = Timestamp.fromDate(startOfDay);
        const endOfSameDayTimestamp = Timestamp.fromDate(endOfSameDay);

        dateRangeQueryConstraints = [
          where("diff_documents_created", "==", true),
          where("org_id", "==", selectedOrganization),
          where("created_at", ">=", startOfDayTimestamp),
          where("created_at", "<=", endOfSameDayTimestamp),
          orderBy("created_at", "desc"),
        ];
      } else {
        // For different dates, ensure end date covers the full day
        const startOfStartDay = new Date(startDate);
        startOfStartDay.setHours(0, 0, 0, 0);

        const startOfStartDayTimestamp = Timestamp.fromDate(startOfStartDay);

        dateRangeQueryConstraints = [
          where("diff_documents_created", "==", true),
          where("org_id", "==", selectedOrganization),
          where("created_at", ">=", startOfStartDayTimestamp),
          where("created_at", "<=", endTimestamp), // This now covers the full end date
          orderBy("created_at", "desc"),
        ];
      }

      const allDocs =
        await FirestoreService.getDocumentsByQuery<CmmProcessedResponseModel>(
          FirestoreCollectionReference.cmmWorkflow(),
          dateRangeQueryConstraints,
        );

      return allDocs;
    } catch (error) {
      logDataToConsole("Error in fetchCmmFormDiffTableDataForDateRange", error);
      throw error;
    }
  };
