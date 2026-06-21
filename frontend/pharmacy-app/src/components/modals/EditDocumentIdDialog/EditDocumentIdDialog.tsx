import React, { useEffect, useRef, useState } from "react";
import { closeModal, Modal, openModal, TextInput } from "risa-oasis-ui_v2";
import "./EditDocumentIdDialog.scss";

interface EditDocumentIdDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (oldDocumentId: string, newDocumentId: string) => void;
  documentId: string;
  parentPath: string;
  loading?: boolean;
}

// Use a constant dialogId
const EDIT_DOCUMENT_ID_DIALOG_ID = "edit-document-id-dialog";

const EditDocumentIdDialog: React.FC<EditDocumentIdDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  documentId,
  parentPath,
  loading = false,
}) => {
  // Track if we've actually opened the modal
  const isModalOpen = useRef(false);
  const [newDocumentId, setNewDocumentId] = useState("");
  const [error, setError] = useState("");

  // Initialize new document ID with current ID when dialog opens
  useEffect(() => {
    if (isOpen) {
      setNewDocumentId(documentId);
    }
  }, [isOpen, documentId]);

  // Open or close the modal when isOpen changes
  useEffect(() => {
    if (isOpen && !isModalOpen.current) {
      // First time opening
      openModal(EDIT_DOCUMENT_ID_DIALOG_ID);
      isModalOpen.current = true;
    } else if (!isOpen && isModalOpen.current) {
      // Close when parent says we should close
      closeModal(EDIT_DOCUMENT_ID_DIALOG_ID);
      isModalOpen.current = false;
      // Reset state
      setError("");
    }
  }, [isOpen]);

  const handleInputChange = (data: any) => {
    setNewDocumentId(data.value);
    // Clear any error when user types
    if (error) setError("");
  };

  const handleSubmit = () => {
    // Validate document ID
    if (!newDocumentId.trim()) {
      setError("Document ID is required");
      return;
    }

    // Only allow alphanumeric chars, hyphens, and underscores
    if (!/^[a-zA-Z0-9_-]+$/.test(newDocumentId)) {
      setError(
        "Document ID can only contain letters, numbers, hyphens, and underscores",
      );
      return;
    }

    // Don't do anything if the ID didn't change
    if (newDocumentId === documentId) {
      onClose();
      return;
    }

    onSubmit(documentId, newDocumentId);
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Modal
      dialogId={EDIT_DOCUMENT_ID_DIALOG_ID}
      title="Edit Document ID"
      onCancel={handleCancel}
      onSave={handleSubmit}
      cancelText="Cancel"
      saveButtonText="Save Changes"
      disableSave={loading}
    >
      <div className="edit-document-id-dialog">
        <div className="parent-path">
          <p>
            Parent Path: <strong>{parentPath}</strong>
          </p>
        </div>

        <div className="current-id">
          <p>
            Current Document ID: <strong>{documentId}</strong>
          </p>
        </div>

        <div className="form-group">
          <TextInput
            id="newDocumentId"
            label="New Document ID"
            placeholder="Enter new document ID"
            defaultValue={documentId}
            onChange={handleInputChange}
            onBlur={handleInputChange}
            required
          />
          {error && <p className="error-message">{error}</p>}
        </div>

        <p className="helper-text">
          This will change the document ID in Firestore. Only use letters,
          numbers, hyphens, and underscores.
        </p>

        <div className="warning">
          <p>
            ⚠️ <strong>Warning:</strong> Changing a document ID will create a
            new document and delete the old one. All document data will be
            preserved, but any references to this document from elsewhere in
            your application might need to be updated.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default EditDocumentIdDialog;
