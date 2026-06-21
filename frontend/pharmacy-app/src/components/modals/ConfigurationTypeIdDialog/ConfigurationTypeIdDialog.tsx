import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  closeModal,
  Modal,
  openModal,
  SpinningLoader,
  TextInput,
} from "risa-oasis-ui_v2";
import "./ConfigurationTypeIdDialog.scss";

interface ConfigurationTypeIdDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (configTypeId: string) => Promise<void>;
  parentPath: string;
  loading?: boolean;
}

// Use a constant dialogId
const CONFIG_TYPE_ID_DIALOG_ID = "config-type-id-dialog";

const ConfigurationTypeIdDialog: React.FC<ConfigurationTypeIdDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  parentPath,
  loading = false,
}) => {
  // Track if we've actually opened the modal
  const isModalOpen = useRef(false);
  const [configTypeId, setConfigTypeId] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Open or close the modal when isOpen changes
  useEffect(() => {
    if (isOpen && !isModalOpen.current) {
      // First time opening
      openModal(CONFIG_TYPE_ID_DIALOG_ID);
      isModalOpen.current = true;
    } else if (!isOpen && isModalOpen.current) {
      // Close when parent says we should close
      closeModal(CONFIG_TYPE_ID_DIALOG_ID);
      isModalOpen.current = false;
      // Reset state
      setConfigTypeId("");
      setError("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleInputChange = (data: any) => {
    setConfigTypeId(data.value);
    // Clear any error when user types
    if (error) setError("");
  };

  const handleSubmit = async () => {
    // Validate configuration type ID
    if (!configTypeId.trim()) {
      setError("Configuration Type ID is required");
      return;
    }

    // Only allow alphanumeric chars, hyphens, and underscores
    if (!/^[a-zA-Z0-9_-]+$/.test(configTypeId)) {
      setError(
        "Configuration Type ID can only contain letters, numbers, hyphens, and underscores",
      );
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await onSubmit(configTypeId);
      // Dialog will be closed by the handler if successful
    } catch (error) {
      console.error("Error in dialog submit:", error);
      setError("Failed to create configuration type. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Modal
      dialogId={CONFIG_TYPE_ID_DIALOG_ID}
      title="New Configuration Type"
      onCancel={handleCancel}
      onSave={() => {}}
      saveButtonText=""
      cancelText=""
      hideFooter={true}
    >
      <div className="config-type-id-dialog">
        <div className="parent-path">
          <p>
            Parent Path: <strong>{parentPath}</strong>
          </p>
        </div>

        <div className="form-group">
          <TextInput
            id="configTypeId"
            label="Configuration Type ID"
            placeholder="Enter configuration type ID"
            onChange={handleInputChange}
            onBlur={handleInputChange}
            required
          />
          {error && <p className="error-message">{error}</p>}
        </div>

        <p className="helper-text">
          The configuration type ID will be used as the identifier in Firestore.
          Only use letters, numbers, hyphens, and underscores.
        </p>

        <div className="dialog-footer">
          <Button
            buttonType="secondary"
            size="medium"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          {isSubmitting ? (
            <div className="loading-button">
              <SpinningLoader />
            </div>
          ) : (
            <Button
              buttonType="primary"
              size="medium"
              onClick={handleSubmit}
              disabled={false}
            >
              Create
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ConfigurationTypeIdDialog;
