import React from "react";
import ThreeDotIconWithContextMenu from "../../../threeDotsWithContextMenu/threeDotsWithContextMenu";

interface IconCellProps {
  value: { contextMenuItems: any };
  [key: string]: any;
}

export const IconCell: React.FC<IconCellProps> = ({ value }) => {
  return (
    <>
      <div className="table-cell-text-with-context-menu">
        <ThreeDotIconWithContextMenu menuData={value.contextMenuItems} />
      </div>
    </>
  );
};

export default IconCell;
