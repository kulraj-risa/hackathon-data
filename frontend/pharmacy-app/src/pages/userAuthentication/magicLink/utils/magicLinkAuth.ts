// magicLinkAuth.ts
import { sendSignInLinkToEmail } from "firebase/auth";
import { firebaseAuth } from "../../../../api/firebase/firestoreService";
import { makeMagicLinkSignUpCall } from "../../../../api/postCall/magicLinkSignUp";
import { generateValidUrl } from "./getValidUrl";

const actionCodeSettings = {
  url: generateValidUrl(),
  handleCodeInApp: true,
};

const useDirectFirebaseAuth =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "pharmacy-dash-demo.web.app");

export const sendMagicLinkViaEmail = async (email: string) => {
  try {
    if (useDirectFirebaseAuth) {
      try {
        await sendSignInLinkToEmail(firebaseAuth, email, actionCodeSettings);
        window.localStorage.setItem("emailForSignIn", email);
        return true;
      } catch (error) {
        console.error("Error sending magic link:", error);
        return false;
      }
    } else {
      const response = await makeMagicLinkSignUpCall({
        email,
        env: process.env.REACT_APP_ENV as "production" | "staging",
        action_code_url: actionCodeSettings.url,
      });
      window.localStorage.setItem("emailForSignIn", email);
      return response.success;
    }
  } catch (error) {
    console.error("Error sending magic link:", error);
    return false;
  }
};
