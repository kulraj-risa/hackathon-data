export enum TableCellType {
  // if you change enum values, table styles for the particular type will be affected

  STRING = "string",
  BUTTON_LINK = "button-link",
  DATE = "date",
  STRING_LINK = "string-link",
  DOWNLOAD_BUTTON = "download-button",
  INFO = "info",
  MULTILINE = "multiline",
  COLORED_TEXT = "colored-text",
  BADGE = "badge",
  CLICKABLE_BADGE = "clickable-badge",
  CLICKABLE_BADGE_FOR_FINAL_STATUS = "clickable-badge-for-final-status",
  CLICKABLE_BADGE_MODAL = "clickable-badge-modal",
  ICON = "icon",
  STRING_BADGE = "string-badge",
  ERROR_MODAL = "error-modal",
  COPY_DATA = "copy-data",
  USER_INITIALS = "user-initials",
  NYCBS_STATUS = "nycbs-status",
  DELETE_ICON = "delete-icon",
  CLICKABLE_TEXT_WITH_DISABLED_STATUS = "clickable-text-with-disabled-status",
  CHECKBOX = "checkbox",
  EDITABLE_TEXT = "editable-text",
  SELECTABLE_BADGE = "selectable-badge",
  BADGE_WITH_I = "badge-with-i",
  THINKING_BUTTON = "thinking-button",
  STRING_WITH_BUTTON = "string-with-button",
  RPA_STATUS = "rpa-status",
  VIEW_ICON = "view-icon",
  DOC_NAME_WITH_ICON = "doc-name-with-icon",
  RPA_STATUS_TWO = "rpa-status-two",
  DOC_LIST = "doc-list",
  STRING_WITH_CUSTOM_TOOLTIP = "string-with-custom-tooltip",
  RPA_STATUS_FOR_EXTERNAL = "rpa-status-for-external",
  DOC_WITH_UPLOAD_ICON = "doc-with-upload-icon",
  VIEW_ICON_FOR_SCREENSHOT_OR_API_RESPONSE = "view-icon-for-screenshot-or-api-response",
  STRING_WITH_ICON = "string-with-icon",
  SIDE_MODAL_ICON = "side-modal-icon",
  TAG_WITH_ICON = "tag-with-icon",
  PDF_VIEWER_ICON = "pdf-viewer-icon",
  TOGGLE_SWITCH = "toggle-switch",
  TEXT_CELL_WITH_INPUT = "text-cell-with-input",
  ADD_KEY_BUTTON = "add-key-button",
  EXPANDABLE_ROW_ICON = "expandable-row-icon",
  BUTTON_WITH_THREE_DOTS = "button-with-three-dots",
  CMM_INPUT_VIEW_ICON = "cmm-input-view-icon",
  RECORD_CLOSED_BY = "record-closed-by",
}

export interface TableHeader {
  label: string;
  key: string;
  order: number;
  width: number;
  sortable?: boolean;
  filterable?: boolean;
  sectionSearch?: boolean;
  type: TableCellType;
  subKey?: string;
}

export interface CellData {
  type: TableCellType;
  value: any;
  width: number;
  header?: string;
  rowData?: any;
}
