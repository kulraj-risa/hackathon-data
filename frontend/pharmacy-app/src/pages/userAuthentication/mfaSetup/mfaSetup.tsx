import { User } from "firebase/auth";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button,
  controlToastState,
  SpinningLoader,
  TextInput,
} from "risa-oasis-ui_v2";
import { loginSuccess } from "../../../redux/slice/auth-slice";
import {
  setupMFAWithPhone,
  verifyAndCompleteMFASetup,
} from "../../../redux/slice/firebaseAuth/mfaThunk";
import { AppDispatch, RootState } from "../../../redux/store/store";
import {
  formatPhoneNumberWithCountryCode,
  unformatPhoneNumber,
} from "../../../utils/stringModifications";

interface MFASetupProps {
  user: User;
}

const MFASetup = (props: MFASetupProps) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");
  const [resetFlag, setResetFlag] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const { mfaSetupInProgress, mfaError } = useSelector(
    (state: RootState) => state.firebaseAuthentication,
  );

  const handlePhoneNumberSubmit = async () => {
    try {
      setError("");
      await dispatch(setupMFAWithPhone(phoneNumber));
      setIsVerifying(true);
      setResetFlag(!resetFlag);
      controlToastState("mfa_setup_success");
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unknown error occurred");
      }
    }
  };

  const handleVerificationCodeSubmit = async () => {
    try {
      setError("");
      const user = await dispatch(verifyAndCompleteMFASetup(verificationCode));
      if (user) {
        const userToLogin = {
          email: user.email,
          id: user.uid,
        };
        dispatch(loginSuccess(userToLogin));
        controlToastState("mfa_success");
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setIsVerifying(false);
      setResetFlag(!resetFlag);
    }
  };

  return (
    <div className="mfa-setup-container flex flex-col gap-4">
      <div className="flex flex-col items-center gap-4">
        <div className="flex flex-col gap-2 text-body font-semibold">
          Set Up Two-Factor Authentication
        </div>
        <p className="self-center text-center text-sm text-primaryGray-5">
          Two-factor authentication adds an extra layer of security to your
          account.
        </p>
      </div>
      <div className="verification-code-setup flex flex-col gap-4">
        {!isVerifying ? (
          <>
            <TextInput
              id={"phone-number"}
              label={"Phone Number With Country Code"}
              onChange={(e) => setPhoneNumber(unformatPhoneNumber(e.value))}
              placeholder="11234567890"
              required={true}
              readOnly={mfaSetupInProgress}
              formatInput={formatPhoneNumberWithCountryCode}
              error={
                phoneNumber.trim().length < 10 && phoneNumber.length > 0
                  ? "Phone number must be at least 10 digits"
                  : ""
              }
              resetField={resetFlag}
            />
          </>
        ) : (
          <>
            <TextInput
              id={"verification-code"}
              label={"Verification Code"}
              onChange={(e) => setVerificationCode(e.value)}
              placeholder="Enter 6-digit code sent to your phone"
              required={true}
              readOnly={mfaSetupInProgress}
              error={
                verificationCode.trim().length !== 6 &&
                verificationCode.length > 0
                  ? "Verification code must be 6 digits"
                  : ""
              }
              resetField={resetFlag}
            />
          </>
        )}
        {!isVerifying ? (
          <>
            <Button
              buttonType="primary"
              size="medium"
              disabled={phoneNumber.trim().length < 10 || mfaSetupInProgress}
              onClick={handlePhoneNumberSubmit}
            >
              {mfaSetupInProgress ? "Setting Up MFA..." : "Setup MFA"}
              {mfaSetupInProgress && <SpinningLoader />}
            </Button>
          </>
        ) : (
          <>
            <Button
              buttonType="primary"
              size="medium"
              disabled={
                verificationCode.trim().length !== 6 || mfaSetupInProgress
              }
              onClick={handleVerificationCodeSubmit}
            >
              {mfaSetupInProgress ? "Verifying Code..." : "Verify Code"}
              {mfaSetupInProgress && <SpinningLoader />}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default MFASetup;
