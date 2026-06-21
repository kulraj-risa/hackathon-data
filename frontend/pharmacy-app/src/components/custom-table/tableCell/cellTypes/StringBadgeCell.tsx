import React from "react";

interface StringBadgeCellProps {
  value: { stringText: string; badgeText: string };
  [key: string]: any;
}

export const StringBadgeCell: React.FC<StringBadgeCellProps> = ({ value }) => {
  return (
    <>
      <div style={{ display: "flex" }}>
        <div style={{ paddingRight: "16px" }}>{value.stringText}</div>
        {value.badgeText !== "" && (
          <div
            className="table-cell-string-badge"
            style={{
              color: "#0F0F0F",
              backgroundColor: "#F5F5F5",
            }}
          >
            {value.badgeText}
          </div>
        )}
      </div>
    </>
  );
};

export default StringBadgeCell;
