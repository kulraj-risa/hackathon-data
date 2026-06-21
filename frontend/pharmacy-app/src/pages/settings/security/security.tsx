import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../redux/store/store";

import {
  EmailAuthProvider,
  getMultiFactorResolver,
  MultiFactorError,
  MultiFactorInfo,
  MultiFactorResolver,
  MultiFactorSession,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  reauthenticateWithCredential,
  RecaptchaVerifier,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import {
  Button,
  controlToastState,
  SpinningLoader,
  TextInput,
} from "risa-oasis-ui_v2";
import { firebaseAuth } from "../../../api/firebase/firestoreService";
import { resetAllPasswordRelatedStates } from "../../../redux/slice/firebaseAuth/resetAllStateThunk";
import { resetPasswordInFirebase } from "../../../redux/slice/firebaseAuth/resetPasswordThunk";

const Security = () => {
  const [errorList, setErrorList] = useState({
    current_pwd: "",
    new_pwd: "",
    confirm_new_pwd: "",
    verification_code: "",
  });
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [showVerificationCode, setShowVerificationCode] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [verificationId, setVerificationId] = useState("");
  const [resolver, setResolver] = useState<MultiFactorResolver | null>(null);
  const [phoneProvider, setPhoneProvider] = useState<PhoneAuthProvider | null>(
    null,
  );
  const [phoneInfoOptions, setPhoneInfoOptions] = useState<{
    multiFactorHint: MultiFactorInfo | undefined;
    session: MultiFactorSession;
    timeout: number;
    units: string;
  } | null>(null);
  const dispatch = useDispatch<AppDispatch>();
  const { passwordReset, passwordResetError, passwordResetInProgress } =
    useSelector((state: RootState) => state.firebaseAuthentication);
  const { data: providerInfo } = useSelector(
    (state: RootState) => state.providerDetails,
  );

  const isValidPassword = (password: string) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;
    return regex.test(password);
  };

  useEffect(() => {
    const isValidForm =
      Object.values(errorList).every((error) => error === "") &&
      currentPassword.length > 0 &&
      newPassword.length > 0 &&
      confirmNewPassword.length > 0;

    setIsValid(isValidForm);
  }, [errorList, currentPassword, newPassword, confirmNewPassword]);

  useEffect(() => {
    if (passwordReset) {
      controlToastState("password_reset_success");
      clearAllFields();
      setTimeout(() => {
        navigate("/");
        window.location.reload();
      }, 100);
    } else if (passwordResetError) {
      controlToastState("password_reset_failure");
    }
    dispatch(resetAllPasswordRelatedStates());
  }, [passwordReset, passwordResetError]);

  const onCurrentPasswordChange = (data) => {
    setCurrentPassword(data.value);
  };

  const onVerificationCodeChange = (data) => {
    setVerificationCode(data.value);
  };

  const onPasswordChange = (data) => {
    setNewPassword(data.value);
    const newErrorList = { ...errorList };

    if (!isValidPassword(data.value)) {
      newErrorList.new_pwd =
        "Password must be at least 6 characters  long and include at least one uppercase letter, one lowercase letter, one number, and one special character.";
    } else {
      newErrorList.new_pwd = "";
    }

    if (confirmNewPassword && data.value !== confirmNewPassword) {
      newErrorList.confirm_new_pwd = "Passwords do not match";
    } else if (confirmNewPassword) {
      newErrorList.confirm_new_pwd = "";
    }

    setErrorList(newErrorList);
  };

  const onConfirmPasswordChange = (data) => {
    setConfirmNewPassword(data.value);
    if (data.value !== newPassword) {
      setErrorList({ ...errorList, confirm_new_pwd: "Passwords do not match" });
    } else {
      setErrorList({ ...errorList, confirm_new_pwd: "" });
    }
  };

  const onInputBlur = (data) => {
    if (data.value != "") {
      reAuthenticateUserFromFirebase(currentPassword);
    } else if (data.value == "") {
      setErrorList({
        ...errorList,
        current_pwd: "Current password is required",
      });
    }
  };

  const onVerificationCodeBlur = async (data) => {
    if (!verificationId || !resolver) {
      setErrorList({
        ...errorList,
        verification_code: "Please enter your current password first",
      });
      return;
    }

    try {
      const cred = PhoneAuthProvider.credential(verificationId, data.value);
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);
      await resolver.resolveSignIn(multiFactorAssertion);
      setErrorList({ ...errorList, current_pwd: "", verification_code: "" });
      setShowVerificationCode(false);
    } catch (mfaError) {
      console.error("MFA failed:", mfaError);
      setErrorList({
        ...errorList,
        verification_code: "Invalid verification code",
      });
    }
  };

  const clearAllFields = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setVerificationCode("");
    setErrorList({
      current_pwd: "",
      new_pwd: "",
      confirm_new_pwd: "",
      verification_code: "",
    });
  };

  const reAuthenticateUserFromFirebase = async (password) => {
    const currentUser = firebaseAuth.currentUser;

    if (currentUser && currentUser.email) {
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        password,
      );

      try {
        await reauthenticateWithCredential(currentUser, credential);
        setErrorList({ ...errorList, current_pwd: "" });
      } catch (error) {
        if (error?.["code"].includes("auth/multi-factor-auth-required")) {
          setErrorList({
            ...errorList,
            current_pwd: "Complete MFA Verification",
          });
          setShowVerificationCode(true);
          let recaptchaVerifier: RecaptchaVerifier | null = null;
          const mfaResolver = getMultiFactorResolver(
            firebaseAuth,
            error as MultiFactorError,
          );
          setResolver(mfaResolver);

          const phoneHint = mfaResolver.hints.find(
            (hint) => hint.factorId === PhoneMultiFactorGenerator.FACTOR_ID,
          );
          const options = {
            multiFactorHint: phoneHint,
            session: mfaResolver.session,
            timeout: 60,
            units: "seconds",
          };
          setPhoneInfoOptions(options);

          const provider = new PhoneAuthProvider(firebaseAuth);
          setPhoneProvider(provider);

          // Clear any existing reCAPTCHA verifier
          if (window.recaptchaVerifier) {
            window.recaptchaVerifier.clear();
            window.recaptchaVerifier = null;
          }

          // Create a new recaptcha verifier
          recaptchaVerifier = new RecaptchaVerifier(
            firebaseAuth,
            "recaptcha-container",
            {
              size: "invisible",
              callback: () => {
                // Callback function if needed
              },
            },
          );

          // Store the verifier in window
          window.recaptchaVerifier = recaptchaVerifier;

          try {
            const id = await provider.verifyPhoneNumber(
              options,
              recaptchaVerifier,
            );
            setVerificationId(id);
          } catch (mfaError) {
            console.error("Phone verification failed:", mfaError);
            setErrorList({
              ...errorList,
              current_pwd: "Phone verification failed",
            });
            setShowVerificationCode(false);
          }
        } else {
          setErrorList({
            ...errorList,
            current_pwd: "Current password is incorrect",
          });
        }
      }
    }
  };

  const resetPassword = () => {
    setShowVerificationCode(false);
    dispatch(resetPasswordInFirebase(newPassword, providerInfo?.DocID || ""));
  };

  return (
    <>
      <div className="security-page--container">
        <div className="security-page--heading">Security</div>
        <div className="reset-password--heading">Reset Password</div>
        <div className="reset-password--container">
          <form id="change_pwd">
            <TextInput
              id="current_pwd"
              label="Current Password"
              placeholder="Enter your current password"
              textHidden={true}
              onChange={onCurrentPasswordChange}
              onBlur={onInputBlur}
              error={errorList.current_pwd}
              required={true}
              resetField={
                currentPassword == "" &&
                newPassword == "" &&
                confirmNewPassword == ""
              }
            />

            {showVerificationCode && (
              <TextInput
                id="verification_code"
                label="Verification Code"
                placeholder="Enter your verification code"
                textHidden={true}
                onChange={onVerificationCodeChange}
                onBlur={onVerificationCodeBlur}
                error={errorList.verification_code}
                required={true}
                resetField={
                  currentPassword == "" &&
                  newPassword == "" &&
                  confirmNewPassword == ""
                }
              />
            )}

            <TextInput
              id="new_pwd"
              label="New Password"
              placeholder="Enter your new password"
              textHidden={true}
              onChange={onPasswordChange}
              error={errorList.new_pwd}
              required={true}
              resetField={
                currentPassword == "" &&
                newPassword == "" &&
                confirmNewPassword == ""
              }
            />
            <TextInput
              id="confirm_new_pwd"
              label="Confirm New Password"
              placeholder="Re-enter new password"
              textHidden={true}
              onChange={onConfirmPasswordChange}
              error={errorList.confirm_new_pwd}
              required={true}
              resetField={
                currentPassword == "" &&
                newPassword == "" &&
                confirmNewPassword == ""
              }
            />
          </form>
        </div>
        <div id="recaptcha-container"></div>
        <div className="action-buttons--container">
          <Button
            disabled={false}
            children={"Cancel"}
            onClick={() => {}}
            buttonType={"secondary"}
            size={"medium"}
          />

          <Button
            disabled={!isValid}
            onClick={resetPassword}
            size={"medium"}
            buttonType="primary"
          >
            Save
            {passwordResetInProgress && <SpinningLoader />}
          </Button>
        </div>
      </div>
    </>
  );
};

export default Security;
