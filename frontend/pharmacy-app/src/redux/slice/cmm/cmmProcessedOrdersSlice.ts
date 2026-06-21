import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { orderBy, QueryConstraint, Timestamp, where } from "firebase/firestore";
import moment from "moment";
import { getInternalProcessedOrderStatus } from "../../../api/bigQuery/nycbsPharmaOrders";
import { FirestoreService } from "../../../api/firebase/firestoreService";
import { FirestoreCollectionReference } from "../../../api/firebase/references";
import {
  CmmProcessedOrderModel,
  CmmProcessedResponseModel,
  mapDataToCmmProcessedOrderModel,
} from "../../../data-model/cmmProcessedOrderModel";
import { LocalStorageKeys } from "../../../enums/localStorageKeys";
import { logDataToConsole } from "../../../utils/customLogger";
import { getItemFromLocalStorage } from "../../../utils/localStorageHelper";

interface CmmProcessedOrdersState {
  data: CmmProcessedOrderModel[] | null;
  loading: boolean;
  lastVisible: any;
  currentlyLoadedCount: number;
  totalDocuments: number;
  appendingOrders: boolean;
  error: string | null;
  lastDayData: CmmProcessedOrderModel[] | null;
  last3DaysData: CmmProcessedOrderModel[] | null;
  currentDateData: CmmProcessedOrderModel[] | null;
  countDataLoading: boolean;
}

const initialState: CmmProcessedOrdersState = {
  data: null,
  loading: false,
  lastVisible: null,
  currentlyLoadedCount: 0,
  totalDocuments: 0,
  appendingOrders: false,
  error: null,
  lastDayData: null,
  last3DaysData: null,
  currentDateData: null,
  countDataLoading: false,
};

const cmmProcessedOrdersSlice = createSlice({
  name: "cmmProcessedOrders",
  initialState,
  reducers: {
    setCmmProcessedOrders: (state, action) => {
      state.data = action.payload;
      state.loading = false;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
      state.appendingOrders = false;
    },
    setFetchingStart: (state) => {
      state.loading = true;
      state.error = null;
      state.appendingOrders = false;
      state.data = null;
    },
    resetPagination: (state) => {
      state.lastVisible = null;
      state.data = null;
      state.totalDocuments = 0;
    },
    setTotalDocuments: (state, action: PayloadAction<number>) => {
      state.totalDocuments = action.payload;
    },
    setAppendingOrders: (state) => {
      state.appendingOrders = true;
    },
    setLastVisible: (state, action: PayloadAction<any>) => {
      state.lastVisible = action.payload;
    },
    appendOrdersData: (state, action) => {
      state.loading = false;
      state.appendingOrders = false;
      state.data = action.payload;
    },
    setCurrentlyLoadedCount: (state, action: PayloadAction<number>) => {
      state.currentlyLoadedCount = action.payload;
    },
    appendCmmProcessesOrders: (
      state,
      action: PayloadAction<CmmProcessedOrderModel[]>,
    ) => {
      state.data = [
        ...(state.data as CmmProcessedOrderModel[]),
        ...action.payload,
      ];
      state.currentlyLoadedCount = state.data?.length ?? 0;
    },

    setinLineLoader: (state, action: PayloadAction<boolean>) => {
      state.appendingOrders = action.payload;
    },
    setCountDataLoading: (state, action: PayloadAction<boolean>) => {
      state.countDataLoading = action.payload;
    },
    setLastDayData: (
      state,
      action: PayloadAction<CmmProcessedOrderModel[]>,
    ) => {
      state.lastDayData = action.payload;
    },
    setLast3DaysData: (
      state,
      action: PayloadAction<CmmProcessedOrderModel[]>,
    ) => {
      state.last3DaysData = action.payload;
    },
    setCurrentDateData: (
      state,
      action: PayloadAction<CmmProcessedOrderModel[]>,
    ) => {
      state.currentDateData = action.payload;
    },
  },
});

export const {
  setCmmProcessedOrders,
  setError,
  setCurrentlyLoadedCount,
  setFetchingStart,
  setLastVisible,
  setLoading,
  resetPagination,
  setTotalDocuments,
  setAppendingOrders,
  appendCmmProcessesOrders,
  setinLineLoader,
  appendOrdersData,
  setCountDataLoading,
  setLastDayData,
  setLast3DaysData,
  setCurrentDateData,
} = cmmProcessedOrdersSlice.actions;

export default cmmProcessedOrdersSlice.reducer;

// FUNCTION TO FETCH TOTAL DOCUMENTS COUNT
export const fetchTotalDocumentsCount =
  (orgId: string, queryConstraints?: QueryConstraint[]) => async (dispatch) => {
    try {
      const allDocs =
        await FirestoreService.getDocumentsByQuery<CmmProcessedResponseModel>(
          FirestoreCollectionReference.cmmProcessedOrders(),
          queryConstraints ?? [],
        );

      dispatch(setTotalDocuments(allDocs.length));
    } catch (error) {
      logDataToConsole("Error fetching total document count", error);
      return 0;
    }
  };

