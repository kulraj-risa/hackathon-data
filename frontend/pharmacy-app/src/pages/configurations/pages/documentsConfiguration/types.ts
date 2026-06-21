import { DocumentFormData } from "./DocumentForm";

// Type for dialog state
export interface DialogState {
  isOpen: boolean;
  mode: "create" | "edit";
  level: 1 | 2 | 3;
  title: string;
  initialData?: DocumentFormData;
}

// Type for delete confirmation dialog state
export interface DeleteDialogState {
  isOpen: boolean;
  level: 1 | 2 | 3;
  title: string;
  itemName: string;
  itemId: string;
}

// Type for edit details dialog state
export interface EditDetailsState {
  isOpen: boolean;
  level: 1 | 2 | 3;
  title: string;
  data: any;
}

// Type for document id dialog state
export interface DocumentIdDialogState {
  isOpen: boolean;
}

// Type for edit document id dialog state
export interface EditDocumentIdDialogState {
  isOpen: boolean;
}

// Type for configuration type id dialog state
export interface ConfigurationTypeIdDialogState {
  isOpen: boolean;
}

// Type for version id dialog state
export interface VersionIdDialogState {
  isOpen: boolean;
}

// Type for add list item dialog state
export interface AddListItemDialogState {
  isOpen: boolean;
  fieldPath: string[];
  currentValue: any[];
  title: string;
  placeholder: string;
  fieldName: string;
}

// Type for add keyword document dialog state
export interface AddKeywordDocumentDialogState {
  isOpen: boolean;
  fieldPath: string[];
  currentValue: any[];
  title: string;
}

// Type for add category dialog state
export interface AddCategoryDialogState {
  isOpen: boolean;
}

// Type for delete item dialog state
export interface DeleteItemDialogState {
  isOpen: boolean;
  itemPath: string[];
  itemName: string;
  itemIndex?: number;
  itemType: "list-item" | "keyword-document" | "category";
  fullPath: string;
}

// Type for keyword document structure
export interface KeywordDocument {
  type: string;
  category_types: string[];
  keywords: string[];
}
