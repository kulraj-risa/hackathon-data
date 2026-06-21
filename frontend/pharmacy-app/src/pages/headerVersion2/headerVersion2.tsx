import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useNavigationType } from "react-router-dom";
import { logEventToBigQuery } from "../../api/postCall/logEventToBigQueryNew";
import SingleTabWithLink, {
  SingleTabWithLinkProps,
} from "../../components/singleTabWithLink/singleTabWithLink";
import { ScreenNamesForBigQuery } from "../../enums/eventsData";
import { EventsName } from "../../enums/eventsName";
import { Features } from "../../enums/screenNames";
import {
  clearDataFromStorage,
  logOutUserFromFirebase,
} from "../../redux/slice/firebaseAuth/logOutThunk";
import { getAllProviderDetailsForClinic } from "../../redux/slice/providerSlice";
import { AppDispatch, RootState } from "../../redux/store/store";
import AgentStudioIcon from "../../svg/agentStudioIcon";
import AgentStudioIconFilled from "../../svg/agentStudioIconFilled";
import AnalyticsFilledIcon from "../../svg/analyticsFilledIcon";
import AnalyticsIcon from "../../svg/analyticsIcon";
import ClaimsIcon from "../../svg/claims";
import ClaimsIconFilled from "../../svg/claimsIconFilled";
import Exit from "../../svg/exit";
// Requests tab hidden for the demo — see generateTabs().
// import RequestsIcon from "../../svg/requestsIcon";
// import RequestsIconFilled from "../../svg/requestsIconFilled";
import RisaLogoWhite from "../../svg/risa-logo-white";
import WorklistIcon from "../../svg/worklistIcon";
import WorklistIconFilled from "../../svg/worklistIconFilled";
import { logError } from "../../utils/customLogger";
import { logButtonClickEvent, ParamName } from "../../utils/events";
import { getItemFromLocalStorage } from "../../utils/localStorageHelper";
import { getOrgIdForFetchExternalWorklist } from "../../utils/organizationHelper";

