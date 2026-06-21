import { createSlice } from "@reduxjs/toolkit";
import { getAllDocumentsForOrder } from "../../../api/bigQuery/nycbsPharmaOrders";
import { fetchBqRecordByIdentifier } from "../../../api/bigQuery/paCasesBigQuery";
import { NycbDocumentModel } from "../../../data-model/nycbsPharmaOrder";
import { AppDispatch } from "../../store/store";

interface NycbDOcumentsSliceModel {
  data?: NycbDocumentModel[];
  loading: boolean;
  error: string | null;
}

const initialState: NycbDOcumentsSliceModel = {
  data: undefined,
  loading: false,
  error: null,
};

const nycbsDocumentsSlice = createSlice({
  name: "nycbsDocumentsSlice",
  initialState,
  reducers: {
    fetchCmmDocumentsStart(state) {
      state.loading = true;
      state.error = null;
      state.data = undefined;
    },
    fetchDocumentsSuccess(state, action) {
      state.data = action.payload;
      state.loading = false;
    },
    fetchDocumentsFailure(state, action) {
      state.error = action.payload;
      state.loading = false;
    },
    resetDocuments(state) {
      state.data = undefined;
      state.loading = false;
      state.error = null;
    },
  },
});

export const { resetDocuments } = nycbsDocumentsSlice.actions;

export const fetchSingleOrderDocs =
  (orderId: string) => async (dispatch: AppDispatch, getState) => {
    const { nycbsDocuments } = getState();
    if (nycbsDocuments.loading) return;

    dispatch(nycbsDocumentsSlice.actions.fetchCmmDocumentsStart());
    try {
      let ordersData: NycbDocumentModel[] | undefined;
      const isDemo = process.env.REACT_APP_FIREBASE_CONFIG === "demo";

      if (!isDemo) {
        try {
          const results = await getAllDocumentsForOrder(orderId);
          ordersData = results["details"];
        } catch {
          // API failed — will try BigQuery fallback below
        }
      }

      if (
        !ordersData ||
        !Array.isArray(ordersData) ||
        ordersData.length === 0
      ) {
        const row = await fetchBqRecordByIdentifier(orderId);
        if (
          row?.documents &&
          Array.isArray(row.documents) &&
          row.documents.length > 0
        ) {
          ordersData = row.documents as NycbDocumentModel[];
        }
      }

      dispatch(
        nycbsDocumentsSlice.actions.fetchDocumentsSuccess(ordersData ?? []),
      );
    } catch (error) {
      dispatch(
        nycbsDocumentsSlice.actions.fetchDocumentsFailure(
          "Error fetching orders",
        ),
      );
    }
  };

export default nycbsDocumentsSlice.reducer;
