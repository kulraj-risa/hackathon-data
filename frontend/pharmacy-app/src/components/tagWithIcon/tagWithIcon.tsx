import { useRef, useState } from "react";
import { InfoIcon } from "../../svg/info-icon";
import ToolTipUsingPortal, {
  TooltipPlacement,
} from "../toolTipUsingPortal/toolTipUsingPortal";

interface TagWithIconProps {
  text: string;
  textOnHover: string;
  bgColor?: string;
  textColor?: string;
  iconColor?: string;
  borderColor?: string;
  maxWidth?: string;
  placement?: TooltipPlacement;
}

const TagWithIcon = ({
  text,
  textOnHover,
  bgColor,
  textColor,
  iconColor,
  borderColor,
  maxWidth,
  placement,
}: TagWithIconProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={parentRef}
      className="tag-with-icon flex min-w-0 max-w-full cursor-pointer flex-row items-center gap-1 rounded-3xl border-1 border-solid px-2 py-[0.125rem]"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      style={{
        backgroundColor: bgColor ? bgColor : "#CC0300",
        borderColor: borderColor ? borderColor : "transparent",
      }}
    >
      <div
        className="tag-with-icon__text min-w-0 flex-1 truncate text-x-tiny font-bold"
        style={{ color: textColor ? textColor : "white" }}
      >
        {text}
      </div>
      <div className="tag-with-icon__icon flex items-center justify-center">
        <InfoIcon
          stroke={iconColor ? iconColor : "white"}
          strokeWidth="1.5"
          height="12"
          width="12"
        />
      </div>
      {showTooltip && (
        <ToolTipUsingPortal
          title={textOnHover}
          placement={placement ? (placement as TooltipPlacement) : "left"}
          showTooltip={showTooltip}
          parentRef={parentRef}
          wrapText
          children={<div className={`w-[${maxWidth}]`}>{textOnHover}</div>}
          maxWidth={maxWidth ? maxWidth : ""}
        />
      )}
    </div>
  );
};

export default TagWithIcon;
