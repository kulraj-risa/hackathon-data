import { useRef, useState } from "react";
import ToolTipUsingPortal from "../../../toolTipUsingPortal/toolTipUsingPortal";

interface StringWithCustomToolTipCellProps {
  value: {
    displayText: string;
    tooltipText: string;
  };
}
const StringWithCustomToolTipCell = (
  props: StringWithCustomToolTipCellProps,
) => {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);
  return (
    <div
      className="w-full overflow-hidden truncate text-small font-normal text-primaryGray-3"
      onMouseEnter={() => setIsTooltipOpen(true)}
      onMouseLeave={() => setIsTooltipOpen(false)}
      ref={parentRef}
    >
      {props.value.displayText}
      {isTooltipOpen && (
        <ToolTipUsingPortal
          title={props.value.tooltipText}
          placement="top-right"
          showTooltip={isTooltipOpen}
          parentRef={parentRef}
          wrapText
          children={
            <div className="w-96 overflow-auto text-tiny font-normal text-primaryGray-3">
              {props.value.tooltipText ?? ""}
            </div>
          }
        />
      )}
    </div>
  );
};

export default StringWithCustomToolTipCell;
