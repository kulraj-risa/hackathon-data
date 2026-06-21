import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  closeModal,
  Modal,
  openModal,
  SpinningLoader,
  TextInput,
} from "risa-oasis-ui_v2";
import "./AddKeywordDocumentDialog.scss";

interface AddKeywordDocumentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (keywordDocument: {
    type: string;
    category_types: string[];
    keywords: string[];
  }) => Promise<void>;
  title: string;
  loading?: boolean;
}

interface AddCategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (categoryName: string) => Promise<void>;
  title: string;
  loading?: boolean;
}

// Use a constant dialogId
const ADD_KEYWORD_DOCUMENT_DIALOG_ID = "add-keyword-document-dialog";
const ADD_CATEGORY_DIALOG_ID = "add-category-dialog";

const AddKeywordDocumentDialog: React.FC<AddKeywordDocumentDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  loading = false,
}) => {
  // Track if we've actually opened the modal
  const isModalOpen = useRef(false);
  const [type, setType] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Open or close the modal when isOpen changes
  useEffect(() => {
    if (isOpen && !isModalOpen.current) {
      // First time opening
      openModal(ADD_KEYWORD_DOCUMENT_DIALOG_ID);
      isModalOpen.current = true;
    } else if (!isOpen && isModalOpen.current) {
      // Close when parent says we should close
      closeModal(ADD_KEYWORD_DOCUMENT_DIALOG_ID);
      isModalOpen.current = false;
      // Reset state
      setType("");
      setError("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleInputChange = (data: any) => {
    setType(data.value);
    // Clear any error when user types
    if (error) setError("");
  };

  const handleSubmit = async () => {
    // Validate input
    if (!type.trim()) {
      setError("Type is required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Create the keyword document object with the required structure
      const keywordDocument = {
        type: type.trim(),
        category_types: [],
        keywords: [],
      };

      await onSubmit(keywordDocument);
      // Dialog will be closed by the handler if successful
    } catch (error) {
      console.error("Error in dialog submit:", error);
      setError("Failed to add keyword document. Please try again.");
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
      dialogId={ADD_KEYWORD_DOCUMENT_DIALOG_ID}
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
            id="keywordDocumentType"
            label="Document Type"
            placeholder="Enter the type of keyword document (e.g., Medical Records, Lab Results)"
            onChange={handleInputChange}
            onBlur={handleInputChange}
            required
          />
          {error && <p className="error-message">{error}</p>}
        </div>

        <p className="helper-text">
          Enter the type for this keyword document. The category_types and
          keywords arrays will be created empty and can be populated later.
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
              Add Keyword Document
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export const AddCategoryDialog: React.FC<AddCategoryDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  loading = false,
}) => {
  // Track if we've actually opened the modal
  const isModalOpen = useRef(false);
  const [categoryName, setCategoryName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Open or close the modal when isOpen changes
  useEffect(() => {
    if (isOpen && !isModalOpen.current) {
      // First time opening
      openModal(ADD_CATEGORY_DIALOG_ID);
      isModalOpen.current = true;
    } else if (!isOpen && isModalOpen.current) {
      // Close when parent says we should close
      closeModal(ADD_CATEGORY_DIALOG_ID);
      isModalOpen.current = false;
      // Reset state
      setCategoryName("");
      setError("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleInputChange = (data: any) => {
    setCategoryName(data.value);
    // Clear any error when user types
    if (error) setError("");
  };

  const handleSubmit = async () => {
    // Validate input
    if (!categoryName.trim()) {
      setError("Category name is required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await onSubmit(categoryName.trim());
      // Dialog will be closed by the handler if successful
    } catch (error) {
      console.error("Error in dialog submit:", error);
      setError("Failed to add category. Please try again.");
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
      dialogId={ADD_CATEGORY_DIALOG_ID}
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
            id="categoryName"
            label="Category Name"
            placeholder="Enter the category name (e.g., Medical History, Lab Tests)"
            onChange={handleInputChange}
            onBlur={handleInputChange}
            required
          />
          {error && <p className="error-message">{error}</p>}
        </div>

        <p className="helper-text">
          Enter a name for the new category. It will be created with empty
          arrays for category_documents, drugs, and keyword_documents.
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
              Add Category
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default AddKeywordDocumentDialog;
