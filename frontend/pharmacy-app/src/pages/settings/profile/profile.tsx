import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Button,
  controlToastState,
  Select,
  SpinningLoader,
  TextInput,
  Toast,
} from "risa-oasis-ui_v2";
import { FirestoreService } from "../../../api/firebase/firestoreService";
import { FirestoreCollectionReference } from "../../../api/firebase/references";
import DragDropUpload from "../../../components/dragDropUpload/dragDropUpload";
import { HealthFacilityField } from "../../../enums/healthFacilityField";
import { LocalStorageKeys } from "../../../enums/localStorageKeys";
import { AppDispatch, RootState } from "../../../redux/store/store";
import { logError } from "../../../utils/customLogger";
import {
  getItemFromLocalStorage,
  setItemInLocalStorage,
} from "../../../utils/localStorageHelper";

interface HealthFacility {
  id: string;
  name: string;
  is_external_organization?: boolean;
}

interface InternalOrganization {
  facility_id: string;
  facility_name: string;
}

const profileDetialsInitialStates = {
  firstName: "",
  lastName: "",
  email: "",
  profilePicture: "",
};

const Profile = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { data: providerDetails } = useSelector(
    (state: RootState) => state.providerDetails,
  );

  const [profileDetails, setProfileDetails] = useState(
    profileDetialsInitialStates,
  );

  const [profileDetailsInitial, setProfileDetailsInitial] = useState(
    profileDetialsInitialStates,
  );

  const [healthFacilities, setHealthFacilities] = useState<HealthFacility[]>(
    [],
  );

  const [internalOrganizations, setInternalOrganizations] = useState<
    InternalOrganization[]
  >([]);
  const [isExternalOrganization, setIsExternalOrganization] = useState(false);
  const [fetchingInternalOrganizations, setFetchingInternalOrganizations] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [fetchingHealthFacility, setFetchingHealthFacility] = useState(false);
  const [saveButtonDisable, setSaveButtonDisable] = useState(true);

  const fetchHealthFacility = async () => {
    setFetchingHealthFacility(true);
    try {
      const healthFacilityData = (await FirestoreService.getAllDocuments(
        FirestoreCollectionReference.healthcareFacility(),
      )) as HealthFacility[];
      setHealthFacilities(healthFacilityData);
    } catch (error) {
      logError(error as Error, "Error fetching health facility data");
    } finally {
      setFetchingHealthFacility(false);
    }
  };

  const checkIfExternalOrganization = () => {
    const currentFacilityId = getItemFromLocalStorage(
      LocalStorageKeys.HEALTHCARE_FACILITY_ID,
    );
    if (!currentFacilityId || healthFacilities.length === 0) return false;

    const currentFacility = healthFacilities.find(
      (facility) => facility.id === currentFacilityId,
    );

    return currentFacility?.is_external_organization === true;
  };

  const fetchInternalOrganizations = async () => {
    const currentFacilityId = getItemFromLocalStorage(
      LocalStorageKeys.HEALTHCARE_FACILITY_ID,
    );
    if (!currentFacilityId) return;

    setFetchingInternalOrganizations(true);
    try {
      const planData = await FirestoreService.getAllDocuments(
        FirestoreCollectionReference.healthFacilityPlan(currentFacilityId),
      );

      if (planData && planData.length > 0) {
        const firstPlan = planData[0] as any;
        const internalOrgs = firstPlan.internal_organizations || [];
        setInternalOrganizations(internalOrgs);
      }
    } catch (error) {
      logError(error as Error, "Error fetching internal organizations");
    } finally {
      setFetchingInternalOrganizations(false);
    }
  };

  const updateInternalOrganizationId = async (facilityId: string) => {
    setLoading(true);
    try {
      setItemInLocalStorage(
        LocalStorageKeys.INTERNAL_ORGANIZATION_FACILITY_ID,
        facilityId,
      );
      // Redirect to external-worklist/final-worklist
      navigate("/external-worklist/final-worklist");
    } catch (error) {
      logError(
        error as Error,
        "Error updating internal organization facility id",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (data) => {
    if (data.name === "profile-first-name") {
      setProfileDetails({
        ...profileDetails,
        firstName: data.value,
      });
    } else if (data.name === "profile-last-name") {
      setProfileDetails({
        ...profileDetails,
        lastName: data.value,
      });
    }
  };

  const downloadedFilesURL = (url: string[]) => {
    if (url && url.length > 0 && url[0] !== "") {
      setProfileDetails({
        ...profileDetails,
        profilePicture: url[0],
      });
    }
  };

  const updateProfileDetails = async () => {
    setLoading(true);
    const fieldsToUpdate = {
      FirstName: profileDetails.firstName,
      LastName: profileDetails.lastName,
      ProfilePicUrl: profileDetails.profilePicture,
    };

    try {
      await FirestoreService.updateDocument(
        FirestoreCollectionReference.providers(),
        providerDetails?.DocID || "",
        fieldsToUpdate,
      );
      controlToastState("profile-update-success");
    } catch (error) {
      logError(error as Error, "Error updating profile details");
      controlToastState("profile-update-error");
      throw new Error("Error updating profile details");
    } finally {
      setLoading(false);
    }
  };

  const hasValueChanged = (currentProfileDetails) => {
    for (const key in currentProfileDetails) {
      if (currentProfileDetails.hasOwnProperty(key)) {
        if (currentProfileDetails[key] !== profileDetailsInitial[key]) {
          return true;
        }
      }
    }
    return false;
  };

  const updateFacilityId = async (facilityId: string) => {
    setLoading(true);
    try {
      await FirestoreService.updateDocument(
        FirestoreCollectionReference.providers(),
        providerDetails?.DocID || "",
        {
          FacilityId: facilityId,
        },
      );
    } catch (error) {
      logError(error as Error, "Error updating facility id");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (providerDetails) {
      console.log("providerDetails", providerDetails);
      setProfileDetails({
        firstName: providerDetails?.FirstName || "",
        lastName: providerDetails?.LastName || "",
        email: providerDetails?.EmailAddresses?.[0] || "",
        profilePicture: providerDetails?.ProfilePicUrl || "",
      });
      setProfileDetailsInitial({
        firstName: providerDetails?.FirstName || "",
        lastName: providerDetails?.LastName || "",
        email: providerDetails?.EmailAddresses?.[0] || "",
        profilePicture: providerDetails?.ProfilePicUrl || "",
      });
    }
  }, [providerDetails, dispatch]);

  useEffect(() => {
    setSaveButtonDisable(!hasValueChanged(profileDetails));
  }, [profileDetails]);

  useEffect(() => {
    fetchHealthFacility();
  }, []);

  useEffect(() => {
    if (healthFacilities.length > 0) {
      const isExternal = checkIfExternalOrganization();
      setIsExternalOrganization(isExternal);

      if (isExternal) {
        fetchInternalOrganizations();
      }
    }
  }, [healthFacilities]);

  const healthFacilityOptions = healthFacilities.map((healthFacility) => ({
    id: healthFacility[HealthFacilityField.ID],
    text: healthFacility[HealthFacilityField.NAME],
  }));

  const getCurrentHealthFacility = () => {
    if (providerDetails?.FacilityId && healthFacilities.length > 0) {
      return healthFacilities.find(
        (facility) =>
          facility[HealthFacilityField.ID] === providerDetails.FacilityId,
      );
    }
    return null;
  };

  const getCurrentInternalOrganization = () => {
    const selectedInternalOrgId = getItemFromLocalStorage(
      LocalStorageKeys.INTERNAL_ORGANIZATION_FACILITY_ID,
    );
    if (selectedInternalOrgId && internalOrganizations.length > 0) {
      return internalOrganizations.find(
        (org) => org.facility_id === selectedInternalOrgId,
      );
    }
    return null;
  };

  const internalOrganizationOptions = internalOrganizations.map((org) => ({
    value: org.facility_id,
    label: org.facility_name,
  }));

  const currentHealthFacility = getCurrentHealthFacility();
  const currentInternalOrganization = getCurrentInternalOrganization();

  return (
    <div className="profile--container">
      <div className="profile--container__header">Profile</div>
      <div className="profile--container__body">
        <div className="profile--container__body--firstName">
          <TextInput
            id={"profile-first-name"}
            label={"First Name"}
            defaultValue={profileDetails.firstName}
            onChange={(e) => {
              handleValueChange(e);
            }}
          />
        </div>
        <div className="profile--container__body--lastName">
          <TextInput
            id={"profile-last-name"}
            label={"Last Name"}
            defaultValue={profileDetails.lastName}
            onChange={(e) => {
              handleValueChange(e);
            }}
          />
        </div>
        <div className="profile--container__body--email">
          <TextInput
            id={"profile-email"}
            label={"Email"}
            defaultValue={profileDetails.email}
            readOnly={true}
          />
        </div>
        <div className="flex flex-row items-center gap-1">
          {fetchingHealthFacility ? (
            <>
              <div className="flex flex-row items-center gap-1">
                <SpinningLoader />
                Fetching healthcare facilities...
              </div>
            </>
          ) : isExternalOrganization ? (
            // Show Internal Health Facilities dropdown for external organizations
            <>
              {fetchingInternalOrganizations ? (
                <div className="flex flex-row items-center gap-1">
                  <SpinningLoader />
                  Fetching internal organizations...
                </div>
              ) : (
                <>
                  {providerDetails && providerDetails?.IsAdmin ? (
                    <Select
                      id="internal-organization"
                      options={internalOrganizationOptions}
                      label="Internal Health Facilities"
                      value={
                        currentInternalOrganization
                          ? currentInternalOrganization.facility_id
                          : ""
                      }
                      placeholder={
                        currentInternalOrganization
                          ? currentInternalOrganization.facility_name
                          : "Select Internal Health Facility"
                      }
                      onOptionChange={(data) => {
                        updateInternalOrganizationId(data.value);
                      }}
                    />
                  ) : (
                    <div className="flex flex-col gap-1">
                      <div className="text-xs"> Internal Health Facility</div>
                      <div className="text-small">
                        {currentInternalOrganization?.facility_name}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            // Show regular Health Facility dropdown for non-external organizations
            <>
              {providerDetails?.FacilityId === "L0ju12UjNQ7e2y7zYZm1" ? (
                <div className="flex flex-col gap-1">
                  <div className="text-xs">Health Facility</div>
                  <div className="text-small">
                    {currentHealthFacility
                      ? currentHealthFacility[HealthFacilityField.NAME]
                      : "N/A"}
                  </div>
                </div>
              ) : (
                <Select
                  id="health-facility"
                  options={healthFacilityOptions.map((healthFacility) => ({
                    value: healthFacility.id,
                    label: healthFacility.text,
                  }))}
                  label="Health Facility"
                  placeholder={
                    currentHealthFacility
                      ? currentHealthFacility[HealthFacilityField.NAME]
                      : "Select Health Facility"
                  }
                  onOptionChange={(data) => {
                    const selectedHealthFacility = healthFacilities.find(
                      (healthFacility) => healthFacility.id === data.value,
                    );
                    updateFacilityId(selectedHealthFacility?.id || "");
                  }}
                />
              )}
            </>
          )}
        </div>
        {loading && (
          <div className="mt-1 flex h-screen w-screen items-center gap-2">
            <SpinningLoader />
            Changing healthcare facility...
          </div>
        )}
        <div className="profile--container__body--profile-pic-container">
          <div className="profile--container__body--profile-pic-container__heading">
            Profile Picture
          </div>
          <div className="profile--container__body--profile-pic-container__content">
            <div className="profile--container__body--profile-pic-container__content--image">
              <img
                src={profileDetails.profilePicture || "/user.png"}
                alt="profile-pic"
                className="profile--container__body--profile-pic-container__content--image__image"
              />
            </div>

            <div className="profile--container__body--profile-pic-container__content--upload">
              <DragDropUpload
                id="profile_picture"
                subText="Supported file format .jpg, .png not exceeding 5MB "
                multipleFilesAllowed={false}
                maxFileSize={5 * 1024 * 1024}
                // fileListLength={}
                downloadedURL={downloadedFilesURL}
                allowedFileTypes={[".jpg", ".png"]}
                onSuccessfullyUploaded={loading}
                filePath={`user/providers/${providerDetails?.DocID}/profile_picture`}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="profile--container__footer">
        <Button
          disabled={false}
          onClick={() => {}}
          buttonType={"secondary"}
          size={"medium"}
        >
          {" "}
          Cancel
        </Button>
        <Button
          disabled={saveButtonDisable}
          buttonType={"primary"}
          size={"medium"}
          onClick={updateProfileDetails}
        >
          Save
          {loading && <SpinningLoader />}
        </Button>
      </div>
      <Toast
        type={"error"}
        header={"Profile update failed!"}
        id={"profile-update-error"}
      />
      <Toast
        type={"success"}
        header={"Profile updated successfully!"}
        id={"profile-update-success"}
      />
    </div>
  );
};

export default Profile;