const HeaderVersion2 = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [tabsList, setTabsList] = useState<SingleTabWithLinkProps[]>([]);
  const { user } = useSelector(
    (state: RootState) => state.firebaseAuthentication,
  );
  const { data: providerDetails } = useSelector(
    (state: RootState) => state.providerDetails,
  );
  const { data: facilityDetails } = useSelector(
    (state: RootState) => state.facilitySlice,
  );
  const { selectedOrganization } = useSelector(
    (state: RootState) => state.organizationNewSlice,
  );

  const navigationType = useNavigationType();

  const orgId = getOrgIdForFetchExternalWorklist();

  const isDemo = process.env.REACT_APP_FIREBASE_CONFIG === "demo";

  useEffect(() => {
    if (isDemo) {
      generateTabs([Features.PHARMA_PA]);
      return;
    }

    const fetchFeature = () => {
      try {
        const storedFeature = getItemFromLocalStorage("features");
        if (storedFeature) {
          generateTabs(storedFeature);
          clearTimer();
        } else {
          setTimer(fetchFeature, 500);
        }
      } catch (error) {
        logError(error as Error, "Error fetching features");
        clearTimer();
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
  }, [user, facilityDetails, providerDetails]);

  useEffect(() => {
    if (providerDetails) {
      dispatch(
        getAllProviderDetailsForClinic(providerDetails.FacilityId || ""),
      );
    }
  }, [providerDetails, dispatch]);

  useEffect(() => {
    if (tabsList && tabsList.length > 0 && navigationType !== "POP") {
      navigate(`/${tabsList[0].id}/`);
    } else if (tabsList && tabsList.length > 0 && location.pathname === "/") {
      navigate(`/${tabsList[0].id}/`);
    }
  }, [tabsList]);

  const generateTabs = (storedFeature: string[]) => {
    let tabs;

    switch (true) {
      case storedFeature.includes(Features.NYCBS_PHARMA_EXTERNAL):
        tabs = [
          { id: "nycbs-pharma-pa-worklists", label: "PA Orders" },
          { id: "nycbs-pharma-pa-completed", label: "Completed" },
        ];

        break;

      case storedFeature.includes(Features.PHARMA_PA):
        tabs = [
          {
            id: "pharma-pa-worklists",
            label: "Worklists",
            defaultIcon: <WorklistIcon />,
            selectedIcon: <WorklistIconFilled />,
          },
          // "Requests" (pa-search) hidden for the demo: it relies on live
          // BigQuery PA data (not the hackathon engine) and is redundant with
          // Worklists + Simulator. Re-enable by uncommenting.
          // {
          //   id: "pa-search",
          //   label: "Requests",
          //   defaultIcon: <RequestsIcon />,
          //   selectedIcon: <RequestsIconFilled />,
          // },
          {
            id: "pharma-analytics",
            label: "Analytics",
            defaultIcon: <AnalyticsIcon />,
            selectedIcon: <AnalyticsFilledIcon />,
          },
          {
            id: "pharma-agent-studio",
            label: "Agents",
            defaultIcon: <AgentStudioIcon />,
            selectedIcon: <AgentStudioIconFilled />,
          },
          {
            id: "pharma-pa-simulator",
            label: "Simulator",
            defaultIcon: <WorklistIcon />,
            selectedIcon: <WorklistIconFilled />,
          },
          // "QA Review" is now a tab inside the Simulator (Case Replay /
          // Workflow / QA Review), so it no longer needs its own nav item.
          // {
          //   id: "pharma-pa-qa-review",
          //   label: "QA Review",
          //   defaultIcon: <AnalyticsIcon />,
          //   selectedIcon: <AnalyticsFilledIcon />,
          // },
          // {
          //   id: "pharma-pa-status-internal",
          //   label: "Status",
          //   defaultIcon: <WorklistIcon />,
          //   selectedIcon: <WorklistIconFilled />,
          // },

          // {
          //   id: "pharma-pa-diff-data",
          //   label: "Validator",
          //   defaultIcon: <WorklistIcon />,
          //   selectedIcon: <WorklistIconFilled />,
          // },
        ];

        break;

      case storedFeature.includes(Features.EXTERNAL_WORKLIST):
        tabs = [
          {
            id: "external-analytics",
            label: "Analytics",
            defaultIcon: <AnalyticsIcon />,
            selectedIcon: <AnalyticsFilledIcon />,
          },
          {
            id: "external-worklist",
            label: "Orders",
            defaultIcon: <WorklistIcon />,
            selectedIcon: <WorklistIconFilled />,
          },
        ];

        break;

      default:
        tabs = [
          {
            id: "worklists",
            label: "Worklists",
            defaultIcon: <WorklistIcon />,
            selectedIcon: <WorklistIconFilled />,
          },
          {
            id: "claims-check",
            label: "Claims",
            defaultIcon: <ClaimsIcon />,
            selectedIcon: <ClaimsIconFilled />,
          },
          {
            id: "eligibilty-check",
            label: "Check EV",
            defaultIcon: <ClaimsIcon />,
            selectedIcon: <ClaimsIconFilled />,
          },
          {
            id: "analytics",
            label: "Analytics",
            defaultIcon: <AnalyticsIcon />,
            selectedIcon: <AnalyticsFilledIcon />,
          },
        ];

        break;
    }

    // if (
    //   providerDetails?.IsAdmin &&
    //   !storedFeature.includes(Features.EXTERNAL_WORKLIST)
    // ) {
    //   tabs.push({
    //     id: "configurations",
    //     label: "Config",
    //     defaultIcon: <ConfigIcon />,
    //     selectedIcon: <ConfigFilledIcon />,
    //   });
    // }

    setTabsList(tabs);
  };

  const logOutUser = async () => {
    await logEventToBigQuery({
      event_name: EventsName.LOGOUT,
      patient_id: "",
      user_id: user?.id,
      user_email: user?.email || "",
      order_id: "",
      org_id: orgId,
      additional_data: {
        screen_name: ScreenNamesForBigQuery.WORKLIST,
      },
    });
    logButtonClickEvent(ParamName.LOGOUT);
    dispatch(logOutUserFromFirebase());
    clearDataFromStorage();
  };

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="header--logo">
        <RisaLogoWhite height="52" width="52" />
      </div>
      <div className="header--worklist_tabs--container flex flex-1 flex-col gap-5">
        {tabsList.map((tab) => (
          <SingleTabWithLink
            key={tab.id}
            id={tab.id}
            label={tab.label}
            defaultIcon={tab.defaultIcon}
            selectedIcon={tab.selectedIcon}
          />
        ))}
      </div>
      <div className="header--actions-container mb-6 flex flex-col items-center justify-center gap-6">
        <div
          className="header-container--actions--profile-pic h-6 w-6 hover:scale-105 hover:cursor-pointer"
          onClick={() => {
            logEventToBigQuery({
              event_name: EventsName.SETTINGS_CLICKED,
              patient_id: "",
              user_id: user?.id ?? "",
              user_email: user?.email ?? "",
              order_id: "",
              org_id: orgId ?? "",
              additional_data: {
                screen_name: ScreenNamesForBigQuery.SETTINGS,
              },
            });
            navigate("/settings");
          }}
        >
          <img
            src={providerDetails?.ProfilePicUrl || "/user.png"}
            alt="profile-pic"
            className="header-container--actions--profile-pic__image h-full w-full rounded-full bg-white object-cover"
          />
        </div>
        <div className="header-container--actions--profile-pic--badge hover:scale-105 hover:cursor-pointer">
          <Exit onClick={logOutUser} stroke="white" />
        </div>
      </div>
    </div>
  );
};

export default HeaderVersion2;
