import { datadogRum } from "@datadog/browser-rum";
import { signOut } from "firebase/auth";
import { firebaseAuth } from "../../../api/firebase/firestoreService";
import { logError } from "../../../utils/customLogger";
import { AppDispatch } from "../../store/store";
import { logOutError } from "../auth-slice";
import { resetAllAppStates } from "./resetAllStateThunk";

export const logOutUserFromFirebase = () => async (dispatch: AppDispatch) => {
  let unsubscribeAuthStateChanged: (() => void) | null = null;
  try {
    if (unsubscribeAuthStateChanged) {
      unsubscribeAuthStateChanged = null;
    }

    datadogRum.setUser({});

    await signOut(firebaseAuth);
    clearDataFromStorage();
    dispatch(resetAllAppStates());
  } catch (error) {
    logError(error as Error, "Error during sign out");
    if (error instanceof Error) {
      dispatch(logOutError(error.message));
    } else {
      const errorMessage = "An unknown error occurred during logout.";
      dispatch(logOutError(errorMessage));
    }
  }
};

export const clearDataFromStorage = () => {
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (error) {
    logError(error as Error, "Error clearing localStorage and sessionStorage");
  }
};
