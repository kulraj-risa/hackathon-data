import { updatePassword } from "firebase/auth";
import moment from "moment";
import {
  firebaseAuth,
  FirestoreService,
} from "../../../api/firebase/firestoreService";
import { resetPasswordRateLimiter } from "../../../api/postCall/resetPasswordRateLimiter";
import { AppDispatch } from "../../store/store";
import {
  passwordResetFailure,
  passwordResetStart,
  passwordResetSuccess,
  resetAllStates,
  resetEmailSend,
  resetEmailSendFailure,
} from "../auth-slice";

export const resetPasswordViaEmail =
  (firebaseAuth, email: string) => async (dispatch: AppDispatch) => {
    dispatch(resetAllStates());
    try {
      await resetPasswordRateLimiter(email);
      dispatch(resetEmailSend());
    } catch (error) {
      if (error instanceof Error) {
        dispatch(resetEmailSendFailure(error.message));
      } else {
        dispatch(resetEmailSendFailure("An unknown error occurred."));
      }
    }
  };

export const resetPasswordInFirebase =
  (newPassword: string, uid: string) => async (dispatch: AppDispatch) => {
    dispatch(passwordResetStart());
    try {
      const currentUser = firebaseAuth.currentUser;
      if (currentUser) {
        await updatePassword(currentUser, newPassword);
        await FirestoreService.updateDocument("providers", uid, {
          lastPasswordUpdatedOn: moment().toISOString(),
        });
        dispatch(passwordResetSuccess());
      }
    } catch (error) {
      if (error instanceof Error) {
        dispatch(passwordResetFailure(error.message));
      } else {
        dispatch(passwordResetFailure("An unknown error occurred."));
      }
    }
  };
