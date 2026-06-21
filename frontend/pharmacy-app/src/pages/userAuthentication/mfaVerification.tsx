import { MultiFactorResolver } from "firebase/auth";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Button,
  controlToastState,
  SpinningLoader,
  TextInput,
} from "risa-oasis-ui_v2";
import {
  loginSuccess,
  mfaVerificationFailure,
} from "../../redux/slice/auth-slice";
import {
  generateMFAVerificationCode,
  handleMFAVerification,
} from "../../redux/slice/firebaseAuth/mfaThunk";
import { AppDispatch, RootState } from "../../redux/store/store";

interface MFAVerificationProps {
  resolver: MultiFactorResolver;
  email: string;
}

const MFAVerification = ({ resolver, email }: MFAVerificationProps) => {
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const navigate = useNavigate();

  const dispatch = useDispatch<AppDispatch>();
  const { mfaError } = useSelector(
    (state: RootState) => state.firebaseAuthentication,
  );
  const [verificationId, setVerificationId] = useState("");

  useEffect(() => {
    const generateVerificationId = async () => {
      try {
        const verificationId = await dispatch(
          generateMFAVerificationCode(resolver, email),
        );
        if (verificationId) {
          setVerificationId(verificationId);
        }
      } catch (error) {
        console.error("Error generating verification ID", error);
      }
    };
    generateVerificationId();
  }, []);

  const handleVerificationCodeSubmit = async () => {
    try {
      setIsVerifying(true);
      setError("");
      const result = await dispatch(
        handleMFAVerification(verificationCode, verificationId, resolver),
      );
      if (result) {
        controlToastState("mfa_success");
        dispatch(loginSuccess(result));
      }
    } catch (error) {
      dispatch(mfaVerificationFailure("MFA Verification failed!"));
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="mfa-verification-container flex flex-col gap-4">
      <div className="flex flex-col items-center gap-4">
        <div className="flex flex-col gap-2 text-body font-semibold">
          Two-Factor Authentication
        </div>
        <p className="self-center text-center text-sm text-primaryGray-5">
          Verify your account by entering the code sent to your phone
        </p>
      </div>
      <div className="verification-code-setup flex flex-col gap-4">
        <TextInput
          label="Verification Code"
          placeholder="Enter 6-digit code sent to your phone"
          id="verification-code-login"
          required={true}
          onChange={(e) => setVerificationCode(e.value)}
        />
        <Button
          buttonType="primary"
          size="medium"
          onClick={handleVerificationCodeSubmit}
          disabled={verificationCode.length !== 6}
        >
          {isVerifying ? "Verifying Code..." : "Verify Code"}
          {isVerifying && <SpinningLoader />}
        </Button>
      </div>
    </div>
  );
};

export default MFAVerification;
