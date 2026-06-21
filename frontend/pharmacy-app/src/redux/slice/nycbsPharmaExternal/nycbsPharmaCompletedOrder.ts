import { createSlice } from "@reduxjs/toolkit";
import { fetchAssignedCmmFormDataWithStatus } from "../../../api/bigQuery/nycbsPharmaOrders";
import {
  NycbsPharmaOrderModel,
  PaginationModel,
} from "../../../data-model/nycbsPharmaOrder";
import { PaginationKeys } from "../../../enums/nycbsPharmaOrder";

export interface NycbsPharmaCompletedOrders {
  data: NycbsPharmaOrderModel[] | null;
  loading: boolean;
  error: null | any;
  pageData: null | PaginationModel;
}

const initialState: NycbsPharmaCompletedOrders = {
  data: null,
  loading: false,
  error: null,
  pageData: null,
};

const nycbsPharmaCompletedOrderSlice = createSlice({
  name: "nycbsPharmaCompletedOrders",
  initialState,
  reducers: {
    fetchingOrders: (state) => {
      state.loading = true;
    },
    setOrdersData: (state, action) => {
      const { ordersData, pageData } = action.payload;
      state.data = ordersData;
      state.pageData = pageData;
      state.loading = false;
    },
    errorFetchingOrders: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    resetNycbsPharmaCompletedOrders: (state) => {
      state.data = null;
      state.loading = false;
      state.error = null;
      state.pageData = null;
    },
    appendOrdersData: (state, action) => {
      const { ordersData, pageData } = action.payload;
      state.data = state.data ? [...state.data, ...ordersData] : ordersData;
      state.pageData = pageData;
      state.loading = false;
    },
  },
});

export const { resetNycbsPharmaCompletedOrders } =
  nycbsPharmaCompletedOrderSlice.actions;

export const fetchNycbsPharmaCompletedOrdersFromApi =
  (limit?: number) => async (dispatch, getState) => {
    const { nycbsPharmaOrders } = getState();
    if (nycbsPharmaOrders.loading) {
      return;
    }
    dispatch(nycbsPharmaCompletedOrderSlice.actions.fetchingOrders());
    try {
      const results = await fetchAssignedCmmFormDataWithStatus(1, limit || 40);
      const pageData = results["details"]["pagination"];
      const ordersData = results["details"]["rows"];
      dispatch(
        nycbsPharmaCompletedOrderSlice.actions.setOrdersData({
          ordersData,
          pageData,
        }),
      );
    } catch (error) {
      dispatch(
        nycbsPharmaCompletedOrderSlice.actions.errorFetchingOrders(
          "Error fetching orders",
        ),
      );
    }
  };

export const appendNycbsPharmaOrdersFromApi =
  (limit?: number) => async (dispatch, getState) => {
    const { nycbsPharmaOrders } = getState();
    const { pageData, loading } = nycbsPharmaOrders;
    if (loading || !pageData || !pageData[PaginationKeys.IsNextPageAvailable]) {
      return;
    }

    try {
      const nextPage = pageData[PaginationKeys.NextPageNumber];
      const results = await fetchAssignedCmmFormDataWithStatus(
        nextPage,
        limit ?? 40,
      );
      const newPageData = results["details"]["pagination"];
      const newOrdersData = results["details"]["rows"];
      dispatch(
        nycbsPharmaCompletedOrderSlice.actions.appendOrdersData({
          ordersData: newOrdersData,
          pageData: newPageData,
        }),
      );
    } catch (error) {
      dispatch(
        nycbsPharmaCompletedOrderSlice.actions.errorFetchingOrders(
          "Error fetching orders",
        ),
      );
    }
  };

export default nycbsPharmaCompletedOrderSlice.reducer;
