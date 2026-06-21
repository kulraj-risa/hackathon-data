import React from "react";
import EditableTextCellComponent from "../../../editableTextCell/editableTextCell";

interface EditableTextCellProps {
  value: {
    data: any;
    hasError?: boolean;
  };
  onValueChange?: (data: any) => void;
  header: string;
  rowIndex: number;
  onTableRowUpdate?: (data: any) => void;
  [key: string]: any;
}

export const EditableTextCell: React.FC<EditableTextCellProps> = ({
  value,
  onValueChange,
  header,
  rowIndex,
  onTableRowUpdate,
}) => {
  return (
    <>
      <EditableTextCellComponent
        value={value.data}
        onValueChange={onValueChange ?? (() => {})}
        fieldKey={header}
        rowIndex={rowIndex}
        onTableRowUpdate={onTableRowUpdate}
        hasError={value.hasError}
      />
    </>
  );
};

export default EditableTextCell;
