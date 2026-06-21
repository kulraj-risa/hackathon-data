import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  closeModal,
  Modal,
  openModal,
  SpinningLoader,
  TextInput,
} from "risa-oasis-ui_v2";
import "./AddListItemDialog.scss";

interface AddListItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (itemValue: string) => Promise<void>;
  title: string;
  placeholder: string;
  fieldName: string;
  loading?: boolean;
}

// Use a constant dialogId
const ADD_LIST_ITEM_DIALOG_ID = "add-list-item-dialog";

const AddListItemDialog: React.FC<AddListItemDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  placeholder,
  fieldName,
  loading = false,
}) => {
  // Track if we've actually opened the modal
  const isModalOpen = useRef(false);
  const [itemValue, setItemValue] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Open or close the modal when isOpen changes
  useEffect(() => {
    if (isOpen && !isModalOpen.current) {
      // First time opening
      openModal(ADD_LIST_ITEM_DIALOG_ID);
      isModalOpen.current = true;
    } else if (!isOpen && isModalOpen.current) {
      // Close when parent says we should close
      closeModal(ADD_LIST_ITEM_DIALOG_ID);
      isModalOpen.current = false;
      // Reset state
      setItemValue("");
      setError("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleInputChange = (data: any) => {
    setItemValue(data.value);
    // Clear any error when user types
    if (error) setError("");
  };

  const handleSubmit = async () => {
    // Validate input
    if (!itemValue.trim()) {
      setError(`${fieldName} is required`);
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await onSubmit(itemValue.trim());
      // Dialog will be closed by the handler if successful
    } catch (error) {
      console.error("Error in dialog submit:", error);
      setError(`Failed to add ${fieldName.toLowerCase()}. Please try again.`);
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
      dialogId={ADD_LIST_ITEM_DIALOG_ID}
      title={title}
      onCancel={handleCancel}
      onSave={() => {}}
      saveButtonText=""
      cancelText=""
      hideFooter={true}
    >
      <div className="add-list-item-dialog">
        <div className="form-group">
          <TextInput
            id="itemValue"
            label={fieldName}
            placeholder={placeholder}
            onChange={handleInputChange}
            onBlur={handleInputChange}
            required
          />
          {error && <p className="error-message">{error}</p>}
        </div>

        <p className="helper-text">
          Enter the {fieldName.toLowerCase()} you want to add to the list.
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
              Add
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default AddListItemDialog;
