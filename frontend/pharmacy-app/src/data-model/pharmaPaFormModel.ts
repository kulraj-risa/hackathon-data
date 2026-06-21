export interface FormDataModel {
  formTitle: string;
  drugName?: string;
  providerName?: string;
  fields: FormField[];
}

export type FormField =
  | SectionField
  | TextField
  | DropdownField
  | DateField
  | GroupField
  | RadioButtonField
  | ArrayField;

export interface BaseField {
  label: string;
  type:
    | "text"
    | "dropdown"
    | "date"
    | "section"
    | "group"
    | "radio"
    | "autoselect"
    | "array"
    | string;
  key: string;
  isRequired?: boolean;
  order?: number;
  default?: any;
  readOnly?: boolean;
  placeholder?: string;
  rowIndex?: number;
  width?: number;
  validationMessage?: string;
  regex?: string;
  refDocId?: string;
  additionalInfoHeader?: string;
  additionalInfoContent?: string;
}

export interface SectionField extends BaseField {
  type: "section";
  fields: FormField[];
}

export interface TextField extends BaseField {
  type: "text";
  default?: string;
}

export interface DropdownField extends BaseField {
  type: `${"dropdown" | "autoselect"}`;
  options: { label: string; value: string }[];
  default?: string;
  minSearchLength?: number;
}

export interface DateField extends BaseField {
  type: "date";
  default?: string; // Consider using Date type if needed
}

export interface GroupField extends BaseField {
  type: "group";
  fields: FormField[];
}

export interface RadioButtonField extends BaseField {
  type: "radio";
  options: RadioOption[];
  default?: string;
}

export interface RadioOption {
  label: string;
  value: string;
}

export interface ArrayField extends BaseField {
  type: "array";
  fields: FormField[][] | FormField[];
  parentKey?: string;
}
