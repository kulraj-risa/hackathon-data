import { createSlice } from "@reduxjs/toolkit";
import { fetchBqRecordByIdentifier } from "../../../api/bigQuery/paCasesBigQuery";
import { mapToCoverMyMedsInputModel } from "../../../data-model/cmmInputRequestModel";
import { NycbsPharmaOrderModel } from "../../../data-model/nycbsPharmaOrder";
import { NycbsPharmaOrderKeys } from "../../../enums/nycbsPharmaOrder";
import { mapBqRowToFlatModel } from "../../../utils/mapBqRowToFlatModel";
import { AppDispatch } from "../../store/store";

interface CmmSingleOrderModel {
  data?: NycbsPharmaOrderModel;
  loading: boolean;
  error: string | null;
}

const initialState: CmmSingleOrderModel = {
  data: undefined,
  loading: false,
  error: null,
};

const cmmSingleOrderSlice = createSlice({
  name: "cmmSingleOrderSlice",
  initialState,
  reducers: {
    fetchCmmSingleOrderStart(state) {
      state.loading = true;
      state.error = null;
      state.data = undefined;
    },
    fetchCmmSingleOrderSuccess(state, action) {
      state.data = action.payload;
      state.loading = false;
    },
    fetchCmmSingleOrderFailure(state, action) {
      state.error = action.payload;
      state.loading = false;
    },
    resetCmmSingleOrder(state) {
      state.data = undefined;
      state.loading = false;
      state.error = null;
    },
  },
});

export const { resetCmmSingleOrder, fetchCmmSingleOrderSuccess } =
  cmmSingleOrderSlice.actions;

export const fetchSingleOrderDetailsForCmm =
  (orderId: string) => async (dispatch: AppDispatch, getState) => {
    const { cmmSingleOrder } = getState();
    if (cmmSingleOrder.loading) return;

    dispatch(cmmSingleOrderSlice.actions.fetchCmmSingleOrderStart());

    try {
      const bqRow = await fetchBqRecordByIdentifier(orderId);
      if (bqRow) {
        dispatch(
          cmmSingleOrderSlice.actions.fetchCmmSingleOrderSuccess(
            mapToCoverMyMedsInputModel(mapBqRowToFlatModel(bqRow)),
          ),
        );
      } else {
        dispatch(
          cmmSingleOrderSlice.actions.fetchCmmSingleOrderFailure(
            `No record found in BigQuery for identifier: ${orderId}`,
          ),
        );
      }
    } catch (error) {
      dispatch(
        cmmSingleOrderSlice.actions.fetchCmmSingleOrderFailure(
          "Error fetching order from BigQuery",
        ),
      );
    }
  };

export const updateCmmSingleOrder =
  (data: NycbsPharmaOrderModel) => async (dispatch: AppDispatch, getState) => {
    const { cmmSingleOrder } = getState();
    if (cmmSingleOrder.loading) return;

    const updatedData = mapToCoverMyMedsInputModel(data);

    dispatch(
      cmmSingleOrderSlice.actions.fetchCmmSingleOrderSuccess(updatedData),
    );
  };

const checkIfDataAlreadyExistsInCmmSlice = (getState, orderId) => {
  const { cmmSingleOrder } = getState();
  if (cmmSingleOrder?.data) {
    const data = cmmSingleOrder.data;
    if (data?.[NycbsPharmaOrderKeys.Identifier] === orderId) {
      return true;
    } else {
      return false;
    }
  }
  return false;
};

export const resetSingleOrderData = () => async (dispatch: AppDispatch) => {
  dispatch(cmmSingleOrderSlice.actions.resetCmmSingleOrder());
};

export default cmmSingleOrderSlice.reducer;
