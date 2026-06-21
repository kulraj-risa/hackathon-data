import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { controlToastState } from "risa-oasis-ui_v2";
import { firebaseAuth } from "../../api/firebase/firestoreService";

import { MultiFactorResolver, User } from "firebase/auth";
import { loginUserInFirebase } from "../../redux/slice/firebaseAuth/loginThunk";
import { resetPasswordViaEmail } from "../../redux/slice/firebaseAuth/resetPasswordThunk";
import { signUpUserInFirebase } from "../../redux/slice/firebaseAuth/signUpThunk";
import { AppDispatch, RootState } from "../../redux/store/store";
import RisaLogoWhite from "../../svg/risa-logo-white";
import { logButtonClickEvent, ParamName } from "../../utils/events";
import LogIn from "./login/login";
import MFASetup from "./mfaSetup/mfaSetup";
import MFAVerification from "./mfaVerification";
import SignUp from "./signUp/signUp";

const UserAuthentication = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [resolver, setResolver] = useState<MultiFactorResolver | null>(null);
  const navigate = useNavigate();
  const params = useParams();
  const dispatch = useDispatch<AppDispatch>();
  const {
    user,
    signUpError,
    loginError,
    emailSentError,
    isLoading,
    emailSent,
    mfaSetUpRequired,
    mfaVerificationRequired,
    verifyingUser,
    mfaError,
  } = useSelector((state: RootState) => state.firebaseAuthentication);

  // Handle logout and prevent back navigation
  useEffect(() => {
    // Don't automatically logout on component mount
    // This was clearing localStorage on page refresh

    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
    };
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    if (params.email && params.email.includes("@")) {
      setEmail(params.email);
    }
  }, [params]);

  useEffect(() => {
    if (user && verifyingUser === "verified" && !mfaError) {
      navigate("/");
    }

    if (signUpError) {
      controlToastState("sign_up_error");
    }

    // if (loginError) {
    //   controlToastState("login_error");
    // }

    if (emailSentError) {
      controlToastState("email_sent_error");
    }

    if (emailSent) {
      controlToastState("email_sent");
    }
  }, [user, signUpError, loginError, emailSentError, isLoading, emailSent]);

  const handleBlur = (data) => {
    if (
      data.name === "user_email" &&
      data.value.trim().length > 0 &&
      data.value.includes("@")
    ) {
      setEmail(data.value);
    } else if (data.name === "user_password") {
      setPassword(data.value);
    }
  };

  const signUpUser = async () => {
    if (email.trim().length > 0 && password) {
      logButtonClickEvent(ParamName.SIGN_UP);
      const user = await dispatch(signUpUserInFirebase({ email, password }));
      if (user) {
        setFirebaseUser(user);
        setEmail("");
        setPassword("");
      }
    }
  };

  const logInUser = async () => {
    if (email.trim().length > 0 && password) {
      logButtonClickEvent(ParamName.LOGIN);
      const result = await dispatch(loginUserInFirebase({ email, password }));
      if (result) {
        const { user, resolver } = result;
        if (resolver) {
          setResolver(resolver);
        }
        if (user) {
          setFirebaseUser(user);
        }
      }
    }
  };

  const resetPassword = async () => {
    if (email.trim().length > 0) {
      logButtonClickEvent(ParamName.RESET_PASSWORD);
      dispatch(resetPasswordViaEmail(firebaseAuth, email));
    }
  };

  return (
    <>
      <div className="auth-page-container flex flex-col items-center justify-center bg-black p-10">
        <div className="logo-container">
          <RisaLogoWhite />
        </div>
        <div className="auth-page-container_left mt-10 w-[30%] rounded-lg bg-white">
          <div className="left-content">
            {mfaSetUpRequired ? (
              <>
                {firebaseAuth.currentUser && (
                  <MFASetup user={firebaseAuth.currentUser} />
                )}
              </>
            ) : (
              !mfaVerificationRequired && (
                <>
                  <div className="auth-form">
                    {params.email &&
                    params.email.includes("@") &&
                    params.email.trim().length > 0 ? (
                      <SignUp
                        handleOnBlur={handleBlur}
                        signUpUser={signUpUser}
                        isLoading={isLoading}
                        user={firebaseUser}
                        userEmail={params.email}
                      />
                    ) : (
                      <LogIn
                        handleBlur={handleBlur}
                        isLoading={isLoading}
                        loginUser={logInUser}
                        forgotPassword={resetPassword}
                      />
                    )}
                  </div>
                </>
              )
            )}
            {mfaVerificationRequired && resolver && (
              <MFAVerification resolver={resolver} email={email} />
            )}
            {/* <div className="contact-us">
              Need Help? <span>Contact Us</span>
              <div className="version-info mt-2 text-center text-xs text-primaryGray-9">
                Version : {process.env.REACT_APP_VERSION}
              </div>
            </div> */}
          </div>
        </div>
        <div className="auth-page-container_right">
          {/* <div className="image-container">
            <img
              src="/home-screenshot.png"
              alt="Auth Page Image"
              loading="eager"
            />
          </div> */}
        </div>
        <div className="contact-us text-white">
          Need Help? <span>Contact Us</span>
          <div className="version-info mt-2 text-center text-xs text-primaryGray-9">
            Version : {process.env.REACT_APP_VERSION}
          </div>
        </div>
      </div>
    </>
  );
};

export default UserAuthentication;
