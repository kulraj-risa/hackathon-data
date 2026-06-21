import { MouseEvent } from "react";
import { TableCellType } from "../components/custom-table/table";
import { FilterSection, FilterValues } from "./filterValues";

interface TableHeader {
  label: string;
  sortable?: boolean;
  key: string;
  subKey?: string;
  order: number;
  width?: number;
  type: TableCellType;
}

export interface FilterOption {
  label: string;
  value: string;
}

export interface CustomTableProps {
  tableHeaders: TableHeader[];
  tableData: Record<string, any>[];
  onReviewButtonClick?: (rowData: any) => void;
  onRowClick?: (rowData: any) => void;
  count?: number | null;
  itemsPerPage?: number;
  pagesPerView?: number;
  tableName: string;
  onPatientDetailsClick?: (rowData: any) => void;
  endIndexOfTable?: (endIndex: number) => void;
  searchingText?: (text: string) => void;
  isFetching?: boolean;
  hideSearchBar?: boolean;
  hidePagination?: boolean;
  onAssignToClick?: (rowData: any) => void;
  onStatusClick?: (rowData: any) => void;
  onRefreshButton?: () => void;
  totalCount?: number | null;
  onDeleteIconClick?: (rowData: any) => void;
  onClickableTextWithDisabledStatusClick?: (rowData: any) => void;
  filterSectionsData?: FilterSection[];
  showFilterButton?: boolean;
  onReRunOncoEmrClick?: (rowData: any) => void;
  onReRunCmmClick?: (rowData: any) => void;
  onViewCmmClick?: (rowData: any) => void;
  onReportPrescriptionClick?: (rowData: any) => void;
  onFilterApplyClicked?: (data: FilterValues) => void;
  showInLineLoader?: boolean;
  showExportButton?: boolean;
  onExportButtonClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  showRefreshButton?: boolean;
  onComplete?: () => void;
  onViewPharmaPaDiffCommentClick?: (rowData: any) => void;
  onViewCommentClick?: (rowData: any) => void;
  onSelectAll?: () => void;
  toggleCheckboxSelection?: (id: string) => void;
  onBulkAssignButtonClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  showBulkAssignButton?: boolean;
  bulkAssignButtonDisabled?: boolean;
  bulkAssignButtonText?: string;
  onRefetchPAOrderButtonClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  showRefetchPAOrderButton?: boolean;
  refetchPAOrderButtonDisabled?: boolean;
  refetchPAOrderButtonText?: string;
  isRefetchingPAOrder?: boolean;
  isDisabled?: boolean;
  requestForPaginationReset?: number;
  isFilterApplied?: boolean;
  onViewPDFClick?: (rowData: any) => void;
  handleDownloadButtonClick?: (id: string) => void;
  onTableRowUpdate?: (
    rowIndex: number,
    fieldKey: string,
    newValue: any,
  ) => void;
  disableHoverAndClick?: boolean;
  exportingInProgress?: boolean;
  placeholder?: string;
  showOtherButton?: boolean;
  otherButtonMeta?: {
    text: string;
    onClick: (event: MouseEvent<HTMLButtonElement>) => void;
    disabled: boolean;
    buttonType: "primary" | "secondary" | "tertiary";
    size: "small" | "medium" | "large";
  }[];
  isPreviousButtonDisabled?: boolean;
  startIndexOfTable?: (startIndex: number) => void;
  onPropagateEventOnClickInRpaStatusCell?: (id: string) => void;
  onPropagateEventOnClickInRpaStatusTwoCell?: (id: string) => void;
  onSideModalClose?: () => void;
  isCheckboxSelected?: boolean;
  onChangeEmit?: (data: {
    name: string;
    required: boolean;
    value: boolean;
  }) => void;
  expandableRowContent?: (rowData: any, rowIndex: number) => React.ReactNode;
  onRowExpansionChangeFromTableBody?: (expanded: boolean, id: string) => void;
  isExpandableRowTable?: boolean;
  screenName?: string;
  shouldLogEvent?: boolean;
  onButtonWithThreeDotsOptionClick?: (optionId: string, rowId: string) => void;
  scrollableWidth?: number;
  onValueChangeOfTextField?: (value: string, id: string) => void;
  hideSelectAllCheckbox?: boolean;
  onAddKeyButtonClick?: (rowData: any) => void;
}
