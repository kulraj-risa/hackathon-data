import React from "react";

export interface DetailsCard {
  header: string;
  text: string;
  textColor?: string;
  icon?: React.JSX.Element;
  iconRight?: React.JSX.Element;
  fontWeight?: string;
  allowExpansion?: boolean;
  onClick?: (text?: string) => void;
}

export interface DetailsCardProps {
  details: DetailsCard[];
  elementsInOneRow: number;
  showBorder: boolean;
  className?: string;
}

export const DetailsCard = (props: DetailsCardProps) => {
  const width = `${100 / props.elementsInOneRow}%`;
  const isValidText = (text: string) => text !== "N/A";
  return (
    <div
      className={`details-card-container${
        props.showBorder ? " -with-border" : ""
      } ${props.className}`} //prettier-ignore
    >
      {props.details.map(
        (detail, index) =>
          isValidText(detail.text) && (
            <div
              className="details"
              style={{ width: detail?.allowExpansion ? "100%" : width }}
              key={index}
              onClick={() => detail?.onClick?.(detail.text)}
            >
              <div className="details_header">{detail.header}</div>
              <div
                className="details_text"
                title={detail.text}
                style={{
                  color: `${detail.textColor || "#0F0F0F"}`,
                  fontWeight: `${detail.fontWeight}`,
                }}
              >
                {detail.icon && (
                  <div className="details_text-icon">{detail.icon}</div>
                )}
                <div className="details_text-main"> {detail.text}</div>
                {detail.iconRight && (
                  <div className="details_text-icon hover:cursor-pointer">
                    {detail.iconRight}
                  </div>
                )}
              </div>
            </div>
          ),
      )}
    </div>
  );
};
