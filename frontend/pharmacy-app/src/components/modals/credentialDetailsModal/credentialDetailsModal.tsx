import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  closeModal,
  controlToastState,
  Modal,
  openModal,
  Select,
  TextInput,
} from "risa-oasis-ui_v2";
import { FirestoreService } from "../../../api/firebase/firestoreService";
import { FirestoreCollectionReference } from "../../../api/firebase/references";

import { fetchPortalPassword } from "../../../api/postCall/fetchPortalPassword";
import { CredentialConfigModel } from "../../../data-model/credentialConfigModel";
import { HealthFacilityField } from "../../../enums/healthFacilityField";

import { AppDispatch, RootState } from "../../../redux/store/store";

import { addEditPortalCredential } from "../../../api/postCall/addEditPortalCredential";
import { fetchClientFromFirebase } from "../../../redux/slice/clientConfiguration";
import { fetchCredentialConfig } from "../../../redux/slice/credentialConfigSlice";
import EditPencilIcon from "../../../svg/editPencil";
import { encryptPassword } from "../../../utils/SimplePasswordCrypto";
import CustomRadioButton from "../../customRadioButton/customRadioButton";

type CredentialWithId = CredentialConfigModel & { id: string };

interface CredentialDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditMode?: boolean;
  credentialData?: CredentialWithId | null;
  clientId?: string;
  client_Name?: string;
}

interface HealthFacility {
  id: string;
  name: string;
}

interface EmailOption {
  data: string[];
}

