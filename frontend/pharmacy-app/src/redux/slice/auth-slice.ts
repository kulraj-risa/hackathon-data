// TODO: Refactor this file
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { FirebaseAuthState } from "../../data-model/firebaseAuthModel";

const initialState: FirebaseAuthState = {
  user: null,
  signUpError: null,
  loginError: null,
  emailSentError: null,
  isLoading: false,
  emailSent: false,
  passwordReset: false,
  passwordResetError: null,
  passwordResetInProgress: false,
  verifyingUser: null,
  mfaSetupInProgress: false,
  mfaVerificationRequired: false,
  mfaSetUpRequired: false,
  mfaError: null,
};

const firebaseAuthSlice = createSlice({
  name: "firebaseAuth",
  initialState,
  reducers: {
    loginStart(state) {
      state.isLoading = true;
      state.loginError = null;
    },
    loginSuccess(state, action: PayloadAction<any>) {
      state.user = action.payload;
      state.isLoading = false;
      state.verifyingUser = "verified";
    },
    loginFailure(state, action: PayloadAction<string>) {
      state.loginError = action.payload;
      state.isLoading = false;
    },
    signUpFailure(state, action: PayloadAction<string>) {
      state.signUpError = action.payload;
      state.isLoading = false;
    },
    signUpSuccess(state) {
      state.isLoading = false;
    },
    logout(state) {
      state.user = null;
      state.isLoading = false;
      state.verifyingUser = null;
    },
    logOutError(state, action: PayloadAction<string>) {
      state.loginError = action.payload;
      state.isLoading = false;
    },
    resetEmailSent(state) {
      state.emailSent = false;
      state.emailSentError = null;
    },
    resetEmailSend(state) {
      state.emailSent = true;
    },
    resetEmailSendFailure(state, action: PayloadAction<string>) {
      state.emailSentError = action.payload;
    },
    resetAllStates(state) {
      state.user = null;
      state.signUpError = null;
      state.loginError = null;
      state.emailSentError = null;
      state.isLoading = false;
      state.emailSent = false;
      state.passwordReset = false;
      state.passwordResetError = null;
      state.passwordResetInProgress = false;
      state.verifyingUser = "not-verified";
      state.mfaSetupInProgress = false;
      state.mfaVerificationRequired = false;
      state.mfaError = null;
    },
    checkingLoggedInUser(state) {
      state.verifyingUser = "checking";
    },
    passwordResetStart(state) {
      state.passwordResetInProgress = true;
      state.passwordResetError = null;
    },
    passwordResetSuccess(state) {
      state.passwordReset = true;
      state.passwordResetInProgress = false;
    },
    passwordResetFailure(state, action: PayloadAction<string>) {
      state.passwordResetError = action.payload;
      state.passwordResetInProgress = false;
    },
    // MFA related actions
    mfaSetupStart(state) {
      state.mfaSetupInProgress = true;
      state.mfaError = null;
    },
    mfaSetupSuccess(state) {
      state.mfaSetupInProgress = false;
      state.mfaError = null;
      if (state.user) {
        state.user.mfaEnabled = true;
      }
    },
    mfaSetupFailure(state, action: PayloadAction<string>) {
      state.mfaSetupInProgress = false;
      state.mfaError = action.payload;
    },
    mfaVerificationRequired(state) {
      state.mfaVerificationRequired = true;
      state.mfaError = null;
    },
    mfaVerificationSuccess(state) {
      state.mfaVerificationRequired = false;
      state.mfaError = null;
    },
    mfaVerificationFailure(state, action: PayloadAction<string>) {
      state.mfaVerificationRequired = true;
      state.mfaError = action.payload;
    },
    resetAllPasswordStates(state) {
      state.passwordReset = null;
      state.passwordResetError = null;
      state.passwordResetInProgress = false;
    },
    setUser(state, action: PayloadAction<any>) {
      state.user = action.payload;
    },

    setMfaSetUpRequired(state) {
      state.mfaSetUpRequired = true;
    },
    resetMfaSetup(state) {
      state.mfaSetUpRequired = false;
      state.mfaSetupInProgress = false;
      state.mfaVerificationRequired = false;
      state.mfaError = null;
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  signUpFailure,
  logout,
  logOutError,
  resetEmailSent,
  resetEmailSend,
  resetEmailSendFailure,
  resetAllStates,
  checkingLoggedInUser,
  passwordResetStart,
  passwordResetSuccess,
  passwordResetFailure,
  mfaSetupStart,
  mfaSetupSuccess,
  mfaSetupFailure,
  mfaVerificationRequired,
  mfaVerificationSuccess,
  mfaVerificationFailure,
  resetAllPasswordStates,
  signUpSuccess,
  setUser,
  setMfaSetUpRequired,
  resetMfaSetup,
} = firebaseAuthSlice.actions;

export default firebaseAuthSlice.reducer;
