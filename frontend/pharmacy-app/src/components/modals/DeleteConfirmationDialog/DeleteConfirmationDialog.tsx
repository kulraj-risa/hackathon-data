import React, { useEffect } from "react";
import { closeModal, Modal, openModal } from "risa-oasis-ui_v2";
import "./DeleteConfirmationDialog.scss";

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  itemName: string;
  loading?: boolean;
}

// Use a constant dialogId
const DELETE_DIALOG_ID = "delete-confirmation-dialog";

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  loading = false,
}) => {
  // Open or close the modal when isOpen changes
  useEffect(() => {
    if (isOpen) {
      openModal(DELETE_DIALOG_ID);
    } else {
      closeModal(DELETE_DIALOG_ID);
    }
  }, [isOpen]);

  const handleCancel = () => {
    onClose();
  };

  const handleSave = () => {
    onConfirm();
  };

  return (
    <Modal
      dialogId={DELETE_DIALOG_ID}
      title={title}
      onCancel={handleCancel}
      onSave={handleSave}
      cancelText="Cancel"
      saveButtonText="Delete"
      disableSave={loading}
    >
      <div className="delete-confirmation-content">
        <p>
          Are you sure you want to delete <strong>{itemName}</strong>?
        </p>
        <p className="warning">
          This action cannot be undone. All nested documents and configurations
          will also be deleted.
        </p>
      </div>
    </Modal>
  );
};

export default DeleteConfirmationDialog;
