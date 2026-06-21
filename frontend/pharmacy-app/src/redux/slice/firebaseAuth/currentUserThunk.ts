import { datadogRum } from "@datadog/browser-rum";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { firebaseAuth } from "../../../api/firebase/firestoreService";
import { LocalStorageKeys } from "../../../enums/localStorageKeys";
import { setItemInLocalStorage } from "../../../utils/localStorageHelper";
import { AppDispatch } from "../../store/store";
import {
  checkingLoggedInUser,
  loginSuccess,
  resetAllStates,
} from "../auth-slice";

const ALLOWED_DOMAIN = "risalabs.ai";

export const getCurrentUser = () => async (dispatch: AppDispatch) => {
  let unsubscribeAuthStateChanged: (() => void) | null = null;
  dispatch(checkingLoggedInUser());
  unsubscribeAuthStateChanged = onAuthStateChanged(firebaseAuth, (user) => {
    if (user) {
      const email = user.email?.toLowerCase() ?? "";
      if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
        signOut(firebaseAuth);
        datadogRum.setUser({});
        dispatch(resetAllStates());
        return;
      }

      const userDetails = {
        email: user.email,
        id: user.uid,
      };

      datadogRum.setUser({
        id: userDetails.id ?? "",
        email: userDetails.email ?? "",
      });

      dispatch(loginSuccess(userDetails));
      setItemInLocalStorage(LocalStorageKeys.USER_ID, userDetails.id);
    } else {
      datadogRum.setUser({});
      dispatch(resetAllStates());
    }
  });
};
