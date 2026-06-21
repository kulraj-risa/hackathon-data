import {
  getMultiFactorResolver,
  MultiFactorError,
  sendEmailVerification,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { controlToastState } from "risa-oasis-ui_v2";
import { firebaseAuth } from "../../../api/firebase/firestoreService";
import { UserInput } from "../../../data-model/firebaseAuthModel";
import { AppDispatch } from "../../store/store";
import {
  loginFailure,
  loginStart,
  mfaVerificationRequired,
  resetAllStates,
  setMfaSetUpRequired,
} from "../auth-slice";
import { checkMFAStatus } from "./mfaThunk";

export const loginUserInFirebase =
  (userInput: UserInput) => async (dispatch: AppDispatch) => {
    dispatch(resetAllStates());
    dispatch(loginStart());
    try {
      const userCredential = await signInWithEmailAndPassword(
        firebaseAuth,
        userInput.email,
        userInput.password,
      );

      // Check if email is verified
      if (!userCredential.user.emailVerified) {
        // If not verified, send verification email again
        controlToastState("email-verification-failed");
        await sendEmailVerification(userCredential.user);
        dispatch(loginFailure("Please verify your email before logging in"));
        return { user: userCredential.user, resolver: null };
      }
      const mfaStatus = checkMFAStatus();

      if (!mfaStatus) {
        dispatch(setMfaSetUpRequired());
        return { user: userCredential.user, resolver: null };
      }
    } catch (error) {
      if (error?.["code"].includes("auth/multi-factor-auth-required")) {
        dispatch(mfaVerificationRequired());
        const resolver = getMultiFactorResolver(
          firebaseAuth,
          error as MultiFactorError,
        );
        return { user: null, resolver };
      } else if (error?.["code"].includes("auth/invalid-credential")) {
        dispatch(loginFailure("Invalid email or password."));
        controlToastState("invalid-email-or-password");
      } else {
        dispatch(loginFailure("Something went wrong"));
        controlToastState("login-error");
      }
    }
  };
