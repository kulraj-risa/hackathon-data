import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { Button, Select, TextInput } from "risa-oasis-ui_v2";
import { FirestoreService } from "../../api/firebase/firestoreService";
import { FirestoreCollectionReference } from "../../api/firebase/references";
import { DetailsCard } from "../../components/detailsCard/detailsCard";
import { LoaderMessage } from "../../components/loaderMessage/loaderMessage";
import { CredentialDetailsModal } from "../../components/modals/credentialDetailsModal/credentialDetailsModal";
import { CredentialConfigModel } from "../../data-model/credentialConfigModel";
import { HealthFacilityField } from "../../enums/healthFacilityField";

import { fetchPortalPassword } from "../../api/postCall/fetchPortalPassword";
import { fetchClientFromFirebase } from "../../redux/slice/clientConfiguration";
import { fetchCredentialConfig } from "../../redux/slice/credentialConfigSlice";
import { AppDispatch, RootState } from "../../redux/store/store";
import { decryptPassword } from "../../utils/SimplePasswordCrypto";

type CredentialWithId = CredentialConfigModel & { id: string };

interface HealthFacility {
  id: string;
  name: string;
}

const CredentialsConfig = () => {
  const { credentials, isLoading, error } = useSelector(
    (state: RootState) => state.credentialConfig,
  );

  const { data: clientName } = useSelector(
    (state: RootState) => state.clientConfiguration,
  );

  const { user } = useSelector(
    (state: RootState) => state.firebaseAuthentication,
  );

  const [credentialDetails, setCredentialDetails] =
    useState<CredentialWithId | null>(null);
  const [selectedCredentialId, setSelectedCredentialId] = useState<
    string | null
  >(null);
  const [detailsCardData, setDetailsCardData] = useState<any[]>([]);
  const [isCredentialDetailsModalOpen, setIsCredentialDetailsModalOpen] =
    useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [passwordState, setPasswordState] = useState({
    isVisible: false,
    value: "",
    isLoading: false,
  });
  const [healthFacilities, setHealthFacilities] = useState<HealthFacility[]>(
    [],
  );

  // Changed from selectedOrgId to selectedClientId
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const { id } = useParams();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(fetchCredentialConfig());
    dispatch(fetchClientFromFirebase());
    fetchHealthFacility();
  }, []);

  const handleCredentialClick = (credential: CredentialWithId) => {
    if (credential?.id) {
      setSelectedCredentialId(credential?.id);
      setCredentialDetails(credential);
    }
  };

  const handleAddClick = () => {
    setIsEditMode(false);
    setIsCredentialDetailsModalOpen(true);
  };

  const handleEditClick = () => {
    setIsEditMode(true);
    setIsCredentialDetailsModalOpen(true);
  };

  const fetchHealthFacility = async () => {
    try {
      const healthFacilityData = (await FirestoreService.getDocumentsByQuery(
        FirestoreCollectionReference.healthcareFacility(),
        [],
      )) as HealthFacility[];
      setHealthFacilities(healthFacilityData);
    } catch (error) {
      console.error("Error fetching health facility data:", error);
    }
  };

  const healthFacilityOptions = healthFacilities.map((healthFacility) => ({
    id: healthFacility[HealthFacilityField.ID],
    text: healthFacility[HealthFacilityField.NAME],
  }));

  // Create client options from clientName data
  const clientOptions = clientName.map((client) => ({
    value: client.DocId ?? "",
    label: client.name ?? "",
  }));

  // Changed from handleOrganizationChange to handleClientChange
  const handleClientChange = (option: any) => {
    setSelectedClientId(option.value);
    setSelectedCredentialId(null);
    setCredentialDetails(null);
    setPasswordState({
      isVisible: false,
      value: "",
      isLoading: false,
    });
  };

  // Filter credentials based on selected client instead of organization
  const filteredCredentials =
    credentials?.filter((credential) => {
      if (!selectedClientId) return false;
      return credential.client_id === selectedClientId;
    }) || [];

  const togglePasswordVisibility = async () => {
    if (!passwordState.isVisible && credentialDetails?.credential_id) {
      setPasswordState((prev) => ({ ...prev, isLoading: true }));
      try {
        const response = await fetchPortalPassword(
          credentialDetails.credential_id,
        );
        const decryptedPassword = await decryptPassword(response.secret_value);
        setPasswordState({
          isVisible: true,
          value: decryptedPassword,
          isLoading: false,
        });
      } catch (error) {
        console.error("Error fetching or decrypting password:", error);
        setPasswordState((prev) => ({
          ...prev,
          isVisible: false,
          isLoading: false,
        }));
      }
    } else {
      setPasswordState({
        isVisible: false,
        value: "",
        isLoading: false,
      });
    }
  };

  // Updated useEffect to work with client selection
  useEffect(() => {
    if (credentials && credentials.length > 0 && selectedClientId) {
      const filteredCreds = credentials.filter(
        (credential) => credential.client_id === selectedClientId,
      );

      if (filteredCreds.length > 0) {
        if (id) {
          const foundCredential = filteredCreds.find((cred) => cred.id === id);
          if (foundCredential) {
            handleCredentialClick(foundCredential);
          } else {
            handleCredentialClick(filteredCreds[0]);
          }
        } else {
          handleCredentialClick(filteredCreds[0]);
        }
      }
    }
  }, [credentials, selectedClientId, id]);

  useEffect(() => {
    setPasswordState({
      isVisible: false,
      value: "",
      isLoading: false,
    });
  }, [selectedCredentialId]);

  useEffect(() => {
    if (credentialDetails) {
      const detailsData = [
        {
          header: "Client",
          text: credentialDetails.client_name || "--",
          textColor: "text-primaryGray-11",
          fontWeight: "font-semibold",
        },
        {
          header: "Organization ID",
          text: credentialDetails.org_id || "--",
          textColor: "text-primaryGray-11",
          fontWeight: "font-semibold",
        },
        {
          header: "Org Name",
          text: credentialDetails.org_name || "--",
          textColor: "text-primaryGray-11",
          fontWeight: "font-semibold",
        },
        {
          header: "Portal ID",
          text: credentialDetails.portal_id || "--",
          textColor: "text-primaryGray-11",
          fontWeight: "font-semibold",
        },
        {
          header: "Facility Name",
          text: credentialDetails.facility_name || "--",
          textColor: "text-primaryGray-11",
          fontWeight: "font-semibold",
        },
        {
          header: "Email",
          text: credentialDetails.email || "--",
          textColor: "text-primaryGray-11",
          fontWeight: "font-semibold",
        },
        {
          header: "Username",
          text: credentialDetails.username || "--",
          textColor: "text-primaryGray-11",
          fontWeight: "font-semibold",
        },
        {
          header: "Active Status",
          text: credentialDetails.is_active ? "Yes" : "No",
          textColor: "text-primaryGray-11",
          fontWeight: "font-semibold",
        },
        {
          header: "Queue Enabled",
          text: credentialDetails.is_queue ? "Yes" : "No",
          textColor: "text-primaryGray-11",
          fontWeight: "font-semibold",
        },
        {
          header: "Subject Regex",
          text: credentialDetails.subject_regex || "--",
          textColor: "text-primaryGray-11",
          fontWeight: "font-semibold",
        },
        {
          header: "Credential ID",
          text: credentialDetails.credential_id || "--",
          textColor: "text-primaryGray-11",
          fontWeight: "font-semibold",
        },
        {
          header: "Created At",
          text: credentialDetails.created_at
            ? new Date(credentialDetails.created_at).toLocaleDateString()
            : "--",
          textColor: "text-primaryGray-11",
          fontWeight: "font-semibold",
        },
        {
          header: "Updated At",
          text: credentialDetails.updated_at
            ? new Date(credentialDetails.updated_at).toLocaleDateString()
            : "--",
          textColor: "text-primaryGray-11",
          fontWeight: "font-semibold",
        },
        {
          header: "Updated By",
          text: credentialDetails.updated_by || "--",
          textColor: "text-primaryGray-11",
          fontWeight: "font-semibold",
        },
      ];
      setDetailsCardData(detailsData);
    }
  }, [credentialDetails]);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden p-2">
      <div className="flex h-full flex-col overflow-hidden">
        <div className="border-b border-primaryGray-14 pb-2 text-h11 font-semibold">
          Credentials Configuration
        </div>

        {isLoading ? (
          <div className="h-full flex-1 items-center justify-center">
            <LoaderMessage message="Loading form configurations..." />
          </div>
        ) : (
          <div className="flex w-full flex-1 flex-col gap-3 overflow-hidden">
            <div className="mt-2">
              <Select
                id="client-name"
                onOptionChange={handleClientChange}
                label="Select a Client to view credentials"
                placeholder={
                  selectedClientId
                    ? clientName.find(
                        (client) => client.DocId === selectedClientId,
                      )?.name || "Select Client"
                    : "Select Client"
                }
                options={clientOptions}
              />
            </div>

            {selectedClientId && (
              <>
                <div className="flex justify-end gap-3">
                  <Button
                    buttonType="secondary"
                    size="medium"
                    disabled={false}
                    onClick={handleAddClick}
                  >
                    Add Portal
                  </Button>
                  <Button
                    buttonType="primary"
                    size="medium"
                    disabled={!selectedCredentialId}
                    onClick={handleEditClick}
                  >
                    Edit Portal Details
                  </Button>
                </div>
                <div className="flex h-full w-full flex-1 flex-row gap-3 overflow-hidden">
                  <div className="flex w-1/2 flex-col">
                    <div className="mb-2 font-semibold">Portal Name</div>
                    <div className="flex flex-col gap-4 overflow-auto p-1">
                      {filteredCredentials && filteredCredentials.length > 0 ? (
                        filteredCredentials.map(
                          (credential: CredentialWithId) => (
                            <div
                              key={credential?.id}
                              className={`flex h-14 w-full cursor-pointer flex-col justify-center rounded-lg border border-primaryGray-14 p-3 font-semibold hover:bg-gray-50 ${
                                selectedCredentialId === credential?.id
                                  ? "border-primaryGray-11 shadow-lg"
                                  : ""
                              }`}
                              onClick={() => handleCredentialClick(credential)}
                            >
                              {credential?.portal_name}
                            </div>
                          ),
                        )
                      ) : (
                        <div className="flex h-full items-center justify-center text-gray-500">
                          No Portals found for this client
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex h-full w-1/2 flex-col">
                    {filteredCredentials && filteredCredentials.length > 0 ? (
                      <div className="flex h-full flex-col">
                        <div className="flex min-h-0 items-center justify-between pl-2">
                          <div className="mb-2 font-semibold">
                            Credential Details
                          </div>
                        </div>
                        <div className="flex h-auto flex-1 flex-col overflow-auto p-1">
                          <div className="rounded bg-gray-100 text-xl">
                            <DetailsCard
                              details={detailsCardData}
                              elementsInOneRow={2}
                              showBorder={true}
                            />
                          </div>

                          <div className="credential-details-password-container mt-2 flex w-full flex-row items-end gap-3 py-3">
                            <div className="w-1/2 items-center gap-2">
                              <TextInput
                                label="Password"
                                defaultValue={
                                  passwordState.isVisible
                                    ? passwordState.value
                                    : "••••••••••••••••"
                                }
                                id="password"
                                readOnly={true}
                              />
                            </div>

                            <Button
                              buttonType="primary"
                              size="medium"
                              disabled={
                                passwordState.isLoading ||
                                !credentialDetails?.credential_id
                              }
                              onClick={togglePasswordVisibility}
                            >
                              {passwordState.isLoading
                                ? "Loading..."
                                : passwordState.isVisible
                                  ? "Hide Password"
                                  : "Show Password"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-10 flex h-full justify-center text-gray-500">
                        No credentials found for this client
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {isCredentialDetailsModalOpen && (
          <CredentialDetailsModal
            isOpen={isCredentialDetailsModalOpen}
            onClose={() => setIsCredentialDetailsModalOpen(false)}
            isEditMode={isEditMode}
            credentialData={credentialDetails}
            clientId={selectedClientId?.toString() ?? ""}
            client_Name={
              selectedClientId
                ? clientName.find((client) => client.DocId === selectedClientId)
                    ?.name
                : ""
            }
          />
        )}
      </div>
    </div>
  );
};

export default CredentialsConfig;
