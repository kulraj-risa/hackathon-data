import React from "react";
import { useSelector } from "react-redux";
import { BadgeWithIconProps } from "../../../../data-model/badgeWithIconProps";
import { RootState } from "../../../../redux/store/store";
import SelectableBadge from "../../../selectableBadge/selectableBadge";

interface SelectableBadgeCellProps {
  value: BadgeWithIconProps & {
    onClick?: (badgeId: any, rowIndex: number) => void;
  };
  rowIndex: number;
  header: string;
  onValueChange?: (data: any) => void;
  onTableRowUpdate?: (data: any) => void;

  [key: string]: any;
}

export const SelectableBadgeCell: React.FC<SelectableBadgeCellProps> = ({
  value,
  rowIndex,
  header,
  onValueChange,
  onTableRowUpdate,
}) => {
  const { data: authStatusOptions } = useSelector(
    (state: RootState) => state.authStatusOptions,
  );

  return (
    <>
      <div
        className="table-cell-selectable-badge flex flex-row items-center gap-2"
        style={{
          zIndex: 1000,
        }}
      >
        <SelectableBadge
          selectedBadge={value}
          badgeList={authStatusOptions ?? []}
          onClick={(badgeId) => {
            if (value.onClick) {
              value.onClick(badgeId, rowIndex);
            }
          }}
          onValueChange={(newValue) => {
            if (onValueChange) {
              onValueChange(newValue);
            }
          }}
          fieldKey={header}
          rowIndex={rowIndex}
          onTableRowUpdate={onTableRowUpdate}
          shouldUsePortal={true}
        />
      </div>
    </>
  );
};

export default SelectableBadgeCell;
