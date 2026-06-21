import { KeyboardEventHandler, useState } from "react";
import { CheckBox, SpinningLoader, TextInput } from "risa-oasis-ui_v2";
import { logDataToConsole } from "../../../utils/customLogger";

interface LoginComponentProps {
  handleBlur: (data: {
    name: string;
    required: boolean;
    value: string;
  }) => void;
  isLoading: boolean;
  loginUser: () => void;
  forgotPassword: () => void;
}

export default function LogIn(props: LoginComponentProps) {
  const [emailError, setEmailError] = useState("");

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const onValueChange = (data) => {
    logDataToConsole(
      "This is a test log to check if the logDataToConsole function is working",
    );
  };

  const validateEmail = (data) => {
    if (data.name === "user_email" && !isValidEmail(data.value)) {
      setEmailError("Please enter a valid email");
      props.handleBlur({
        name: "user_email",
        required: true,
        value: "",
      });
    } else if (data.name === "user_email" && isValidEmail(data.value)) {
      setEmailError("");
      props.handleBlur(data);
    }
  };

  const checkIfEnterIsPressed: KeyboardEventHandler<HTMLDivElement> = (
    event,
  ) => {
    if (
      event.key === "Enter" &&
      (event.target as HTMLElement).id === "user_password"
    ) {
      props.loginUser();
    }
  };

  return (
    <>
      <div className="login-form-container">
        <div className="login-form-header">
          <div className="title-text">Welcome Back</div>
          <div className="title-subText">Enter your details to sign in</div>
        </div>
        <div className="login-form-holder" onKeyDown={checkIfEnterIsPressed}>
          <TextInput
            id="user_email"
            label="Email"
            onBlur={props.handleBlur}
            placeholder="Enter your email"
            onChange={validateEmail}
            error={emailError}
          />
          <TextInput
            id="user_password"
            label="Password"
            onBlur={props.handleBlur}
            onChange={props.handleBlur}
            textHidden={true}
            placeholder="Enter your password"
          />
          <div className="login-actions-container">
            <CheckBox
              label="Remember me"
              id="login-remember"
              onCheckBoxValueChange={onValueChange}
            />
            <button
              className="forgot-password"
              disabled={emailError !== ""}
              onClick={emailError === "" ? props.forgotPassword : () => {}}
            >
              Forgot Password ?
            </button>
          </div>
        </div>
        <div className="login-button">
          <button
            className="login-btn"
            onClick={props.loginUser}
            disabled={props.isLoading}
          >
            Login
            {props.isLoading && <SpinningLoader />}
          </button>
        </div>

        <div className="login-form-no-aacount">
          Don&apos;t have an account? Contact your admin.
        </div>
      </div>
    </>
  );
}
