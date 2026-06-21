import React from "react";
import { Delete } from "../../../../svg/delete";

interface DeleteIconCellProps {
  value: any;
  handleDeleteIconClick?: (data: any) => void;
  [key: string]: any;
}

export const DeleteIconCell: React.FC<DeleteIconCellProps> = ({
  value,
  handleDeleteIconClick,
}) => {
  return (
    <>
      <div onClick={() => handleDeleteIconClick?.(value)}>
        <Delete />
      </div>
    </>
  );
};

export default DeleteIconCell;