export const fetechCmmProcessOrdersFromDb =
  (pageNumber: number, pageSize: number) => async (dispatch, getState) => {
    const { cmmProcessedOrders } = getState();
    const selectedOrganization =
      getItemFromLocalStorage(LocalStorageKeys.HEALTHCARE_FACILITY_ID) ?? "";
    const { loading, appendingOrders } = cmmProcessedOrders;
    if (loading || appendingOrders) return;
    dispatch(setFetchingStart());
    try {
      const response = await getInternalProcessedOrderStatus(
        pageNumber,
        pageSize,
        selectedOrganization,
      );
      const { total, page, limit, total_pages, data } = response["details"];
      let finalMappedData = [];
      if (data && data.length > 0) {
        finalMappedData = data.map((item) => {
          return mapDataToCmmProcessedOrderModel(item);
        });
      }
      dispatch(
        setCmmProcessedOrders({
          total,
          page,
          limit,
          total_pages,
          data: finalMappedData,
        }),
      );
    } catch (error) {
      dispatch(setError(error));
    }
  };

// FUNCTION TO FETCH CMM PROCESSED ORDERS USING FIREBASE

export const fetchcmmProcessedOrders =
  (orgId: string, pageSize: number) => async (dispatch, getState) => {
    const { cmmProcessedOrders } = getState();
    if (cmmProcessedOrders.loading) return;

    dispatch(setLoading(true));
    dispatch(resetPagination());

    const extraConstraints: QueryConstraint[] = [
      orderBy("created_at", "desc"),
      where("org_id", "==", orgId),
    ];

    try {
      FirestoreService.paginateQuery<CmmProcessedResponseModel>(
        FirestoreCollectionReference.cmmProcessedOrders(),
        pageSize,
        ({ docs, lastVisible }) => {
          let finalData: CmmProcessedOrderModel[] = [];
          if (docs && docs.length > 0) {
            finalData = docs.map((item) => {
              return mapDataToCmmProcessedOrderModel(item);
            });
          }
          dispatch(setCmmProcessedOrders(finalData));
          dispatch(setCurrentlyLoadedCount(docs.length));
          dispatch(setLastVisible(lastVisible));
          dispatch(fetchTotalDocumentsCount(orgId, extraConstraints));
        },
        (error) => {
          dispatch(setError(error.message));
        },
        undefined,
        extraConstraints,
      );
    } catch (error) {
      logDataToConsole("Error in fetchcmmProcessedOrders", error);
      dispatch(setError(error as string));
    }
  };

export const fetchNextPageOfCmmProcessedOrders =
  (pageSize: number) => async (dispatch, getState) => {
    const { cmmProcessedOrders } = getState();
    const selectedOrganization =
      getItemFromLocalStorage(LocalStorageKeys.HEALTHCARE_FACILITY_ID) ?? "";
    const { loading, appendingOrders, data: oldData } = cmmProcessedOrders;
    const { page, limit, total_pages } = oldData;
    const isNextPageAvailable = page < total_pages;
    if (loading || appendingOrders || !isNextPageAvailable) return;
    dispatch(setAppendingOrders());
    try {
      const { page: currentPage } = oldData;
      const response = await getInternalProcessedOrderStatus(
        currentPage + 1,
        pageSize,
        selectedOrganization,
      );
      const { total, page, limit, total_pages, data } = response["details"];
      let finalMappedData = [];
      if (data && data.length > 0) {
        finalMappedData = data.map((item) => {
          return mapDataToCmmProcessedOrderModel(item);
        });
      }
      dispatch(
        appendOrdersData({
          data: [...(oldData?.data ?? []), ...finalMappedData],
          total,
          page,
          limit,
          total_pages,
        }),
      );
    } catch (error) {
      dispatch(setError(error));
    }
  };

export const fetchCmmProcessedOrdersAfterSearch =
  (orgId: string, searchTerm?: string) => async (dispatch, getState) => {
    const { cmmProcessedOrders } = getState();
    if (cmmProcessedOrders.loading) return;

    dispatch(setLoading(true));
    dispatch(resetPagination());

    const searchqueryConstraints: QueryConstraint[] = [
      where("org_id", "==", orgId),
      orderBy("created_at", "desc"),
    ];

    if (searchTerm) {
      searchqueryConstraints.push(where("patient_mrn", "==", searchTerm));
    }

    try {
      const unsubscribe =
        FirestoreService.fetchQueryCollection<CmmProcessedOrderModel>(
          FirestoreCollectionReference.cmmProcessedOrders(),
          (data) => {
            let finalData: CmmProcessedOrderModel[] = [];
            if (data && data.length > 0) {
              finalData = data.map((item) => {
                return mapDataToCmmProcessedOrderModel(item);
              });
            }
            dispatch(setCmmProcessedOrders(finalData));
            dispatch(fetchTotalDocumentsCount(orgId, searchqueryConstraints));
          },
          (error) => {
            dispatch(setError(error.message));
          },
          ...searchqueryConstraints,
        );

      return unsubscribe;
    } catch (error) {
      dispatch(setError(error as string));
    }
  };

