import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import {
  fetchUnassignedCmmFormData,
  fetchUniqueNycbsOrders,
  searchCmmOrdersTable,
} from "../../../api/bigQuery/nycbsPharmaOrders";
import {
  NycbsPharmaOrderModel,
  PaginationModel,
} from "../../../data-model/nycbsPharmaOrder";
import { LocalStorageKeys } from "../../../enums/localStorageKeys";
import { PaginationKeys } from "../../../enums/nycbsPharmaOrder";
import { getItemFromLocalStorage } from "../../../utils/localStorageHelper";

export interface NycbsPharmOrders {
  data: NycbsPharmaOrderModel[] | null;
  loading: boolean;
  error: null | any;
  pageData: null | PaginationModel;
  showInLineLoader?: boolean;
}

const initialState: NycbsPharmOrders = {
  data: null,
  loading: false,
  error: null,
  pageData: null,
  showInLineLoader: false,
};

const nycbsPharmaOrderSlice = createSlice({
  name: "nycbsPharmaOrders",
  initialState,
  reducers: {
    fetchingOrders: (state) => {
      state.loading = true;
      state.data = null;
      state.pageData = null;
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
    resetNycbsPharmaOrders: (state) => {
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
    showInLineLoader: (state) => {
      state.showInLineLoader = true;
    },
    hideInLineLoader: (state) => {
      state.showInLineLoader = false;
    },
    updateOrderData: (
      state,
      action: PayloadAction<{
        identifier: string;
        newData: NycbsPharmaOrderModel;
      }>,
    ) => {
      const { identifier, newData } = action.payload;
      if (state.data) {
        const index = state.data.findIndex(
          (order) => order.identifier === identifier,
        );
        if (index !== -1) {
          state.data[index] = newData; // Update the order at the found index
        }
      }
    },
  },
});

export const { resetNycbsPharmaOrders } = nycbsPharmaOrderSlice.actions;

export const fetchNycbsPharmaOrdersFromApi =
  (limit?: number) => async (dispatch, getState) => {
    const { nycbsPharmaOrders } = getState();
    if (nycbsPharmaOrders.loading) {
      return;
    }
    dispatch(nycbsPharmaOrderSlice.actions.fetchingOrders());
    try {
      const results = await fetchUnassignedCmmFormData(1, limit ?? 40);
      const pageData = results["details"]["pagination"];
      const ordersData = results["details"]["rows"];
      dispatch(
        nycbsPharmaOrderSlice.actions.setOrdersData({ ordersData, pageData }),
      );
    } catch (error) {
      dispatch(
        nycbsPharmaOrderSlice.actions.errorFetchingOrders(
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
      const results = await fetchUnassignedCmmFormData(nextPage, limit ?? 40);
      const newPageData = results["details"]["pagination"];
      const newOrdersData = results["details"]["rows"];
      dispatch(
        nycbsPharmaOrderSlice.actions.appendOrdersData({
          ordersData: newOrdersData,
          pageData: newPageData,
        }),
      );
    } catch (error) {
      dispatch(
        nycbsPharmaOrderSlice.actions.errorFetchingOrders(
          "Error fetching orders",
        ),
      );
    }
  };

export const fetchUniqueNycbsOrderesFromApi =
  (limit?: number, filter?: any) => async (dispatch, getState) => {
    const { nycbsPharmaOrders } = getState();
    const selectedOrganization =
      getItemFromLocalStorage(LocalStorageKeys.HEALTHCARE_FACILITY_ID) ?? "";
    if (nycbsPharmaOrders.loading) {
      return;
    }
    dispatch(nycbsPharmaOrderSlice.actions.fetchingOrders());
    try {
      const results = await fetchUniqueNycbsOrders(
        1,
        limit ?? 40,
        filter,
        selectedOrganization,
      );
      const pageData = results["details"]["pagination"];
      const ordersData = results["details"]["rows"];
      dispatch(
        nycbsPharmaOrderSlice.actions.setOrdersData({ ordersData, pageData }),
      );
    } catch (error) {
      dispatch(
        nycbsPharmaOrderSlice.actions.errorFetchingOrders(
          "Error fetching orders",
        ),
      );
    }
  };

export const appendUniqueNycbsOrderesFromApi =
  (limit?: number, filter?: any) => async (dispatch, getState) => {
    const { nycbsPharmaOrders } = getState();
    const selectedOrganization =
      getItemFromLocalStorage(LocalStorageKeys.HEALTHCARE_FACILITY_ID) ?? "";
    const { pageData, loading } = nycbsPharmaOrders;
    if (loading || !pageData || !pageData[PaginationKeys.IsNextPageAvailable]) {
      return;
    }

    try {
      dispatch(nycbsPharmaOrderSlice.actions.showInLineLoader());
      const nextPage = pageData[PaginationKeys.NextPageNumber];
      const results = await fetchUniqueNycbsOrders(
        nextPage,
        limit ?? 40,
        filter,
        selectedOrganization,
      );
      const newPageData = results["details"]["pagination"];
      const newOrdersData = results["details"]["rows"];
      dispatch(
        nycbsPharmaOrderSlice.actions.appendOrdersData({
          ordersData: newOrdersData,
          pageData: newPageData,
        }),
      );
      if (newOrdersData.length === 0) {
        dispatch(appendUniqueNycbsOrderesFromApi(limit ?? 40, filter));
      }
    } catch (error) {
      dispatch(
        nycbsPharmaOrderSlice.actions.errorFetchingOrders(
          "Error fetching orders",
        ),
      );
    } finally {
      dispatch(nycbsPharmaOrderSlice.actions.hideInLineLoader());
    }
  };

export const updateOrder =
  (identifier: string, newData: NycbsPharmaOrderModel) => (dispatch) => {
    dispatch(
      nycbsPharmaOrderSlice.actions.updateOrderData({ identifier, newData }),
    );
  };

export const searchNycbsPharmaOrdersFromApi =
  (keyword: string, limit?: number) => async (dispatch, getState) => {
    dispatch(nycbsPharmaOrderSlice.actions.fetchingOrders());
    try {
      const results = await searchCmmOrdersTable(1, limit ?? 40, keyword);
      const pageData = results["details"]["pagination"];
      const ordersData = results["details"]["rows"];
      dispatch(
        nycbsPharmaOrderSlice.actions.setOrdersData({ ordersData, pageData }),
      );
    } catch (error) {
      dispatch(
        nycbsPharmaOrderSlice.actions.errorFetchingOrders(
          "Error fetching orders",
        ),
      );
    }
  };

export const appendUniqueNycbsSearchedOrderesFromApi =
  (keyword: string, limit?: number) => async (dispatch, getState) => {
    const { nycbsPharmaOrders } = getState();
    const { pageData, loading } = nycbsPharmaOrders;
    if (loading || !pageData || !pageData[PaginationKeys.IsNextPageAvailable]) {
      return;
    }

    try {
      dispatch(nycbsPharmaOrderSlice.actions.showInLineLoader());
      const nextPage = pageData[PaginationKeys.NextPageNumber];
      const results = await searchCmmOrdersTable(
        nextPage,
        limit ?? 40,
        keyword,
      );
      const newPageData = results["details"]["pagination"];
      const newOrdersData = results["details"]["rows"];
      dispatch(
        nycbsPharmaOrderSlice.actions.appendOrdersData({
          ordersData: newOrdersData,
          pageData: newPageData,
        }),
      );
    } catch (error) {
      dispatch(
        nycbsPharmaOrderSlice.actions.errorFetchingOrders(
          "Error fetching orders",
        ),
      );
    } finally {
      dispatch(nycbsPharmaOrderSlice.actions.hideInLineLoader());
    }
  };

export const refetchNycbsPharmaOrdersFromApi =
  (limit?: number) => async (dispatch, getState) => {
    const { nycbsPharmaOrders } = getState();
    const { loading } = nycbsPharmaOrders;
    if (loading) {
      return;
    }

    try {
      const results = await fetchUnassignedCmmFormData(1, limit ?? 40);
      const pageData = results["details"]["pagination"];
      const ordersData = results["details"]["rows"];
      dispatch(
        nycbsPharmaOrderSlice.actions.setOrdersData({ ordersData, pageData }),
      );
    } catch (error) {
      dispatch(
        nycbsPharmaOrderSlice.actions.errorFetchingOrders(
          "Error fetching orders",
        ),
      );
    }
  };

export default nycbsPharmaOrderSlice.reducer;
