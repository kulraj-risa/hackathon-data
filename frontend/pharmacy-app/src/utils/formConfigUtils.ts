import {
  ArrayField,
  FormDataModel,
  FormField,
  GroupField,
  SectionField,
} from "../data-model/pharmaPaFormModel";

/**
 * Recursively finds a group or section field by key and appends new data to its fields array.
 * If parentId is empty, appends to the root level fields array.
 * @param formData - The top-level FormDataModel object.
 * @param parentId - The key of the group or section to insert into, or empty string for root level.
 * @param newField - The new FormField to insert.
 * @returns The updated FormDataModel.
 */

export function insertFieldByParentId(
  formData: FormDataModel,
  parentId: string,
  newField: FormField,
): FormDataModel {
  // Handle root level insertion
  if (!parentId) {
    return {
      ...formData,
      fields: [...formData.fields, newField],
    };
  }

  let found = false;

  function recurse(fields: FormField[]): FormField[] {
    if (found) return fields;

    return fields.map((field) => {
      if (found) return field;

      if (field.type === "section" || field.type === "group") {
        const isTarget = field.key === parentId;

        if (isTarget) {
          found = true;
          return {
            ...field,
            fields: [...(field.fields || []), newField],
          };
        }

        return {
          ...field,
          fields: recurse(field.fields || []),
        };
      }

      if (field.type === "array") {
        const arrayField = field as ArrayField;
        const isTarget = field.key === parentId;
        if (isTarget) {
          found = true;
          let newFields: FormField[][];
          if (Array.isArray(arrayField.fields[0])) {
            // FormField[][]
            newFields = (arrayField.fields as FormField[][]).map((row, idx) =>
              idx === 0 ? [...row, newField] : row,
            );
          } else {
            // FormField[]
            newFields = [
              (arrayField.fields as unknown as FormField[]).concat(newField),
            ];
          }

          return {
            ...arrayField,
            fields: newFields,
          };
        }
        // Recurse into each row of the array field
        let recursedFields: FormField[][];
        if (Array.isArray(arrayField.fields[0])) {
          recursedFields = (arrayField.fields as FormField[][]).map((row) =>
            Array.isArray(row) ? (recurse(row) as unknown as FormField[]) : [],
          );
        } else if (Array.isArray(arrayField.fields)) {
          recursedFields = [
            recurse(arrayField.fields as unknown as FormField[]),
          ];
        } else {
          recursedFields = [];
        }
        return {
          ...arrayField,
          fields: recursedFields,
        };
      }

      return field;
    });
  }

  const result = {
    ...formData,
    fields: recurse(formData.fields),
  };
  return result;
}

/**
 * Recursively searches for and deletes a field with the given key from the formData.
 * The function returns a new FormDataModel with the field removed.
 *
 * @param formData - The original form data model (will not be modified).
 * @param targetKey - The key of the field to delete.
 * @returns FormDataModel - A new FormDataModel with the field deleted, or the original if not found.
 */
export function deleteFieldByKey(
  formData: FormDataModel,
  targetKey: string,
): FormDataModel {
  let found = false;

  function recurse(fields: FormField[], depth = 0): FormField[] {
    const processedFields = fields.map((field, i) => {
      // If this field matches, skip it (delete it)
      if (field.key === targetKey) {
        found = true;
        return null; // This will be filtered out
      }

      // If this is a group/section, check nested fields
      if (
        (field.type === "section" || field.type === "group") &&
        "fields" in field
      ) {
        const updatedFields = recurse(
          (field as SectionField | GroupField).fields,
          depth + 1,
        );
        return {
          ...field,
          fields: updatedFields,
        };
      }

      // Handle array fields
      if (field.type === "array") {
        const arrayField = field as ArrayField;
        // Check each array element
        if (arrayField.fields && Array.isArray(arrayField.fields)) {
          const updatedArrayFields = arrayField.fields
            .map((arrayElement, j) => {
              if (Array.isArray(arrayElement)) {
                return recurse(arrayElement, depth + 1);
              } else {
                // Check if the array element itself is a field with the target key
                if (
                  arrayElement &&
                  typeof arrayElement === "object" &&
                  "key" in arrayElement
                ) {
                  const fieldElement = arrayElement as FormField;
                  if (fieldElement.key === targetKey) {
                    found = true;
                    return null;
                  }
                }
                return arrayElement;
              }
            })
            .filter((element) => element !== null) as (
            | FormField[]
            | FormField
          )[];

          return {
            ...arrayField,
            fields: updatedArrayFields,
          };
        }
      }

      return field;
    });

    // Filter out null values with proper typing
    return processedFields.filter(
      (field): field is FormField => field !== null,
    );
  }

  const updatedFields = recurse(formData.fields);
  const result = {
    ...formData,
    fields: updatedFields,
  };

  return result;
}

/**
 * Updates a field at a specific index inside a parent section/group.
 * If parentId is an empty string, it targets the top-level fields.
 *
 * @param formData - The original form data object (will not be modified).
 * @param parentId - The key of the parent section/group, or "" for top-level.
 * @param index - Index of the field to update in the parent's fields array.
 * @param updatedField - The updated field to insert.
 * @returns FormDataModel - A new FormDataModel with the field updated, or the original if not found.
 */
