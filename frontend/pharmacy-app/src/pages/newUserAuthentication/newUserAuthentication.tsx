import {
  browserLocalPersistence,
  GoogleAuthProvider,
  setPersistence,
  signInWithCredential,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { firebaseAuth, firestoreDB } from "../../api/firebase/firestoreService";
import { logEventToBigQuery } from "../../api/postCall/logEventToBigQueryNew";
import { ScreenNamesForBigQuery } from "../../enums/eventsData";
import { EventsName } from "../../enums/eventsName";
import { loginSuccess } from "../../redux/slice/auth-slice";
import { AppDispatch } from "../../redux/store/store";
import { clearAllFromLocalStorage } from "../../utils/localStorageHelper";

const ALLOWED_DOMAIN = "risalabs.ai";
const GOOGLE_CLIENT_ID =
  "835676485453-u8ulnmbtkr96n1oskjgmhm7mg38d3af5.apps.googleusercontent.com";
const DEMO_FACILITY_ID = "demo_facility_001";

const ensureDemoProviderDoc = async (
  uid: string,
  email: string,
  fullName: string,
) => {
  const providerRef = doc(firestoreDB, "providers", uid);
  const snap = await getDoc(providerRef);
  if (snap.exists()) return;

  const [firstName, ...rest] = (fullName || email.split("@")[0]).split(" ");
  const lastName = rest.join(" ") || "";

  await setDoc(providerRef, {
    DocID: uid,
    FacilityId: DEMO_FACILITY_ID,
    IsAdmin: true,
    FirstName: firstName,
    LastName: lastName,
    EmailAddresses: [email],
    Status: "active",
  });
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (
            element: HTMLElement,
            config: Record<string, unknown>,
          ) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

const NewUserAuthentication = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gsiReady, setGsiReady] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const handleCredentialResponse = useCallback(
    async (response: { credential: string }) => {
      setIsLoading(true);
      setError(null);

      try {
        const payload = JSON.parse(atob(response.credential.split(".")[1]));
        const email = (payload.email || "").toLowerCase();

        if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
          setError("Only @risalabs.ai accounts are allowed.");
          setIsLoading(false);
          return;
        }

        await setPersistence(firebaseAuth, browserLocalPersistence);

        const credential = GoogleAuthProvider.credential(response.credential);
        const result = await signInWithCredential(firebaseAuth, credential);

        try {
          await ensureDemoProviderDoc(
            result.user.uid,
            email,
            payload.name || result.user.displayName || "",
          );
        } catch (provErr) {
          console.warn("Could not auto-create provider doc:", provErr);
        }

        dispatch(
          loginSuccess({ email: result.user.email, id: result.user.uid }),
        );

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

        navigate("/");
      } catch (err: any) {
        console.error("Firebase sign-in error:", err);
        setError(`Sign-in failed: ${err.code || err.message}`);
      } finally {
        setIsLoading(false);
      }
    },
    [dispatch, navigate],
  );

  useEffect(() => {
    clearAllFromLocalStorage();
    firebaseAuth.signOut().catch(() => {});

    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
    };
    window.addEventListener("popstate", handlePopState);

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setGsiReady(true);
    document.head.appendChild(script);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    if (!gsiReady || !window.google || !googleBtnRef.current) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
      itp_support: true,
    });

    window.google.accounts.id.renderButton(googleBtnRef.current, {
      theme: "outline",
      size: "large",
      text: "signin_with",
      shape: "rectangular",
      width: 350,
      logo_alignment: "left",
    });
  }, [gsiReady, handleCredentialResponse]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 p-8">
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-3xl font-semibold text-gray-900">
            Pharmacy Dashboard
          </h1>
          <p className="text-sm text-gray-400">powered by RISA</p>
        </div>

        <div ref={googleBtnRef} className="flex w-full justify-center" />

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
            Signing in...
          </div>
        )}

        {error && <p className="text-center text-sm text-red-500">{error}</p>}

        <p className="text-xs text-gray-400">
          Restricted to @risalabs.ai accounts
        </p>
      </div>
    </div>
  );
};

export default NewUserAuthentication;
