import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  closeModal,
  Modal,
  openModal,
  SpinningLoader,
} from "risa-oasis-ui_v2";
import "./DeleteItemConfirmationDialog.scss";

interface DeleteItemConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  itemName: string;
  itemType: "list-item" | "keyword-document" | "category";
  fullPath: string;
  loading?: boolean;
}

// Use a constant dialogId
const DELETE_ITEM_DIALOG_ID = "delete-item-confirmation-dialog";

const DeleteItemConfirmationDialog: React.FC<
  DeleteItemConfirmationDialogProps
> = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType,
  fullPath,
  loading = false,
}) => {
  // Track if we've actually opened the modal
  const isModalOpen = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Open or close the modal when isOpen changes
  useEffect(() => {
    if (isOpen && !isModalOpen.current) {
      // First time opening
      openModal(DELETE_ITEM_DIALOG_ID);
      isModalOpen.current = true;
    } else if (!isOpen && isModalOpen.current) {
      // Close when parent says we should close
      closeModal(DELETE_ITEM_DIALOG_ID);
      isModalOpen.current = false;
      // Reset state
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const getItemTypeLabel = () => {
    switch (itemType) {
      case "list-item":
        return "item";
      case "keyword-document":
        return "keyword document";
      case "category":
        return "category";
      default:
        return "item";
    }
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
      // Dialog will be closed by the handler if successful
    } catch (error) {
      console.error("Error deleting item:", error);
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
      dialogId={DELETE_ITEM_DIALOG_ID}
      title={`Delete ${getItemTypeLabel()}`}
      onCancel={handleCancel}
      onSave={() => {}}
      saveButtonText=""
      cancelText=""
      hideFooter={true}
    >
      <div className="delete-item-confirmation-dialog">
        <div className="warning-icon">
          <i className="fas fa-exclamation-triangle"></i>
        </div>

        <div className="confirmation-content">
          <p className="confirmation-message">
            Are you sure you want to delete this {getItemTypeLabel()}?
          </p>

          <div className="item-details">
            <div className="item-name">
              <strong>Name:</strong> {itemName}
            </div>
            <div className="item-path">
              <strong>Path:</strong> {fullPath}
            </div>
          </div>

          <div className="warning-message">
            <i className="fas fa-exclamation-circle"></i>
            <span>Warning: This action cannot be undone.</span>
          </div>
        </div>

        <div className="dialog-footer">
          <Button
            buttonType="tertiary"
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
              buttonType="danger"
              size="medium"
              onClick={handleConfirm}
              disabled={isSubmitting}
            >
              <i className="fas fa-trash"></i>
              &nbsp;Delete
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default DeleteItemConfirmationDialog;
