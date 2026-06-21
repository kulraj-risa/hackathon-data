import { Action, configureStore, ThunkAction } from "@reduxjs/toolkit";

import firebaseAuthSlice from "../slice/auth-slice";
import authStatusOptionsSlice from "../slice/authStatusOptionsSlice";
import boOptionsSlice from "../slice/boOptionsSlice";
import clientConfigurationSlice from "../slice/clientConfiguration";
import cmmDiffDataSlice from "../slice/cmm/cmmDiffDataSlice";
import cmmFormConfig from "../slice/cmm/cmmFormConfig";
import cmmFormDiffTableDataSlice from "../slice/cmm/cmmFormDiffTableDataSlice";
import cmmOrdersSlice from "../slice/cmm/cmmOrdersSlice";
import cmmProcessedOrdersSlice from "../slice/cmm/cmmProcessedOrdersSlice";
import cmmSingleOrderSlice from "../slice/cmm/cmmSingleOrderSlice";
import diagnosisDetailsSlice from "../slice/cmm/dignosisDetailsSlice";
import insuranceDetailsSlice from "../slice/cmm/insuranceDetailsSlice";
import patientEligibilitySlice from "../slice/cmm/patientEligibilitySlice";
import pharmaQuestionsSlice from "../slice/cmm/pharmaQuestionsSlice";
import prescriptionSlice from "../slice/cmm/prescriptionSlice";
import uniqueDrugnameSlice from "../slice/cmm/uniqueDrugnameSlice";
import uniqueFormNameSlice from "../slice/cmm/uniqueFormNameSlice";
import nycbsSentToPlanSlice from "../slice/configurations/nycbsSentToPlanSlice";
import { credentialsConfigSlice } from "../slice/credentialConfigSlice";
import documentsConfigurationSlice from "../slice/documentsConfiguration";
import drugConfigSlice from "../slice/drugConfigSlice";
import facilitySlice from "../slice/facilitySlice";
import fileUploadSlice from "../slice/fileUploadSliceNew";
import filterValuesSlice from "../slice/filterValuesSlice";
import formConfigNoLiveListenSlice from "../slice/formConfigNoLiveListenSlice";
import formConfigSlice from "../slice/formConfigSlice";
import formOptionsSlice from "../slice/formOptionsSlice";
import healthFacilitySlice from "../slice/healthFacilitySlice";
import medicineNameConfigSlice from "../slice/medicineNameConfigSlice";
import modalSliceNew from "../slice/modalSliceNew";
import nestedDocumentsSlice from "../slice/nestedDocumentsSlice";
import nycbsDocumentsSlice from "../slice/nycbsPharmaExternal/nycbsDocumentsSlice";
import nycbsPharmaCompletedOrder from "../slice/nycbsPharmaExternal/nycbsPharmaCompletedOrder";
import nycbsPharmaOrder from "../slice/nycbsPharmaExternal/nycbsPharmaOrder";
import nycbsClaimsPaSlice from "../slice/ordersSlice/nycbsClaimsPaSlice";
import orderSlice from "../slice/ordersSlice/order-slice";
import organizationNewSlice from "../slice/organizationNewSlice";
import { paFormConfigurationSlice } from "../slice/paFormConfigSlice";
import parsedInsuranceSlice from "../slice/parsedInsuranceSlice";
import { pbmConfigurationsSlice } from "../slice/pbmConfigurationSlice";
import { prescriptionParsingConfigurationSlice } from "../slice/prescriptionParsingConfigSlice copy";
import providerDetailsSlice from "../slice/providerDetailsSlice";
import providerSlice from "../slice/providerSlice";
import singleMedicalPaFormConfigSlice from "../slice/singlePaFormConfigSlice";
import submissionDocsSlice from "../slice/submissionDocsSlice";

export interface DataState<T> {
  loading: boolean;
  error: string | null;
  data: T | null;
}

const store = configureStore({
  reducer: {
    order: orderSlice,
    firebaseAuthentication: firebaseAuthSlice,
    providerDetails: providerDetailsSlice,
    allProviders: providerSlice,
    facilitySlice: facilitySlice,
    pharmaQuestions: pharmaQuestionsSlice,
    cmmOrders: cmmOrdersSlice,
    cmmSingleOrder: cmmSingleOrderSlice,
    formOptions: formOptionsSlice,
    cmmFormConfig: cmmFormConfig,
    submissionDocs: submissionDocsSlice,
    nycbsPharmaOrders: nycbsPharmaOrder,
    nycbsPharmaCompletedOrders: nycbsPharmaCompletedOrder,
    nycbsDocuments: nycbsDocumentsSlice,
    prescription: prescriptionSlice,
    insuranceDetails: insuranceDetailsSlice,
    diagnosisDetails: diagnosisDetailsSlice,
    patientEligibility: patientEligibilitySlice,
    nycbsClaimsPa: nycbsClaimsPaSlice,
    filterValues: filterValuesSlice,
    cmmProcessedOrders: cmmProcessedOrdersSlice,
    cmmDiffData: cmmDiffDataSlice,
    cmmFormDiffTableData: cmmFormDiffTableDataSlice,
    formConfig: formConfigSlice,
    pbmConfigurations: pbmConfigurationsSlice,
    drugConfig: drugConfigSlice,
    uniqueDrugname: uniqueDrugnameSlice,
    uniqueFormName: uniqueFormNameSlice,
    boOptions: boOptionsSlice,
    authStatusOptions: authStatusOptionsSlice,
    formConfigNoLiveListen: formConfigNoLiveListenSlice,
    modalSliceNew: modalSliceNew,
    singleMedicalPaFormConfig: singleMedicalPaFormConfigSlice,
    fileUploading: fileUploadSlice,
    organizationNewSlice: organizationNewSlice,
    nycbsSentToPlanConfig: nycbsSentToPlanSlice,
    parsedInsurance: parsedInsuranceSlice,
    paFormConfig: paFormConfigurationSlice,
    medicineNameConfig: medicineNameConfigSlice,
    healthFacility: healthFacilitySlice,
    nestedDocuments: nestedDocumentsSlice,
    documentsConfiguration: documentsConfigurationSlice,
    prescriptionParsingConfig: prescriptionParsingConfigurationSlice,
    clientConfiguration: clientConfigurationSlice,
    credentialConfig: credentialsConfigSlice,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
