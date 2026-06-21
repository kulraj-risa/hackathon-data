import {
  browserLocalPersistence,
  isSignInWithEmailLink,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailLink,
  signOut,
} from "firebase/auth";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { firebaseAuth } from "../../api/firebase/firestoreService";
import { logEventToBigQuery } from "../../api/postCall/logEventToBigQueryNew";
import { LoaderMessage } from "../../components/loaderMessage/loaderMessage";
import { ScreenNamesForBigQuery } from "../../enums/eventsData";
import { EventsName } from "../../enums/eventsName";
import { loginSuccess } from "../../redux/slice/auth-slice";
import { AppDispatch } from "../../redux/store/store";

const ALLOWED_DOMAIN = "risalabs.ai";

const FinalSignIn = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const completeSignIn = async () => {
      if (typeof window === "undefined") return;

      if (isSignInWithEmailLink(firebaseAuth, window.location.href)) {
        let email = window.localStorage.getItem("emailForSignIn");

        if (!email) {
          email =
            window.prompt("Please provide your email for confirmation") || null;
        }

        if (!email) {
          console.error("Email is required for sign-in.");
          navigate("/auth");
          return;
        }

        if (!email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`)) {
          window.localStorage.removeItem("emailForSignIn");
          navigate("/auth");
          return;
        }

        try {
          await setPersistence(firebaseAuth, browserLocalPersistence);

          const result = await signInWithEmailLink(
            firebaseAuth,
            email,
            window.location.href,
          );

          const signedInEmail = result.user.email?.toLowerCase() ?? "";
          if (!signedInEmail.endsWith(`@${ALLOWED_DOMAIN}`)) {
            await signOut(firebaseAuth);
            window.localStorage.removeItem("emailForSignIn");
            navigate("/auth");
            return;
          }

          window.localStorage.removeItem("emailForSignIn");

          dispatch(
            loginSuccess({
              email: result.user.email,
              id: result.user.uid,
            }),
          );

          navigate("/");
          logEventToBigQuery({
            event_name: EventsName.LOGIN,
            patient_id: "",
            user_id: result.user.uid,
            user_email: result.user.email || "",
            order_id: "",
            org_id: "",
            additional_data: {
              screen_name: ScreenNamesForBigQuery.WORKLIST,
              user_id: result.user.uid,
            },
          });
        } catch (error) {
          console.error("Error signing in with email link:", error);
          navigate("/auth");
        }
      } else {
        console.log("Not a sign-in email link, redirecting to auth");
        navigate("/auth");
      }
    };

    completeSignIn();
  }, [dispatch, navigate]);

  // ✅ Keep listening for auth state even on refresh
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      if (user) {
        dispatch(
          loginSuccess({
            email: user.email,
            id: user.uid,
          }),
        );
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  return (
    <div className="final-sign-in--container flex h-full items-center justify-center">
      <LoaderMessage message={"Signing in..."} />
    </div>
  );
};

export default FinalSignIn;
