import { createUserWithEmailAndPassword } from "firebase/auth";
import { firebaseAuth } from "../../../api/firebase/firestoreService";
import { UserInput } from "../../../data-model/firebaseAuthModel";
import { AppDispatch } from "../../store/store";
import {
  loginStart,
  resetAllStates,
  signUpFailure,
  signUpSuccess,
} from "../auth-slice";

export const signUpUserInFirebase =
  (userInput: UserInput) => async (dispatch: AppDispatch) => {
    dispatch(resetAllStates());
    dispatch(loginStart());
    try {
      const userCredential = await createUserWithEmailAndPassword(
        firebaseAuth,
        userInput.email,
        userInput.password,
      );
      dispatch(signUpSuccess());
      return userCredential.user;
    } catch (error) {
      if (error instanceof Error) {
        dispatch(signUpFailure(error.message));
      } else {
        dispatch(signUpFailure("An unknown error occurred."));
      }
      return;
    }
  };
