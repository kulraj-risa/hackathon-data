import React, { useEffect, useState } from "react";
import { SortArrow } from "../../svg/sort-arrow";
import CustomCheckBox from "../customCheckBox/customCheckBox";
import { TableCellType } from "./table";

interface TableHeaderProps {
  sortedTableHeaders: {
    key: string;
    label: string;
    width: number;
    sortable: boolean;
    subKey?: string;
    type?: string;
  }[];
  tableWidth: number;
  onSortTableData: (key: string, subKey?: string, type?: string) => void;
  onSelectAll?: () => void;
  isCheckboxSelected?: boolean;
  hideSelectAllCheckbox?: boolean;
  scrollableWidth?: number;
}

const TableHeader: React.FC<TableHeaderProps> = ({
  sortedTableHeaders,
  tableWidth,
  onSortTableData,
  onSelectAll,
  isCheckboxSelected,
  hideSelectAllCheckbox,
  scrollableWidth,
}) => {
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    setIsChecked(isCheckboxSelected || false);
  }, [isCheckboxSelected]);

  return (
    <thead>
      <tr
        style={{
          display: "flex",
          width: scrollableWidth ? `${scrollableWidth}%` : "100%",
        }}
      >
        {sortedTableHeaders.map((header, index) => (
          <td
            key={index}
            style={{
              width: `${header.width}%`,
              ...(index === 0
                ? {
                    position: "sticky" as const,
                    left: 0,
                    zIndex: 2,
                    backgroundColor: "#f5f5f5",
                  }
                : {}),
            }}
          >
            <div
              className="header-details"
              onClick={
                header.type === TableCellType.CHECKBOX && !hideSelectAllCheckbox
                  ? onSelectAll
                  : undefined
              }
            >
              <div className="header-details--text truncate">
                {header.type === TableCellType.CHECKBOX &&
                !hideSelectAllCheckbox ? (
                  <div className="header-details--checkbox flex items-center justify-center">
                    <CustomCheckBox
                      id={header.key}
                      label={""}
                      isChecked={isChecked}
                      onCheckBoxValueChange={() => setIsChecked(!isChecked)}
                      removeGap={true}
                    />
                  </div>
                ) : (
                  header.label
                )}
              </div>
              <div className="header-details--icon">
                {header.sortable && (
                  <SortArrow
                    onClick={() =>
                      onSortTableData(header.key, header.subKey, header.type)
                    }
                  />
                )}
              </div>
            </div>
          </td>
        ))}
      </tr>
    </thead>
  );
};

export default TableHeader;