export const fetchMoreCmmProcessedOrders =
  (orgId: string, pageSize: number) => async (dispatch, getState) => {
    const { cmmProcessedOrders } = getState();

    if (
      cmmProcessedOrders.loading ||
      cmmProcessedOrders.appendingCmmProcessesOrders ||
      cmmProcessedOrders.currentlyLoadedCount ==
        cmmProcessedOrders.totalDocuments
    ) {
      return;
    }

    dispatch(setinLineLoader(true));

    const extraConstraints: QueryConstraint[] = [
      orderBy("created_at", "desc"),
      where("org_id", "==", orgId),
    ];

    try {
      const unsubscribe =
        FirestoreService.paginateQuery<CmmProcessedResponseModel>(
          FirestoreCollectionReference.cmmProcessedOrders(),
          pageSize,
          ({ docs, lastVisible }) => {
            let finalData: CmmProcessedOrderModel[] = [];
            if (docs && docs.length > 0) {
              finalData = docs.map((item) => {
                return mapDataToCmmProcessedOrderModel(item);
              });
            }
            dispatch(appendCmmProcessesOrders(finalData));
            dispatch(setLastVisible(lastVisible));
            dispatch(setinLineLoader(false));
          },
          (error) => {
            dispatch(setError(error.message));
            dispatch(setinLineLoader(false));
          },
          cmmProcessedOrders.lastVisible,
          extraConstraints,
        );

      return unsubscribe;
    } catch (error) {
      dispatch(setError(error as string));
      dispatch(setinLineLoader(false));
    }
  };

export const fetchCountData = (orgId: string) => async (dispatch, getState) => {
  const { cmmProcessedOrders } = getState();
  if (cmmProcessedOrders.countDataLoading) return;

  dispatch(setCountDataLoading(true));
  try {
    // Get current date range for today (start and end of day)

    const startOfToday = moment().startOf("day").toDate();
    const endOfToday = moment().endOf("day").toDate();

    // Convert to Firebase Timestamps
    const todayStart = Timestamp.fromDate(startOfToday);
    const todayEnd = Timestamp.fromDate(endOfToday);

    // Get timestamps for last day and last 3 days
    const startOfYesterday = moment()
      .subtract(1, "day")
      .startOf("day")
      .toDate();
    const endOfYesterday = moment().subtract(1, "day").endOf("day").toDate();
    const threeDaysAgo = moment().subtract(3, "day").toDate();
    const startOfYesterdayTimestamp = Timestamp.fromDate(startOfYesterday);
    const endOfYesterdayTimestamp = Timestamp.fromDate(endOfYesterday);
    const threeDaysAgoTimestamp = Timestamp.fromDate(threeDaysAgo);

    const [todaysCount, last3DaysCount, lastDayCount] = await Promise.all([
      FirestoreService.getDocumentsByQuery<CmmProcessedResponseModel>(
        FirestoreCollectionReference.cmmProcessedOrders(),
        [
          where("org_id", "==", orgId),
          where("created_at", ">=", todayStart),
          where("created_at", "<=", todayEnd),
        ],
      ),
      FirestoreService.getDocumentsByQuery<CmmProcessedResponseModel>(
        FirestoreCollectionReference.cmmProcessedOrders(),
        [
          where("org_id", "==", orgId),
          where("created_at", ">=", threeDaysAgoTimestamp),
        ],
      ),
      FirestoreService.getDocumentsByQuery<CmmProcessedResponseModel>(
        FirestoreCollectionReference.cmmProcessedOrders(),
        [
          where("org_id", "==", orgId),
          where("created_at", ">=", startOfYesterdayTimestamp),
          where("created_at", "<=", endOfYesterdayTimestamp),
        ],
      ),
    ]);
    dispatch(setCurrentDateData(todaysCount as CmmProcessedOrderModel[]));
    dispatch(setLast3DaysData(last3DaysCount as CmmProcessedOrderModel[]));
    dispatch(setLastDayData(lastDayCount as CmmProcessedOrderModel[]));
    dispatch(setCountDataLoading(false));
  } catch (error) {
    dispatch(setError(error as string));
    dispatch(setCountDataLoading(false));
  }
};

export const hasMoreDataToLoad = (state, endIndex: number) => {
  const { cmmProcessedOrders } = state;

  return (
    cmmProcessedOrders.currentlyLoadedCount <
      cmmProcessedOrders.totalDocuments &&
    endIndex == cmmProcessedOrders.currentlyLoadedCount - 1
  );
};
