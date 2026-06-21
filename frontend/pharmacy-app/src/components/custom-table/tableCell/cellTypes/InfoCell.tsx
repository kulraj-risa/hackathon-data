import React from "react";
import InfoIconWithContextMenu from "../../../iconWithContextMenu/iconWithContextMenu";

interface InfoCellProps {
  value: { count: any; cptCodesWithStatus: any };
  [key: string]: any;
}

export const InfoCell: React.FC<InfoCellProps> = ({ value }) => {
  return (
    <>
      <div className="table-cell-text-with-context-menu">
        <div className="value">{value.count}</div>
        <InfoIconWithContextMenu
          infoWithContextMenuProps={value.cptCodesWithStatus}
        />
      </div>
    </>
  );
};

export default InfoCell;
