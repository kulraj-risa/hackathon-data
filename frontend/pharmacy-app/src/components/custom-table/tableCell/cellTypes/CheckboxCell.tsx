import React from "react";
import CustomCheckBox from "../../../customCheckBox/customCheckBox";

interface CheckboxCellProps {
  value: { id: string; label: string; isChecked: boolean; disabled?: boolean };
  toggleCheckboxSelection?: (id: string) => void;
  [key: string]: any;
}

export const CheckboxCell: React.FC<CheckboxCellProps> = ({
  value,
  toggleCheckboxSelection,
}) => {
  return (
    <>
      <div
        className="table-cell-checkbox flex items-center justify-start"
        onClick={() => !value.disabled && toggleCheckboxSelection?.(value.id)}
      >
        <CustomCheckBox
          id={value.id}
          label={value.label}
          isChecked={value.isChecked}
          isDisabled={value.disabled}
          onCheckBoxValueChange={function (data: {
            name: string;
            value: boolean;
          }): void {}}
          removeGap={true}
        />
      </div>
    </>
  );
};

export default CheckboxCell;
