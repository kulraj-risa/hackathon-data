import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ErrorPage from "./components/errorPage/errorPage";
import { LocalStorageKeys } from "./enums/localStorageKeys";
import Analytics from "./pages/analytics/analytics";
import FinalSignIn from "./pages/finalSignIn/finalSignIn";
import HomeVersion2 from "./pages/homeVersion2/homeVersion2";
import NewUserAuthentication from "./pages/newUserAuthentication/newUserAuthentication";
import ProtectRoute from "./pages/userAuthentication/protectRoute/protectRoute";
import { RootState } from "./redux/store/store";
import { DefaultRouteConfig } from "./routes/defaultConfig";
import { PharmaPaRouteConfig } from "./routes/pharmaPaRouteConfig";
import { getItemFromLocalStorage } from "./utils/localStorageHelper";

const App = () => {
  const determineRouteConfig = (features: [string]) => {
    return PharmaPaRouteConfig;
  };

  const { user } = useSelector(
    (state: RootState) => state.firebaseAuthentication,
  );
  const [routeConfig, setRouteConfig] =
    React.useState<any>(PharmaPaRouteConfig);
  const [isOrgSetupComplete, setIsOrgSetupComplete] = useState(false);

  const { data: facilityDetails } = useSelector(
    (state: RootState) => state.facilitySlice,
  );
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const isDemo = process.env.REACT_APP_FIREBASE_CONFIG === "demo";

  useEffect(() => {
    if (isDemo) {
      setRouteConfig(PharmaPaRouteConfig);
      return;
    }

    if (!user) {
      setRouteConfig(DefaultRouteConfig);
    }

    const fetchFeature = async () => {
      const storedFeature = getItemFromLocalStorage(LocalStorageKeys.FEATURES);

      if (storedFeature) {
        setRouteConfig(determineRouteConfig(storedFeature));
        clearTimer();
      } else {
        setTimer(fetchFeature, 500);
      }
    };

    const setTimer = (callback: () => void, delay: number) => {
      clearTimer();
      timerRef.current = setTimeout(callback, delay);
    };

    const clearTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    if (user) {
      fetchFeature();
    }

    return () => {
      clearTimer();
    };
  }, [user, facilityDetails, isOrgSetupComplete]);

  const router = useMemo(
    () =>
      createBrowserRouter([
        {
          path: "/",
          element: (
            <ProtectRoute>
              <HomeVersion2 />
            </ProtectRoute>
          ),
          children: routeConfig,
        },
        { path: "/demo-analytics", element: <Analytics /> },
        { path: "/auth/:email?", element: <NewUserAuthentication /> },
        { path: "/finishSignIn", element: <FinalSignIn /> },
        {
          path: "*",
          element: <ErrorPage />,
        },
      ]),
    [routeConfig],
  );
  return (
    <>
      <RouterProvider router={router} />
      <div id="recaptcha-container"></div>
    </>
  );
};

export default App;
