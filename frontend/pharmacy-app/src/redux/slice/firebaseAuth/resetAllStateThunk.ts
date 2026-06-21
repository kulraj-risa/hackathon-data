import { AppDispatch } from "../../store/store";
import {
  resetAllPasswordStates,
  resetAllStates,
  resetMfaSetup,
} from "../auth-slice";
import { resetCmmFormConfig } from "../cmm/cmmFormConfig";
import { resetCmmOrders } from "../cmm/cmmOrdersSlice";
import { resetCmmSingleOrder } from "../cmm/cmmSingleOrderSlice";
import { resetPharmaQuestions } from "../cmm/pharmaQuestionsSlice";
import { resetFacilityPlan } from "../facilitySlice";
import { resetFormOptions } from "../formOptionsSlice";
import { resetDocuments } from "../nycbsPharmaExternal/nycbsDocumentsSlice";
import { resetNycbsPharmaCompletedOrders } from "../nycbsPharmaExternal/nycbsPharmaCompletedOrder";
import { resetNycbsPharmaOrders } from "../nycbsPharmaExternal/nycbsPharmaOrder";
import { resetProviderDetails } from "../providerDetailsSlice";
import { resetProviders } from "../providerSlice";
import { clearDataFromStorage } from "./logOutThunk";

export const resetAllAppStates = () => (dispatch: AppDispatch) => {
  dispatch(resetAllStates());
  dispatch(resetProviderDetails());
  dispatch(resetProviders());
  dispatch(resetFacilityPlan());
  dispatch(resetPharmaQuestions());
  dispatch(resetCmmOrders());
  dispatch(resetCmmSingleOrder());
  dispatch(resetFormOptions());
  dispatch(resetCmmFormConfig());
  dispatch(resetNycbsPharmaOrders());
  dispatch(resetNycbsPharmaCompletedOrders());
  dispatch(resetDocuments());
  dispatch(resetMfaSetup());
  clearDataFromStorage();
};

export const resetAllPasswordRelatedStates =
  () => async (dispatch: AppDispatch) => {
    dispatch(resetAllPasswordStates());
  };
