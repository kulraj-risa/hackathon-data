import { BadgeWithIconProps } from "../../data-model/badgeWithIconProps";

const BadgeWithIcon = ({
  text,
  icon,
  onClick,
  textColor,
  bgColor,
  id,
  style,
}: BadgeWithIconProps) => {
  return (
    <div
      className="badge-drop-downn badge-container flex w-max items-center gap-1 rounded-[0.25rem] px-2 py-1 hover:cursor-pointer"
      id={id}
      onClick={(e) => {
        onClick?.(id);
      }}
      style={{ backgroundColor: bgColor, ...style }}
    >
      <div
        className="badge-drop-down text text-x-tiny font-semibold leading-5"
        style={{ color: textColor }}
      >
        {text}
      </div>
      {icon && <div className="badge-drop-down icon">{icon}</div>}
    </div>
  );
};

export default BadgeWithIcon;
