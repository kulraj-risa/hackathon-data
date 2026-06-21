import { BadgeWithIconRoundedProps } from "../../data-model/badgeWithIconProps";

const BadgeWithIconRounded = ({
  text,
  icon,
  onClick,
  textColor,
  bgColor,
  id,
  style,
  borderColor,
}: BadgeWithIconRoundedProps) => {
  return (
    <div
      className="badge-drop-downn badge-container flex w-max items-center gap-1 rounded-[1rem] px-2 py-1 hover:cursor-pointer"
      id={id}
      onClick={(e) => {
        onClick?.(id);
      }}
      style={{
        backgroundColor: bgColor,
        borderColor: borderColor,
        borderWidth: "0.5px",
        borderStyle: "solid",
      }}
    >
      {icon && <div className="badge-drop-down icon">{icon}</div>}
      <div
        className="badge-drop-down text-x-tiny leading-5"
        style={{ color: textColor }}
      >
        {text}
      </div>
    </div>
  );
};

export default BadgeWithIconRounded;
