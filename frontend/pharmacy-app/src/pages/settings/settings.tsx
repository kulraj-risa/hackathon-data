import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Outlet, useNavigate } from "react-router-dom";
import { ToggleSwitch } from "risa-oasis-ui_v2";
import SingleSideTab from "../../components/singleSideTab/singleSideTab";
import { LocalStorageKeys } from "../../enums/localStorageKeys";
import { RootState } from "../../redux/store/store";
import BackArrowBlue from "../../svg/back-arrow-blue";
import {
  getItemFromLocalStorage,
  setItemInLocalStorage,
} from "../../utils/localStorageHelper";

const Settings = () => {
  const [viewLegacy, setViewLegacy] = useState(false);
  const [isExternalWorklist, setIsExternalWorklist] = useState(false);
  const [features, setFeatures] = useState<string[]>([]);

  const sideNavElementsForAdmin = [
    { id: "profile", label: "Profile" },
    { id: "security", label: "Security" },
  ];

  const sideNavElementsForNonAdmin = [
    { id: "profile", label: "Profile" },
    { id: "security", label: "Security" },
  ];

  const { data: provider } = useSelector(
    (state: RootState) => state.providerDetails,
  );

  const navigate = useNavigate();

  useEffect(() => {
    const storedViewLegacy = getItemFromLocalStorage(
      LocalStorageKeys.VIEW_LEGACY,
    );
    setViewLegacy(storedViewLegacy !== null ? storedViewLegacy : false);

    const storedFeatures = getItemFromLocalStorage(LocalStorageKeys.FEATURES);
    setFeatures(storedFeatures !== null ? storedFeatures : []);

    const storedExternalWorklist = getItemFromLocalStorage(
      LocalStorageKeys.FEATURES,
    );
    setIsExternalWorklist(
      storedExternalWorklist !== null ? storedExternalWorklist : false,
    );
  }, []);

  const handleViewLegacyChange = (data: {
    name: string;
    required: boolean;
    value: boolean;
  }) => {
    setViewLegacy(data.value);
    setItemInLocalStorage(LocalStorageKeys.VIEW_LEGACY, data.value);
    navigate("/");
    window.location.reload();
  };

  const navigateToWorklists = () => {
    navigate(-1);
  };

  // Check if externalWorklist feature is enabled
  const hasExternalWorklistFeature = features.includes("externalWorklist");

  return (
    <div className="settings--container">
      <div
        className="settings--container--header"
        onClick={navigateToWorklists}
      >
        <BackArrowBlue />
        <p>Go back</p>
      </div>
      <div className="settings--container--contents">
        <div className="settings--container--contents__left">
          {provider?.IsAdmin ? (
            <>
              {" "}
              {sideNavElementsForAdmin.map((sideNavElement) => (
                <SingleSideTab
                  key={sideNavElement.id}
                  id={sideNavElement.id}
                  label={sideNavElement.label}
                />
              ))}
            </>
          ) : (
            <>
              {" "}
              {sideNavElementsForNonAdmin.map((sideNavElement) => (
                <SingleSideTab
                  key={sideNavElement.id}
                  id={sideNavElement.id}
                  label={sideNavElement.label}
                />
              ))}
            </>
          )}
        </div>
        <div className="settings--container--contents__right">
          <Outlet />
        </div>

        {hasExternalWorklistFeature && (
          <div className="flex flex-row items-start justify-center">
            <div className="flex flex-row items-center justify-center gap-2">
              <div className="mb-2 text-sm text-primaryGray-11">
                View Legacy Version{" "}
              </div>
              <ToggleSwitch
                key={viewLegacy ? "legacy-on" : "legacy-off"}
                id="view-legacy"
                defaultChecked={viewLegacy}
                onChangeEmit={handleViewLegacyChange}
              />
            </div>
          </div>
        )}
      </div>
      <div className="app-version text-small font-normal text-gray-500">
        <p>Version {process.env.REACT_APP_VERSION}</p>
      </div>
    </div>
  );
};

export default Settings;