export function updateFieldByParentAndIndex(
  formData: FormDataModel,
  parentId: string,
  index: number,
  updatedField: FormField,
): FormDataModel {
  let found = false;

  // Case: top-level update
  if (!parentId) {
    if (index >= 0 && index < formData.fields.length) {
      const newFields = [...formData.fields];
      newFields[index] = updatedField;
      return {
        ...formData,
        fields: newFields,
      };
    }
    return formData;
  }

  // Recursive update inside nested group/section
  function recurse(fields: FormField[]): FormField[] {
    return fields.map((field) => {
      if (found) return field;

      if (
        (field.type === "section" || field.type === "group") &&
        field.key === parentId
      ) {
        const target = (field as SectionField | GroupField).fields;
        if (index >= 0 && index < target.length) {
          found = true;
          const newTargetFields = [...target];
          newTargetFields[index] = updatedField;
          return {
            ...field,
            fields: newTargetFields,
          };
        }
        return field;
      }

      if (
        (field.type === "section" || field.type === "group") &&
        "fields" in field
      ) {
        const updatedFields = recurse(
          (field as SectionField | GroupField).fields,
        );
        if (updatedFields !== (field as SectionField | GroupField).fields) {
          return {
            ...field,
            fields: updatedFields,
          };
        }
      }

      // Handle array fields
      if (field.type === "array") {
        const arrayField = field as ArrayField;
        if (arrayField.key === parentId) {
          // Update within the array field itself
          if (arrayField.fields && Array.isArray(arrayField.fields)) {
            if (Array.isArray(arrayField.fields[0])) {
              // FormField[][] case - update in the first row
              const firstRow = arrayField.fields[0] as FormField[];
              if (index >= 0 && index < firstRow.length) {
                found = true;
                const newFirstRow = [...firstRow];
                newFirstRow[index] = updatedField;
                const newFields = [...arrayField.fields];
                newFields[0] = newFirstRow;
                return {
                  ...arrayField,
                  fields: newFields,
                };
              }
            } else {
              // FormField[] case
              const fieldsArray = arrayField.fields as unknown as FormField[];
              if (index >= 0 && index < fieldsArray.length) {
                found = true;
                const newFieldsArray = [...fieldsArray];
                newFieldsArray[index] = updatedField;
                return {
                  ...arrayField,
                  fields: [newFieldsArray] as FormField[][],
                };
              }
            }
          }
          return field;
        }

        // Recursively search within array fields
        if (arrayField.fields && Array.isArray(arrayField.fields)) {
          let updatedArrayFields = false;
          const newArrayFields = arrayField.fields.map((arrayElement) => {
            if (Array.isArray(arrayElement)) {
              // FormField[][] case
              const updatedElement = recurse(arrayElement);
              if (updatedElement !== arrayElement) {
                updatedArrayFields = true;
                return updatedElement;
              }
            }
            return arrayElement;
          });

          if (updatedArrayFields) {
            return {
              ...arrayField,
              fields: newArrayFields,
            };
          }
        }
      }

      return field;
    });
  }

  const updatedFields = recurse(formData.fields);
  return {
    ...formData,
    fields: updatedFields,
  };
}

export function findFieldByKey(
  formData: FormDataModel,
  targetKey: string,
): FormField | null {
  function recurse(fields: FormField[]): FormField | null {
    for (const field of fields) {
      if (field.key === targetKey) {
        return field;
      }

      if (
        (field.type === "section" || field.type === "group") &&
        "fields" in field
      ) {
        const found = recurse((field as SectionField | GroupField).fields);
        if (found) return found;
      }

      // Handle array fields
      if (field.type === "array") {
        const arrayField = field as ArrayField;
        if (arrayField.fields && Array.isArray(arrayField.fields)) {
          for (const arrayElement of arrayField.fields) {
            if (Array.isArray(arrayElement)) {
              // FormField[][] case
              const found = recurse(arrayElement);
              if (found) return found;
            } else {
              // Check if the array element itself is a field with the target key
              if (
                arrayElement &&
                typeof arrayElement === "object" &&
                "key" in arrayElement
              ) {
                const fieldElement = arrayElement as FormField;
                if (fieldElement.key === targetKey) {
                  return fieldElement;
                }
              }
            }
          }
        }
      }
    }
    return null;
  }

  return recurse(formData.fields);
}

export function sortFormFields(fields: FormField[]): FormField[] {
  const sortFn = (a: FormField, b: FormField): number => {
    const rowA = a.rowIndex ?? Number.MAX_SAFE_INTEGER;
    const rowB = b.rowIndex ?? Number.MAX_SAFE_INTEGER;
    const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.order ?? Number.MAX_SAFE_INTEGER;

    if (rowA !== rowB) return rowA - rowB;
    return orderA - orderB;
  };

  const deepSort = (fields: FormField[]): FormField[] => {
    return fields
      .map((field) => {
        if (
          (field.type === "section" || field.type === "group") &&
          Array.isArray(field.fields)
        ) {
          return {
            ...field,
            fields: deepSort(field.fields),
          };
        }

        if (field.type === "array" && Array.isArray(field.fields)) {
          const is2D = Array.isArray(field.fields[0]);
          const sortedFields = is2D
            ? (field.fields as FormField[][]).map((row) => deepSort(row))
            : [deepSort(field.fields as unknown as FormField[])]; // wrap 1D into 2D

          return {
            ...field,
            fields: sortedFields,
          };
        }

        return field;
      })
      .sort(sortFn);
  };

  return deepSort(fields);
}
