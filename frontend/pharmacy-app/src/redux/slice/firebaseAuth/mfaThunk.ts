import {
  multiFactor,
  MultiFactorResolver,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
} from "firebase/auth";
import { controlToastState } from "risa-oasis-ui_v2";
import {
  firebaseAuth,
  writeOtpErrorToFirebase,
} from "../../../api/firebase/firestoreService";

import { AppDispatch } from "../../store/store";
import {
  mfaSetupFailure,
  mfaSetupStart,
  mfaSetupSuccess,
  mfaVerificationFailure,
  mfaVerificationSuccess,
} from "../auth-slice";

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier | null;
  }
}

// Setup MFA with phone number
export const setupMFAWithPhone =
  (phoneNumber: string) => async (dispatch: AppDispatch) => {
    dispatch(mfaSetupStart());
    try {
      const user = firebaseAuth.currentUser;
      if (!user) {
        throw new Error("No user is currently signed in");
      }

      const formattedPhoneNumber = phoneNumber.startsWith("+")
        ? phoneNumber
        : `+${phoneNumber}`;

      // Ensure the recaptcha container exists
      let recaptchaContainer = document.getElementById("recaptcha-container");
      if (!recaptchaContainer) {
        recaptchaContainer = document.createElement("div");
        recaptchaContainer.id = "recaptcha-container";
        document.body.appendChild(recaptchaContainer);
      }

      // Create a recaptcha verifier
      const recaptchaVerifier = new RecaptchaVerifier(
        firebaseAuth,
        "recaptcha-container",
        {
          size: "invisible",
        },
      );

      // Get the multi-factor session first
      const multiFactorSession = await multiFactor(user).getSession();

      // Specify the phone number and pass the MFA session
      const phoneInfoOptions = {
        phoneNumber: formattedPhoneNumber,
        session: multiFactorSession,
      };

      const phoneProvider = new PhoneAuthProvider(firebaseAuth);

      // Send verification code with the session
      const verificationId = await phoneProvider.verifyPhoneNumber(
        phoneInfoOptions,
        recaptchaVerifier,
      );

      // Store the verification ID for later use
      sessionStorage.setItem("mfaVerificationId", verificationId);

      dispatch(mfaSetupSuccess());
      return verificationId;
    } catch (error) {
      controlToastState("mfa_verification_error");
      if (error instanceof Error) {
        dispatch(mfaSetupFailure(error.message));
      } else {
        dispatch(mfaSetupFailure("An unknown error occurred."));
      }
    }
  };

// Verify MFA code and complete setup
export const verifyAndCompleteMFASetup =
  (verificationCode: string) => async (dispatch: AppDispatch) => {
    try {
      dispatch(mfaSetupStart());
      const user = firebaseAuth.currentUser;
      if (!user) {
        throw new Error("No user is currently signed in");
      }

      const verificationId = sessionStorage.getItem("mfaVerificationId");
      if (!verificationId) {
        throw new Error("No verification ID found");
      }

      // Create the credential
      const cred = PhoneAuthProvider.credential(
        verificationId,
        verificationCode,
      );

      // Create the multi-factor assertion
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);

      // Complete the enrollment with a display name
      await multiFactor(user).enroll(multiFactorAssertion, "Phone Number");

      // Clear the verification ID
      sessionStorage.removeItem("mfaVerificationId");

      dispatch(mfaSetupSuccess());
      return user;
    } catch (error) {
      controlToastState("mfa_verification_error");
      if (error instanceof Error) {
        dispatch(mfaSetupFailure(error.message));
      } else {
        dispatch(mfaSetupFailure("An unknown error occurred."));
      }
      return null;
    }
  };

// Handle MFA during sign in
export const handleMFAVerification =
  (
    verificationCode: string,
    verificationId: string,
    resolver: MultiFactorResolver,
  ) =>
  async (dispatch: AppDispatch) => {
    try {
      const cred = PhoneAuthProvider.credential(
        verificationId,
        verificationCode,
      );
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);
      const userCredential = await resolver.resolveSignIn(multiFactorAssertion);

      dispatch(mfaVerificationSuccess());
      const user = {
        email: userCredential.user.email,
        id: userCredential.user.uid,
      };

      return user;
    } catch (error) {
      controlToastState("mfa_verification_error");
      if (error instanceof Error) {
        dispatch(mfaVerificationFailure(error.message));
      } else {
        dispatch(mfaVerificationFailure("An unknown error occurred."));
      }
      return null;
    }
  };

