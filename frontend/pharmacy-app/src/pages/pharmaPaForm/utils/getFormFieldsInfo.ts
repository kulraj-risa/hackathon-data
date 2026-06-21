import {
  FormField,
  GroupField,
  SectionField,
} from "../../../data-model/pharmaPaFormModel";

export const extractFieldMappings = (
  baseFields: FormField[],
): Record<
  string,
  {
    isRequired: boolean;
    filledValue: any;
    regexMatcher: any;
    type: string;
    isFieldDirty: boolean;
    default: any;
  }
> => {
  const fieldMappings: Record<
    string,
    {
      isRequired: boolean;
      filledValue: any;
      regexMatcher: any;
      type: string;
      isFieldDirty: boolean;
      default: any;
    }
  > = {};

  const hasNestedFields = (
    field: FormField,
  ): field is (SectionField | GroupField) & {
    fields: FormField[];
  } =>
    "fields" in field &&
    Array.isArray((field as SectionField | GroupField).fields);

  const processFields = (fields: FormField[]) => {
    for (const field of fields) {
      // Skip fields without a key
      if (!field.key) {
        continue;
      }

      if (field.type === "array" && "fields" in field) {
        // Handle array type fields
        const arrayFields = (field as { fields: FormField[][] }).fields;
        if (Array.isArray(arrayFields)) {
          // Process each array element
          arrayFields.forEach((arrayItemFields) => {
            processFields(arrayItemFields);
          });
        }
      } else if (hasNestedFields(field)) {
        processFields(field.fields);
      } else {
        fieldMappings[field.key] = {
          isRequired: field.isRequired || false,
          filledValue: field.default || null,
          regexMatcher: field.regex || null,
          type: field.type || null,
          isFieldDirty: false,
          default: field.default || null,
        };
      }
    }
  };

  processFields(baseFields);
  return fieldMappings;
};
