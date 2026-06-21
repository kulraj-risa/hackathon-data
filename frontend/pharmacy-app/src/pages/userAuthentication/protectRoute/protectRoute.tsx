import { datadogRum } from "@datadog/browser-rum";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { firebaseAuth } from "../../../api/firebase/firestoreService";
import { LoaderMessage } from "../../../components/loaderMessage/loaderMessage";
import { LocalStorageKeys } from "../../../enums/localStorageKeys";
import { fetchauthStatusOptions } from "../../../redux/slice/authStatusOptionsSlice";
import { fetchBOOptions } from "../../../redux/slice/boOptionsSlice";
import { fetchAllCmmFormConfiguration } from "../../../redux/slice/cmm/cmmFormConfig";
import { fetchFacilityPlansFromFirebase } from "../../../redux/slice/facilitySlice";
import { getCurrentUser } from "../../../redux/slice/firebaseAuth/currentUserThunk";
import { fetchAllFormOptionsFromFirebase } from "../../../redux/slice/formOptionsSlice";
import { getProviderDetailsFor } from "../../../redux/slice/providerDetailsSlice";
import { AppDispatch, RootState } from "../../../redux/store/store";
import {
  clearAllFromLocalStorage,
  getItemFromLocalStorage,
  setItemInLocalStorage,
} from "../../../utils/localStorageHelper";
import { getOrgIdForFetchExternalWorklist } from "../../../utils/organizationHelper";

export default function ProtectRoute(props) {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user, verifyingUser } = useSelector(
    (state: RootState) => state.firebaseAuthentication,
  );
  const { data: providerDetails, loading: isProviderDetailsLoading } =
    useSelector((state: RootState) => state.providerDetails);

  const { data: facilityDetails, loading: isFacilityDetailsLoading } =
    useSelector((state: RootState) => state.facilitySlice);

  const { loading: isBOOptionsLoading } = useSelector(
    (state: RootState) => state.boOptions,
  );

  const unsubscribeRef = useRef<Promise<() => void>[]>([]);

  const checkIfAllDataExistsInLocalStorage = () => {
    const userId = getItemFromLocalStorage(LocalStorageKeys.USER_ID);
    const facilityId = getItemFromLocalStorage(
      LocalStorageKeys.HEALTHCARE_FACILITY_ID,
    );
    const features = getItemFromLocalStorage(LocalStorageKeys.FEATURES);

    if (userId && facilityId && features) {
      return true;
    }

    return false;
  };

  const orgId = getOrgIdForFetchExternalWorklist();

  const killAllSubscribers = async () => {
    for (const unsubscribePromise of unsubscribeRef.current) {
      const unsubscribe = await unsubscribePromise;
      unsubscribe();
    }
    unsubscribeRef.current = [];
  };

  useEffect(() => {
    dispatch(getCurrentUser());
  }, []);

  useEffect(() => {
    if (user) {
      const loadData = async () => {
        if (firebaseAuth.currentUser) {
          await firebaseAuth.currentUser.getIdToken();
        }
        dispatch(fetchAllFormOptionsFromFirebase());
        dispatch(fetchAllCmmFormConfiguration());
      };
      loadData();
      if (providerDetails?.DocID !== user.id) {
        dispatch(getProviderDetailsFor(user.id));
      }
    } else if (verifyingUser === "not-verified") {
      navigate("/auth");
    }
  }, [user?.id, verifyingUser]);

  useEffect(() => {
    if (providerDetails && providerDetails.FacilityId) {
      setItemInLocalStorage(
        LocalStorageKeys.HEALTHCARE_FACILITY_ID,
        providerDetails.FacilityId,
      );

      // Only proceed if we have a valid facility ID
      if (providerDetails.FacilityId.trim() !== "") {
        const unsubsciber_2 = dispatch(
          fetchFacilityPlansFromFirebase(providerDetails.FacilityId),
        );
        const orgId = getOrgIdForFetchExternalWorklist();
        dispatch(fetchBOOptions(orgId));
        dispatch(fetchauthStatusOptions(orgId));
        unsubscribeRef.current.push(unsubsciber_2);
      } else {
        console.warn(
          "Invalid facility ID provided, skipping facility plan fetch",
        );
      }
    }
  }, [providerDetails, orgId]);

  useEffect(() => {
    if (facilityDetails) {
      setItemInLocalStorage(LocalStorageKeys.FEATURES, facilityDetails.feature);
    }
  }, [facilityDetails]);

  useEffect(() => {
    return () => {
      killAllSubscribers();
    };
  }, []);

  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;
    const TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

    const resetTimer = () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
      inactivityTimer = setTimeout(() => {
        // Clear Datadog RUM user information before signing out
        datadogRum.setUser({});
        // Sign out the user
        firebaseAuth.signOut();
        // Clear local storage
        clearAllFromLocalStorage();
        // Redirect to login
        navigate("/auth");
        window.location.reload();
      }, TIMEOUT_DURATION);
    };

    // Reset timer on user activity
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
    ];
    events.forEach((event) => {
      document.addEventListener(event, resetTimer);
    });

    // Initial timer setup
    resetTimer();

    // Cleanup
    return () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [navigate]);

  const isDemo = process.env.REACT_APP_FIREBASE_CONFIG === "demo";
  const isReady = isDemo
    ? verifyingUser === "verified" && user
    : verifyingUser === "verified" &&
      user &&
      checkIfAllDataExistsInLocalStorage() &&
      !isProviderDetailsLoading &&
      !isFacilityDetailsLoading &&
      !isBOOptionsLoading;

  return (
    <>
      {isReady ? (
        props.children
      ) : (
        <div className="checking-auth-container">
          <LoaderMessage message="Verifying user authentication ..." />
        </div>
      )}
    </>
  );
}
