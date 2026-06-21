import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Order } from "risa-data-model";

import { QueryConstraint } from "firebase/firestore";

import { FirestoreService } from "../../../api/firebase/firestoreService";
import { FirestoreCollectionReference } from "../../../api/firebase/references";

interface OrderSDetails {
  data?: Order[] | null;
  count: number | null;
  loading: boolean;
  countLoading?: boolean;
  error: string | null;
}

const initialState: OrderSDetails = {
  data: null,
  loading: false,
  error: null,
  countLoading: false,
  count: null,
};

const ordersDetailsSlice = createSlice({
  name: "ordersDetails",
  initialState,
  reducers: {
    fetchOrdersStart(state) {
      state.loading = true;
      state.error = null;
    },
    appendOrders(state, action: PayloadAction<Order[]>) {
      state.data = state.data
        ? [...state.data, ...action.payload]
        : action.payload;
    },
    fetchOrdersSuccess(state, action: PayloadAction<Order[]>) {
      state.data = action.payload;
      state.loading = false;
    },
    fetchOrdersFailure(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.loading = false;
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
    resetOrders(state) {
      state.data = null;
      state.loading = false;
      state.error = null;
    },
    fetchSearchedOrders(state, action: PayloadAction<Order[]>) {
      state.data = action.payload;
      state.loading = false;
    },
  },
});

export const {
  fetchOrdersStart,
  fetchOrdersSuccess,
  fetchOrdersFailure,
  resetOrders,
  appendOrders,
  addCounts,
  fetchSearchedOrders,
  startFetchingCounts,
} = ordersDetailsSlice.actions;

export const fetchOrdersFromFirebase =
  (limitingValue?: number, ...queryConstraints: QueryConstraint[]) =>
  async (dispatch) => {
    dispatch(fetchOrdersStart());
    const unsubscribe =
      FirestoreService.listenToQueryCollectionForFirstBatch<Order>(
        FirestoreCollectionReference.orders(),
        limitingValue || 10,
        (orders) => {
          dispatch(fetchOrdersSuccess(orders));
        },
        (error) => {
          dispatch(fetchOrdersFailure(error.message));
        },
        ...queryConstraints,
      );

    return unsubscribe;
  };

export const getSearchResultFromFirebase =
  (...queryConstraints: QueryConstraint[]) =>
  async (dispatch) => {
    dispatch(fetchOrdersStart());
    const unsubscribe = FirestoreService.listenToQueryCollection<Order>(
      FirestoreCollectionReference.orders(),
      (orders) => {
        dispatch(fetchSearchedOrders(orders));
        dispatch(fetchOrdersCountFromFirebase(...queryConstraints));
      },
      (error) => {
        dispatch(fetchOrdersFailure(error.message));
      },
      ...queryConstraints,
    );
    return unsubscribe;
  };

export const fetchNextOrderFromFirebase =
  (limitingValue?: number, ...queryConstraints: QueryConstraint[]) =>
  async (dispatch) => {
    const unsubscribe =
      FirestoreService.listenToQueryCollectionForFirstBatch<Order>(
        FirestoreCollectionReference.orders(),
        limitingValue || 10,
        (orders) => {
          dispatch(fetchOrdersSuccess(orders));
        },
        (error) => {
          dispatch(fetchOrdersFailure(error.message));
        },
        ...queryConstraints,
      );

    return unsubscribe;
  };

export const fetchOrdersCountFromFirebase =
  (...queryConstraints: QueryConstraint[]) =>
  async (dispatch) => {
    dispatch(startFetchingCounts());
    const unsubscribe = await FirestoreService.getAllDocumentCount(
      FirestoreCollectionReference.orders(),
      ...queryConstraints,
    );

    dispatch(addCounts(unsubscribe));
    return unsubscribe;
  };

export default ordersDetailsSlice.reducer;