// Check if MFA is enabled for the current user
export const checkMFAStatus = () => {
  const user = firebaseAuth.currentUser;
  if (!user) return false;

  const enrolledFactors = multiFactor(user).enrolledFactors;
  return (
    enrolledFactors.length > 0 &&
    enrolledFactors.filter((factor) => factor.factorId === "phone").length > 0
  );
};

export const generateMFAVerificationCode =
  (resolver: MultiFactorResolver, email: string) =>
  async (dispatch: AppDispatch) => {
    let recaptchaVerifier: RecaptchaVerifier | null = null;

    try {
      const phoneHint = resolver.hints.find(
        (hint) => hint.factorId === PhoneMultiFactorGenerator.FACTOR_ID,
      );

      if (!phoneHint) {
        process.env.REACT_APP_ENV === "development" &&
          writeOtpErrorToFirebase(
            email,
            "No phone factor found for MFA verification",
          );
        throw new Error("No phone factor found for MFA verification");
      }

      // Validate phone number format - phoneHint is PhoneMultiFactorInfo
      const phoneNumber = (phoneHint as any).phoneNumber;
      if (!phoneNumber || phoneNumber.length < 10) {
        process.env.REACT_APP_ENV === "development" &&
          writeOtpErrorToFirebase(email, "Invalid phone number format");
        throw new Error("Invalid phone number format");
      }

      const phoneInfoOptions = {
        multiFactorHint: phoneHint,
        session: resolver.session,
        timeout: 120, // Increased timeout to 2 minutes
        units: "seconds",
      };

      const phoneProvider = new PhoneAuthProvider(firebaseAuth);

      // Ensure recaptcha container exists
      let recaptchaContainer = document.getElementById("recaptcha-container");
      if (!recaptchaContainer) {
        recaptchaContainer = document.createElement("div");
        recaptchaContainer.id = "recaptcha-container";
        recaptchaContainer.style.position = "absolute";
        recaptchaContainer.style.left = "-9999px";
        recaptchaContainer.style.top = "-9999px";
        document.body.appendChild(recaptchaContainer);
      }

      // Clear any existing reCAPTCHA verifier
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (clearError) {
          console.warn(
            "Failed to clear existing reCAPTCHA verifier:",
            clearError,
          );
        }
      }

      // Create a new recaptcha verifier
      recaptchaVerifier = new RecaptchaVerifier(
        firebaseAuth,
        "recaptcha-container",
        {
          size: "invisible",
          callback: () => {
            console.log("reCAPTCHA verification successful");
          },
          "expired-callback": () => {
            console.warn("reCAPTCHA verification expired");
          },
        },
      );

      // Store the verifier in window to prevent multiple instances
      window.recaptchaVerifier = recaptchaVerifier;

      // Render the reCAPTCHA widget
      const result = await recaptchaVerifier.render();

      const verificationId = await phoneProvider.verifyPhoneNumber(
        phoneInfoOptions,
        recaptchaVerifier,
      );

      sessionStorage.setItem("mfaVerificationId", verificationId);

      return verificationId;
    } catch (error) {
      // Handle specific Firebase errors
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        process.env.REACT_APP_ENV === "development" &&
          writeOtpErrorToFirebase(email, errorMessage);

        // Rate limiting errors
        if (
          errorMessage.includes("too many requests") ||
          errorMessage.includes("quota exceeded")
        ) {
          throw new Error(
            "Too many verification attempts. Please wait a few minutes before trying again.",
          );
        }

        // Invalid phone number
        if (
          errorMessage.includes("invalid phone number") ||
          errorMessage.includes("malformed")
        ) {
          throw new Error(
            "Invalid phone number format. Please check your phone number.",
          );
        }

        // reCAPTCHA errors
        if (
          errorMessage.includes("recaptcha") ||
          errorMessage.includes("captcha")
        ) {
          throw new Error(
            "reCAPTCHA verification failed. Please refresh the page and try again.",
          );
        }

        // Network errors
        if (
          errorMessage.includes("network") ||
          errorMessage.includes("timeout")
        ) {
          throw new Error(
            "Network error. Please check your internet connection and try again.",
          );
        }
      }

      if (error instanceof Error) {
        dispatch(mfaVerificationFailure(error.message));
      } else {
        dispatch(mfaVerificationFailure("An unknown error occurred."));
      }
      throw error;
    } finally {
      // Clean up reCAPTCHA verifier
      if (recaptchaVerifier) {
        try {
          (recaptchaVerifier as any).clear();
        } catch (clearError) {
          console.warn("Failed to clear reCAPTCHA verifier:", clearError);
        }
      }
      window.recaptchaVerifier = null;
    }
  };
