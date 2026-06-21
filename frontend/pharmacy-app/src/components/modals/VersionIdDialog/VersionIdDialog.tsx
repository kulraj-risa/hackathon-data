import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  closeModal,
  Modal,
  openModal,
  Select,
  SpinningLoader,
  TextInput,
} from "risa-oasis-ui_v2";
import "./VersionIdDialog.scss";

interface VersionIdDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (versionId: string, sourceVersionId?: string) => Promise<void>;
  parentPath: string;
  loading?: boolean;
  existingVersions: { id: string; name?: string }[];
}

// Use a constant dialogId
const VERSION_ID_DIALOG_ID = "version-id-dialog";

const VersionIdDialog: React.FC<VersionIdDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  parentPath,
  loading = false,
  existingVersions = [],
}) => {
  // Track if we've actually opened the modal
  const isModalOpen = useRef(false);
  const [versionId, setVersionId] = useState("");
  const [sourceVersionId, setSourceVersionId] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Open or close the modal when isOpen changes
  useEffect(() => {
    if (isOpen && !isModalOpen.current) {
      // First time opening
      openModal(VERSION_ID_DIALOG_ID);
      isModalOpen.current = true;
    } else if (!isOpen && isModalOpen.current) {
      // Close when parent says we should close
      closeModal(VERSION_ID_DIALOG_ID);
      isModalOpen.current = false;
      // Reset state
      setVersionId("");
      setSourceVersionId("");
      setError("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleVersionIdChange = (data: any) => {
    setVersionId(data.value);
    // Clear any error when user types
    if (error) setError("");
  };

  const handleSourceVersionChange = (data: any) => {
    setSourceVersionId(data.value);
  };

  const handleSubmit = async () => {
    // Validate version ID
    if (!versionId.trim()) {
      setError("Version ID is required");
      return;
    }

    // Only allow alphanumeric chars, hyphens, and underscores
    if (!/^[a-zA-Z0-9_-]+$/.test(versionId)) {
      setError(
        "Version ID can only contain letters, numbers, hyphens, and underscores",
      );
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await onSubmit(versionId, sourceVersionId || undefined);
      // Dialog will be closed by the handler if successful
    } catch (error) {
      console.error("Error in dialog submit:", error);
      setError("Failed to create version. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  // Create options for select input, filtering out 'latest'
  const versionOptions = [
    { value: "", label: "Create Empty Version" },
    ...existingVersions
      // .filter(v => v.id !== 'latest')
      .map((version) => ({
        value: version.id,
        label: version.name || version.id,
      })),
  ];

  return (
    <Modal
      dialogId={VERSION_ID_DIALOG_ID}
      title="New Version"
      onCancel={handleCancel}
      onSave={() => {}}
      saveButtonText=""
      cancelText=""
      hideFooter={true}
    >
      <div className="version-id-dialog">
        <div className="parent-path">
          <p>
            Parent Path: <strong>{parentPath}</strong>
          </p>
        </div>

        <div className="form-group">
          <TextInput
            id="versionId"
            label="Version ID"
            placeholder="Enter version ID"
            onChange={handleVersionIdChange}
            onBlur={handleVersionIdChange}
            required
          />
          {error && <p className="error-message">{error}</p>}
        </div>

        <div className="form-group">
          <Select
            id="sourceVersion"
            label="Copy Data From Version (Optional)"
            placeholder="Select a version to copy from"
            onOptionChange={handleSourceVersionChange}
            options={versionOptions}
            defaultValue={sourceVersionId}
          />
          <p className="helper-text">
            Select an existing version to copy its data, or leave empty to
            create a blank version.
          </p>
        </div>

        <p className="helper-text">
          The version ID will be used as the identifier in Firestore. Only use
          letters, numbers, hyphens, and underscores.
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

export default VersionIdDialog;
