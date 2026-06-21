import React, { useEffect, useState } from "react";
import { closeModal, Modal, openModal, TextInput } from "risa-oasis-ui_v2";
import "./EditDetailsDialog.scss";

interface EditDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, any>) => void;
  data: Record<string, any>;
  title: string;
  loading?: boolean;
}

// Use a constant dialogId
const EDIT_DETAILS_DIALOG_ID = "edit-details-dialog";

const EditDetailsDialog: React.FC<EditDetailsDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  data,
  title,
  loading = false,
}) => {
  const [editableFields, setEditableFields] = useState<
    Array<{ key: string; value: string; type: string }>
  >([]);

  // Parse the data into editable fields
  useEffect(() => {
    if (data) {
      const fields = Object.entries(data)
        .filter(([key]) => key !== "id") // Exclude the id field
        .map(([key, value]) => {
          // Determine the type of the value
          let type = typeof value;
          let stringValue = "";

          if (value === null || value === undefined) {
            stringValue = "";
            type = "string";
          } else if (typeof value === "boolean") {
            stringValue = value ? "true" : "false";
            type = "boolean";
          } else if (typeof value === "object") {
            if (value instanceof Date) {
              stringValue = value.toISOString();
              type = "string";
            } else {
              stringValue = JSON.stringify(value);
              type = "object";
            }
          } else {
            stringValue = String(value);
          }

          return {
            key,
            value: stringValue,
            type,
          };
        });

      setEditableFields(fields);
    }
  }, [data]);

  // Open or close the modal when isOpen changes
  useEffect(() => {
    if (isOpen) {
      openModal(EDIT_DETAILS_DIALOG_ID);
    } else {
      closeModal(EDIT_DETAILS_DIALOG_ID);
    }
  }, [isOpen]);

  const handleValueChange = (index: number, newValue: string) => {
    const updatedFields = [...editableFields];
    updatedFields[index].value = newValue;
    setEditableFields(updatedFields);
  };

  const handleInputChange = (data: any, index: number) => {
    // Extract value from the data object
    handleValueChange(index, data.value);
  };

  const handleSave = () => {
    const updatedData: Record<string, any> = {};

    // Convert the editable fields back to their original types
    editableFields.forEach((field) => {
      let value: any = field.value;

      if (field.type === "number") {
        value = parseFloat(field.value);
        if (isNaN(value)) {
          value = 0;
        }
      } else if (field.type === "boolean") {
        value = field.value.toLowerCase() === "true";
      } else if (field.type === "object") {
        try {
          value = JSON.parse(field.value);
        } catch (e) {
          console.error("Error parsing JSON:", e);
          value = field.value;
        }
      }

      updatedData[field.key] = value;
    });

    onSubmit(updatedData);
  };

  return (
    <Modal
      dialogId={EDIT_DETAILS_DIALOG_ID}
      title={title}
      onCancel={onClose}
      onSave={handleSave}
      cancelText="Cancel"
      saveButtonText="Save Changes"
      disableSave={loading}
    >
      <div className="edit-details-content">
        {editableFields.map((field, index) => (
          <div className="edit-field" key={field.key}>
            <TextInput
              id={`field-${index}`}
              label={field.key}
              onChange={(data) => handleInputChange(data, index)}
              onBlur={(data) => handleInputChange(data, index)}
              placeholder={`Enter ${field.key}`}
              defaultValue={field.value}
            />
            <div className="field-type">Type: {field.type}</div>
          </div>
        ))}

        {editableFields.length === 0 && (
          <p className="no-fields">No editable fields found.</p>
        )}
      </div>
    </Modal>
  );
};

export default EditDetailsDialog;