export const CredentialDetailsModal = ({
  isOpen,
  onClose,
  isEditMode = false,
  credentialData = null,
  clientId,
  client_Name,
}: CredentialDetailsModalProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isPasswordEditing, setIsPasswordEditing] = useState(false);
  const [existingEncryptedPassword, setExistingEncryptedPassword] =
    useState("");
  const [formData, setFormData] = useState({
    org_id: "",
    portal_name: "",
    portal_url: "",
    facility_name: "",
    username: "",
    password: "",
    mfa_present: "",
    is_queue: "",
    is_active: "",
    is_available: "",
    email: "",
    body_regex: "",
    subject_regex: "",
    portal_id: "",
  });

  const [modalEmailOptions, setModalEmailOptions] = useState<string[]>([]);
  const [healthFacilities, setHealthFacilities] = useState<HealthFacility[]>(
    [],
  );

  const dispatch = useDispatch<AppDispatch>();

  const { data: clientName } = useSelector(
    (state: RootState) => state.clientConfiguration,
  );

  const { user } = useSelector(
    (state: RootState) => state.firebaseAuthentication,
  );

  const fetchEmailOptions = async () => {
    try {
      const emailOptions = await FirestoreService.getAllDocuments(
        FirestoreCollectionReference.emailOptions(),
      );
      const emailOptionsData = emailOptions as EmailOption[];
      setModalEmailOptions(emailOptionsData[0]?.data || []);
    } catch (error) {
      console.error("Error fetching email options:", error);
    }
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

  const fetchExistingPassword = async () => {
    if (isEditMode && credentialData?.credential_id) {
      try {
        const response = await fetchPortalPassword(
          credentialData.credential_id,
        );
        setExistingEncryptedPassword(response.secret_value);
      } catch (error) {
        console.error("Error fetching existing password:", error);
      }
    }
  };

  useEffect(() => {
    fetchEmailOptions();
    fetchHealthFacility();
    dispatch(fetchClientFromFirebase());
    if (isEditMode) {
      fetchExistingPassword();
    }
  }, [isOpen, isEditMode]);

  const healthFacilityOptions = healthFacilities.map((healthFacility) => ({
    id: healthFacility[HealthFacilityField.ID],
    text: healthFacility[HealthFacilityField.NAME],
  }));

  const clientOptions = useMemo(() => {
    return clientName.map((client) => ({
      label: client.name ?? "",
      value: client.DocId ?? "",
    }));
  }, [clientName]);

  useEffect(() => {
    if (isOpen) {
      openModal("credential-details-modal");
    } else {
      closeModal("credential-details-modal");
    }
  }, [isOpen]);

  useEffect(() => {
    if (isEditMode && credentialData) {
      setFormData({
        org_id: credentialData.org_id || "",
        portal_name: credentialData.portal_name || "",
        portal_url: credentialData.portal_url || "",
        facility_name: credentialData.facility_name || "",
        username: credentialData.username || "",
        password: "",
        mfa_present: credentialData.is_queue ? "true" : "false",
        is_queue: credentialData.is_queue ? "true" : "false",
        is_active: credentialData.is_active ? "true" : "false",
        is_available: credentialData.is_available ? "true" : "false",
        email: credentialData.email || "",
        body_regex: credentialData.body_regex || "",
        subject_regex: credentialData.subject_regex || "",
        portal_id: credentialData.portal_id || "",
      });
      setIsPasswordEditing(false);
    } else {
      setFormData({
        org_id: "",
        portal_name: "",
        portal_url: "",
        facility_name: "",
        username: "",
        password: "",
        mfa_present: "",
        is_queue: "",
        is_active: "",
        is_available: "",
        email: "",
        body_regex: "",
        subject_regex: "",
        portal_id: "",
      });
      setIsPasswordEditing(false);
    }
  }, [isEditMode, credentialData]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "mfa_present" && {
        is_queue: value === "true" ? "true" : "false",
      }),
      ...(field === "is_queue" && {
        mfa_present: value === "true" ? "true" : "false",
      }),
    }));
  };

  const handlePasswordEditClick = () => {
    setIsPasswordEditing(true);
    setFormData((prev) => ({ ...prev, password: "" }));
  };

  const handlePasswordForEditMode = async (): Promise<string> => {
    if (
      isPasswordEditing &&
      formData.password &&
      formData.password.trim() !== ""
    ) {
      try {
        return await encryptPassword(formData.password);
      } catch (encryptionError) {
        console.error("Error encrypting password:", encryptionError);
        throw encryptionError;
      }
    } else {
      return existingEncryptedPassword;
    }
  };

  const handlePasswordForAddMode = async (): Promise<string> => {
    if (formData.password && formData.password.trim() !== "") {
      try {
        return await encryptPassword(formData.password);
      } catch (encryptionError) {
        console.error("Error encrypting password:", encryptionError);
        throw encryptionError;
      }
    }
    return "";
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let passwordToSend = "";

      if (isEditMode) {
        passwordToSend = await handlePasswordForEditMode();
      } else {
        passwordToSend = await handlePasswordForAddMode();
      }

      const selectedOrg = healthFacilities.find(
        (org) => org[HealthFacilityField.ID] === formData.org_id,
      );
      const orgName = selectedOrg?.[HealthFacilityField.NAME] || "";

      const requestData = {
        client_name: client_Name,
        client_id: clientId,
        portal_name: formData.portal_name,
        org_id: formData.org_id,
        org_name: orgName,
        portal_id: formData.portal_id || undefined,
        facility_name: formData.facility_name || undefined,
        email: formData.email,
        username: formData.username,
        password: passwordToSend,
        is_active: formData.is_active === "true",
        is_queue: formData.is_queue === "true",
        is_available: isEditMode ? formData.is_available === "true" : true,
        body_regex: formData.body_regex || undefined,
        subject_regex: formData.subject_regex || undefined,
        portal_url: formData.portal_url || undefined,
        credential_id:
          isEditMode && credentialData?.credential_id
            ? credentialData.credential_id
            : undefined,
        ...(user?.email && { updated_by: user?.email }),
        updated_at: new Date().toISOString(),
      };

      const response = await addEditPortalCredential(requestData);

      if (response.status === "success") {
        controlToastState("credential_save_success");
        setIsSaving(false);
        dispatch(fetchCredentialConfig());
        onClose();
      } else {
        controlToastState("credential_save_error");
      }
    } catch (error) {
      console.error("Error saving credential:", error);
      controlToastState("credential_save_error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      dialogId="credential-details-modal"
      title={isEditMode ? "Edit Credential Details" : "Add New Credential"}
      onClose={onClose}
      onSave={handleSave}
      saveButtonText={isSaving ? "Saving..." : "Save"}
      cancelText="Cancel"
      heightPercentage={70}
      disableSave={isSaving}
    >
      <div className="flex flex-col gap-2">
        <Select
          label="Organization ID"
          placeholder={
            formData.org_id
              ? healthFacilityOptions.find(
                  (healthFacility) => healthFacility.id === formData.org_id,
                )?.text || "Select Organization"
              : "Select Organization"
          }
          onOptionChange={(option) => handleInputChange("org_id", option.value)}
          id="org_id"
          options={healthFacilityOptions.map((healthFacility) => ({
            value: healthFacility.id,
            label: healthFacility.text,
          }))}
        />
        <TextInput
          label="Portal Name"
          defaultValue={formData.portal_name}
          id="portal_name"
          onChange={(data) => handleInputChange("portal_name", data.value)}
        />
        <TextInput
          label="Portal URL"
          defaultValue={formData.portal_url}
          id="portal_url"
          onChange={(data) => handleInputChange("portal_url", data.value)}
        />
        <TextInput
          label="Facility Name"
          defaultValue={formData.facility_name}
          id="facility_name"
          onChange={(data) => handleInputChange("facility_name", data.value)}
        />
        <TextInput
          label="Username"
          defaultValue={formData.username}
          id="username"
          onChange={(data) => handleInputChange("username", data.value)}
        />
        <div className="flex w-full flex-row items-center gap-3">
          <div className="w-full">
            <TextInput
              label="Password"
              defaultValue=""
              id="password"
              readOnly={isEditMode && !isPasswordEditing}
              placeholder={
                isEditMode && !isPasswordEditing
                  ? "••••••••••••••••"
                  : "Enter password"
              }
              onChange={(data) => handleInputChange("password", data.value)}
            />
          </div>
          {isEditMode && (
            <div
              className="mt-5 cursor-pointer"
              onClick={handlePasswordEditClick}
            >
              <EditPencilIcon height={20} width={20} />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <div className="mt-1 text-xs">MFA Present</div>
          <div className="flex flex-row gap-3">
            <CustomRadioButton
              name="mfa_present"
              label="Yes"
              value="true"
              checked={formData.mfa_present === "true"}
              onChange={() => handleInputChange("mfa_present", "true")}
            />
            <CustomRadioButton
              name="mfa_present"
              label="No"
              value="false"
              checked={formData.mfa_present === "false"}
              onChange={() => handleInputChange("mfa_present", "false")}
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="mt-1 text-xs">Is Active</div>
          <div className="flex flex-row gap-3">
            <CustomRadioButton
              name="is_active"
              label="Yes"
              value="true"
              checked={formData.is_active === "true"}
              onChange={() => handleInputChange("is_active", "true")}
            />
            <CustomRadioButton
              name="is_active"
              label="No"
              value="false"
              checked={formData.is_active === "false"}
              onChange={() => handleInputChange("is_active", "false")}
            />
          </div>
        </div>

        <Select
          label="Email"
          placeholder={formData.email || "Select Email"}
          onOptionChange={(option) => handleInputChange("email", option.value)}
          id="email"
          options={modalEmailOptions.map((email) => ({
            label: email,
            value: email,
          }))}
        />
        <TextInput
          label="Body Regex"
          defaultValue={formData.body_regex}
          id="body_regex"
          onChange={(data) => handleInputChange("body_regex", data.value)}
        />
        <TextInput
          label="Subject Regex"
          defaultValue={formData.subject_regex}
          id="subject_regex"
          onChange={(data) => handleInputChange("subject_regex", data.value)}
        />
        <TextInput
          label="Portal ID"
          defaultValue={formData.portal_id}
          id="portal_id"
          onChange={(data) => handleInputChange("portal_id", data.value)}
        />
      </div>
    </Modal>
  );
};
