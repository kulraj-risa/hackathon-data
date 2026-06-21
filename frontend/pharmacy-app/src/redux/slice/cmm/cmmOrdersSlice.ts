import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { QueryConstraint } from "firebase/firestore";
import { FirestoreService } from "../../../api/firebase/firestoreService";
import { FirestoreCollectionReference } from "../../../api/firebase/references";
import { CmmOrderModel } from "../../../data-model/cmmOrder";

interface CmmOrdersSliceModel {
  data?: CmmOrderModel[];
  countLoading?: boolean;
  count: number | null;
  loading: boolean;
  error: string | null;
}

const initialState: CmmOrdersSliceModel = {
  data: undefined,
  loading: false,
  error: null,
  countLoading: false,
  count: null,
};

const cmmOrdersSlice = createSlice({
  name: "cmmOrdersSlice",
  initialState,
  reducers: {
    fetchCmmOrdersStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchCmmOrdersSuccess(state, action) {
      state.data = action.payload;
      state.loading = false;
    },
    fetchCmmOrdersFailure(state, action) {
      state.error = action.payload;
      state.loading = false;
    },
    resetCmmOrders(state) {
      state.data = undefined;
      state.loading = false;
      state.error = null;
      state.countLoading = false;
      state.count = null;
    },
    startFetchingCounts(state) {
      state.countLoading = true;
      state.error = null;
      state.count = 0;
    },
    addCounts(state, action: PayloadAction<number>) {
      state.count = action.payload;
      state.countLoading = false;
    },
  },
});

export const { resetCmmOrders } = cmmOrdersSlice.actions;

export const fetchAllCmmOrdersFromFirebase =
  (
    limitingValue?: number,
    isNextBatch?: boolean,
    ...queryConstraints: QueryConstraint[]
  ) =>
  async (dispatch) => {
    !isNextBatch && dispatch(cmmOrdersSlice.actions.fetchCmmOrdersStart());
    const unsubscribe =
      FirestoreService.listenToQueryCollectionForFirstBatch<CmmOrderModel>(
        FirestoreCollectionReference.oncoEmrOrders(),
        limitingValue || 10,
        (orders) => {
          dispatch(fetchCmmOrdersCountFromFirebase(...queryConstraints));
          dispatch(cmmOrdersSlice.actions.fetchCmmOrdersSuccess(orders));
        },
        (error) => {
          dispatch(cmmOrdersSlice.actions.fetchCmmOrdersFailure(error.message));
        },
        ...queryConstraints,
      );

    return unsubscribe;
  };

export const getSearchResultFromFirebaseForCmmOrders =
  (...queryConstraints: QueryConstraint[]) =>
  async (dispatch) => {
    dispatch(cmmOrdersSlice.actions.fetchCmmOrdersStart());
    const unsubscribe = FirestoreService.listenToQueryCollection<CmmOrderModel>(
      FirestoreCollectionReference.oncoEmrOrders(),
      (orders) => {
        dispatch(cmmOrdersSlice.actions.fetchCmmOrdersSuccess(orders));
        dispatch(fetchCmmOrdersCountFromFirebase(...queryConstraints));
      },
      (error) => {
        dispatch(cmmOrdersSlice.actions.fetchCmmOrdersFailure(error.message));
      },
      ...queryConstraints,
    );
    return unsubscribe;
  };

export const fetchCmmOrdersCountFromFirebase =
  (...queryConstraints: QueryConstraint[]) =>
  async (dispatch) => {
    dispatch(cmmOrdersSlice.actions.startFetchingCounts());
    const unsubscribe = await FirestoreService.getAllDocumentCount(
      FirestoreCollectionReference.oncoEmrOrders(),
      ...queryConstraints,
    );

    dispatch(cmmOrdersSlice.actions.addCounts(unsubscribe));
    return unsubscribe;
  };

export default cmmOrdersSlice.reducer;
