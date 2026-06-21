import React, { useEffect, useState } from "react";
import { Button, CheckBox, TextInput } from "risa-oasis-ui_v2";
import "./DocumentForm.scss";

export interface DocumentFormData {
  name?: string;
  description?: string;
  required?: boolean;
  [key: string]: any;
}

interface DocumentFormProps {
  initialData?: DocumentFormData;
  onSubmit: (data: DocumentFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  title: string;
  submitLabel?: string;
}

const DocumentForm: React.FC<DocumentFormProps> = ({
  initialData = {},
  onSubmit,
  onCancel,
  loading = false,
  title,
  submitLabel = "Save",
}) => {
  const [formData, setFormData] = useState<DocumentFormData>({
    name: "",
    description: "",
    required: false,
    ...initialData,
  });

  const [additionalFields, setAdditionalFields] = useState<
    { key: string; value: string }[]
  >([]);

  // State to track values for TextInput components which don't support value prop
  const [formName, setFormName] = useState(initialData.name || "");
  const [formDescription, setFormDescription] = useState(
    initialData.description || "",
  );

  useEffect(() => {
    // Extract any additional fields from initialData
    const standardFields = ["id", "name", "description", "required"];
    const extraFields = Object.entries(initialData)
      .filter(([key]) => !standardFields.includes(key))
      .map(([key, value]) => ({
        key,
        value: typeof value === "string" ? value : JSON.stringify(value),
      }));

    setAdditionalFields(extraFields);
    setFormName(initialData.name || "");
    setFormDescription(initialData.description || "");
  }, [initialData]);
  const handleInputChange = (data: any) => {
    const fieldName =
      data.id === "name"
        ? "name"
        : data.id === "description"
          ? "description"
          : data.id;

    if (data.id === "name") {
      setFormName(data.value);
    } else if (data.id === "description") {
      setFormDescription(data.value);
    }

    // Only update formData if value changed
    setFormData((prevFormData) => {
      if (prevFormData[fieldName] === data.value) {
        return prevFormData; // No update needed
      }
      return {
        ...prevFormData,
        [fieldName]: data.value,
      };
    });
  };

  // const handleInputChange = (data: any) => {
  //     // Map id to field name for internal state tracking
  //     const fieldName = data.id === "name" ? "name" :
  //         data.id === "description" ? "description" : data.id;

  //     if (data.id === "name") {
  //         setFormName(data.value);
  //     } else if (data.id === "description") {
  //         setFormDescription(data.value);
  //     }

  //     setFormData({
  //         ...formData,
  //         [fieldName]: data.value
  //     });
  // };

  const handleCheckBoxChange = (data: any) => {
    // Since we can't pass the property name to the CheckBox, we need to infer it from the id
    if (data.id === "required") {
      setFormData({
        ...formData,
        required: data.checked,
      });
    }
  };

  const handleAdditionalFieldKeyChange = (index: number, value: string) => {
    const updatedFields = [...additionalFields];
    updatedFields[index].key = value;
    setAdditionalFields(updatedFields);
  };

  const handleAdditionalFieldValueChange = (index: number, value: string) => {
    const updatedFields = [...additionalFields];
    updatedFields[index].value = value;
    setAdditionalFields(updatedFields);
  };

  const handleCustomInputChange = (
    data: any,
    index: number,
    isKey: boolean,
  ) => {
    if (isKey) {
      handleAdditionalFieldKeyChange(index, data.value);
    } else {
      handleAdditionalFieldValueChange(index, data.value);
    }
  };

  const addAdditionalField = () => {
    setAdditionalFields([...additionalFields, { key: "", value: "" }]);
  };

  const removeAdditionalField = (index: number) => {
    const updatedFields = [...additionalFields];
    updatedFields.splice(index, 1);
    setAdditionalFields(updatedFields);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Make sure form data is up to date with inputs
    const currentFormData = {
      ...formData,
      name: formName,
      description: formDescription,
    };

    // Combine standard form data with additional fields
    const finalData = { ...currentFormData };

    // Add additional fields to the final data
    additionalFields.forEach(({ key, value }) => {
      if (key.trim() !== "") {
        // Try to parse the value as JSON if possible, otherwise use as string
        try {
          finalData[key] = JSON.parse(value);
        } catch (error) {
          finalData[key] = value;
        }
      }
    });

    onSubmit(finalData);
  };

  return (
    <div className="document-form">
      <h3>{title}</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <TextInput
            id="name"
            label="Name"
            placeholder="Enter document name"
            resetField={formName === ""}
            onChange={handleInputChange}
            onBlur={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <TextInput
            id="description"
            label="Description"
            placeholder="Enter document description"
            resetField={formDescription === ""}
            onChange={handleInputChange}
            onBlur={handleInputChange}
          />
        </div>

        <div className="form-group checkbox-group">
          <CheckBox
            id="required"
            label="Required"
            onCheckBoxValueChange={handleCheckBoxChange}
          />
        </div>

        <div className="additional-fields">
          <h4>Additional Fields</h4>
          {additionalFields.map((field, index) => (
            <div className="additional-field-row" key={`field-${index}`}>
              <TextInput
                id={`field-key-${index}`}
                label="Field Name"
                placeholder="Field name"
                defaultValue={field.key}
                onChange={(data) => handleCustomInputChange(data, index, true)}
                onBlur={(data) => handleCustomInputChange(data, index, true)}
              />
              <TextInput
                id={`field-value-${index}`}
                label="Field Value"
                placeholder="Field value"
                defaultValue={field.value}
                onChange={(data) => handleCustomInputChange(data, index, false)}
                onBlur={(data) => handleCustomInputChange(data, index, false)}
              />
              <Button
                buttonType="secondary"
                onClick={() => removeAdditionalField(index)}
                size="small"
                disabled={false}
              >
                Remove
              </Button>
            </div>
          ))}

          <Button
            buttonType="secondary"
            onClick={addAdditionalField}
            size="small"
            disabled={false}
          >
            Add Field
          </Button>
        </div>

        <div className="form-actions">
          <Button
            buttonType="secondary"
            onClick={onCancel}
            disabled={loading}
            size="medium"
          >
            Cancel
          </Button>
          <Button
            buttonType="primary"
            disabled={loading}
            size="medium"
            onClick={(e) => {
              e.preventDefault();
              handleSubmit(e);
            }}
          >
            {loading ? "Saving..." : submitLabel}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DocumentForm;
