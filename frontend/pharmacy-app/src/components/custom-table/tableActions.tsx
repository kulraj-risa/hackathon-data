import React, { MouseEvent, MutableRefObject } from "react";
import { Button, SpinningLoader } from "risa-oasis-ui_v2";
import { FilterSection, FilterValues } from "../../data-model/filterValues";
import FilterButton from "../filterButton/filterButton";
import FilterTag from "../filtertag/filtertag";
import RefreshButton from "../refreshButton/refreshButton";
import SearchBar from "../searchBar/searchBar";
import TableHeader from "./tableHeader";

interface TableActionsProps {
  onSearchClicked: (searchText: string) => void;
  onRefreshButton?: () => void;
  tableName: string;
  defaultValueRef?: MutableRefObject<string | null>;
  showFilterButton?: boolean;
  filterSectionsData?: FilterSection[];
  onFilterApplyClicked?: (data: FilterValues) => void;
  hideSearchBar?: boolean;
  showExportButton?: boolean;
  showRefreshButton?: boolean;
  onExportButtonClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  isDisabled?: boolean;
  onBulkAssignButtonClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  showBulkAssignButton?: boolean;
  bulkAssignButtonDisabled?: boolean;
  bulkAssignButtonText?: string;
  onRefetchPAOrderButtonClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  showRefetchPAOrderButton?: boolean;
  refetchPAOrderButtonDisabled?: boolean;
  refetchPAOrderButtonText?: string;
  isRefetchingPAOrder?: boolean;
  onSelectAll?: () => void;
  tableWidth: number;
  onSortTableData: (key: string, subKey?: string, type?: string) => void;
  sortedTableHeaders: any[];
  tableDataLength: number;
  onDownloadButtonClick?: (id: string) => void;
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
  isCheckboxSelected?: boolean;
  screenName?: string;
  shouldLogEvent?: boolean;
  hideSelectAllCheckbox?: boolean;
  scrollableWidth?: number;
}

const TableActions: React.FC<TableActionsProps> = ({
  onSearchClicked,
  onRefreshButton,
  tableName,
  defaultValueRef,
  showFilterButton,
  filterSectionsData,
  onFilterApplyClicked,
  hideSearchBar,
  showExportButton,
  showRefreshButton,
  onExportButtonClick,
  isDisabled,
  onBulkAssignButtonClick,
  showBulkAssignButton,
  bulkAssignButtonDisabled,
  bulkAssignButtonText,
  onRefetchPAOrderButtonClick,
  showRefetchPAOrderButton,
  refetchPAOrderButtonDisabled,
  refetchPAOrderButtonText,
  isRefetchingPAOrder,
  tableWidth,
  onSortTableData,
  sortedTableHeaders,
  onSelectAll,
  tableDataLength,
  onDownloadButtonClick,
  exportingInProgress,
  placeholder,
  showOtherButton,
  otherButtonMeta,
  isCheckboxSelected,
  screenName,
  shouldLogEvent,
  hideSelectAllCheckbox,
  scrollableWidth,
}) => {
  return (
    <>
      <div className="table-actions--container sticky top-0 z-50 flex flex-col bg-white pt-1">
        <div className="flex justify-between">
          <div className="table-actions--search-filter flex w-1/2 flex-col gap-1">
            <div className="flex">
              {!hideSearchBar && (
                <div className="mr-1 flex-1">
                  <SearchBar
                    placeHolder={
                      placeholder ?? "Search by Patient Name, Member ID ..."
                    }
                    onSearchClick={onSearchClicked}
                    defaultValue={defaultValueRef?.current ?? ""}
                    id={tableName}
                    isDisabled={isDisabled}
                    shouldLogEvent={shouldLogEvent}
                    screenName={screenName}
                  />
                </div>
              )}
              {showFilterButton && (
                <FilterButton
                  name={tableName}
                  filterSectionsData={filterSectionsData ?? []}
                  onFilterApply={onFilterApplyClicked ?? (() => {})}
                  screenName={screenName}
                />
              )}
            </div>
          </div>

          <div className="table-actions--right-container flex gap-2">
            <>
              {showBulkAssignButton && (
                <Button
                  buttonType="secondary"
                  disabled={bulkAssignButtonDisabled ?? false}
                  size="medium"
                  onClick={onBulkAssignButtonClick ?? (() => {})}
                >
                  {bulkAssignButtonText ?? "Bulk Assign"}
                </Button>
              )}
              {showRefetchPAOrderButton && (
                <Button
                  buttonType="secondary"
                  disabled={refetchPAOrderButtonDisabled ?? false}
                  size="medium"
                  onClick={onRefetchPAOrderButtonClick ?? (() => {})}
                >
                  {isRefetchingPAOrder
                    ? "Refetching..."
                    : (refetchPAOrderButtonText ?? "Refetch PA Order")}
                </Button>
              )}
              {showExportButton && (
                <Button
                  buttonType="secondary"
                  disabled={exportingInProgress ?? false}
                  size="medium"
                  onClick={onExportButtonClick ?? (() => {})}
                >
                  {exportingInProgress ? (
                    <div className="flex items-center gap-2">
                      <SpinningLoader />
                      <span className="text-sm font-medium">Exporting...</span>
                    </div>
                  ) : (
                    "Export"
                  )}
                </Button>
              )}
              {showOtherButton && otherButtonMeta && (
                <>
                  {otherButtonMeta.map((buttonMeta, index) => (
                    <Button
                      key={index}
                      buttonType={buttonMeta?.buttonType ?? "secondary"}
                      disabled={buttonMeta?.disabled ?? false}
                      size={buttonMeta?.size ?? "medium"}
                      onClick={buttonMeta?.onClick ?? (() => {})}
                    >
                      {buttonMeta?.text ?? "Other Button"}
                    </Button>
                  ))}
                </>
              )}
            </>
            {showRefreshButton && <RefreshButton onClick={onRefreshButton} />}
          </div>
        </div>

        <div className="filter-tags-wrapper w-full">
          {showFilterButton && filterSectionsData && onFilterApplyClicked && (
            <div className="filter-tags-container w-full">
              <FilterTag
                name={tableName}
                onFilterApply={onFilterApplyClicked}
              />
            </div>
          )}
        </div>
        <div className="mt-2">
          <table key={tableName}>
            {tableDataLength > 0 && (
              <TableHeader
                sortedTableHeaders={sortedTableHeaders}
                tableWidth={tableWidth}
                onSortTableData={onSortTableData}
                onSelectAll={onSelectAll}
                isCheckboxSelected={isCheckboxSelected ?? false}
                hideSelectAllCheckbox={hideSelectAllCheckbox ?? false}
              />
            )}
          </table>
        </div>
      </div>
    </>
  );
};

export default TableActions;
