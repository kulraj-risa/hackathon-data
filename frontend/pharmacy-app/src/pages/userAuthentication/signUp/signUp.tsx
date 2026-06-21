import { sendEmailVerification, User } from "firebase/auth";
import { KeyboardEventHandler, useState } from "react";
import { useNavigate } from "react-router-dom";
import { controlToastState, SpinningLoader, TextInput } from "risa-oasis-ui_v2";

interface SignUpComponentProps {
  handleOnBlur: (data: {
    name: string;
    required: boolean;
    value: string;
  }) => void;
  signUpUser: () => void;
  isLoading: boolean;
  user: User | null;
  userEmail: string;
}

export default function SignUp(props: SignUpComponentProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [emailVerifying, setEmailVerifying] = useState(false);
  const navigate = useNavigate();

  const handlePasswordChange = (data) => {
    setPassword(data.value);
    if (data.name === "user_password" && !isValidPassword(data.value)) {
      setPasswordError(
        "Password must be at least 6 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.",
      );
    } else if (data.name === "user_password" && isValidPassword(data.value)) {
      setPasswordError("");
    }

    if (data.value !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
    } else if (data.value === confirmPassword) {
      setConfirmPasswordError("");
    }
    props.handleOnBlur(data);
  };

  const handleConfirmPasswordChange = (data) => {
    setConfirmPassword(data.value);
    if (data.name === "user_confirm_password" && data.value !== password) {
      setConfirmPasswordError("Passwords do not match");
    } else if (
      data.name === "user_confirm_password" &&
      data.value === password
    ) {
      setConfirmPasswordError("");
    }
    props.handleOnBlur(data);
  };

  const checkIfEnterIsPressed: KeyboardEventHandler<HTMLDivElement> = (
    event,
  ) => {
    if (
      event.key === "Enter" &&
      (event.target as HTMLElement).id === "user_confirm_password"
    ) {
      props.signUpUser();
    }
  };

  const isValidPassword = (password: string) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;
    return regex.test(password);
  };

  const sendVerificationEmail = async (user) => {
    setEmailVerifying(true);
    await sendEmailVerification(user);
    setEmailVerifying(false);
    controlToastState("email-verification-success");
    navigate("/auth");
  };

  return (
    <>
      <div className="login-form-container">
        <div className="login-form-header">
          <div className="title-text">Welcome </div>
          <div className="title-subText">Create your password to sign up</div>
        </div>
        <div className="login-form-holder" onKeyDown={checkIfEnterIsPressed}>
          <TextInput
            id="user_email"
            label="Email"
            onBlur={() => {}}
            readOnly
            onChange={() => {}}
            defaultValue={props.userEmail ?? ""}
          />
          <TextInput
            id="user_password"
            label="Password"
            placeholder="Enter your password"
            textHidden={true}
            onChange={handlePasswordChange}
            error={passwordError}
          />
          <TextInput
            id="user_confirm_password"
            label="Confirm Password"
            textHidden={true}
            placeholder="Confirm your password"
            error={confirmPasswordError}
            onChange={handleConfirmPasswordChange}
          />
        </div>
        {props.user ? (
          <div className="login-button">
            <div className="email-verifying-text mb-4 text-center text-small font-normal text-tertiaryBlue-4">
              Please verify your email to continue.
              <br />
              Once verified, you can login to your account.
            </div>
            <button
              className="login-btn"
              onClick={() => {
                sendVerificationEmail(props.user);
              }}
              disabled={emailVerifying}
            >
              Send Verification Email
            </button>
          </div>
        ) : (
          <div className="login-button">
            <button
              className="login-btn"
              onClick={props.signUpUser}
              disabled={
                passwordError.trim().length !== 0 ||
                confirmPasswordError.trim().length !== 0
              }
            >
              Signup
              {props.isLoading && <SpinningLoader />}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
