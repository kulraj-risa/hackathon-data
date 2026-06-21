import { CrossIcon } from "../../../../../svg/cross-icon";

interface BadgeTextWithCrossIconProps {
  text: string;
  onCrossClick: () => void;
}

const BadgeTextWithCrossIcon = (props: BadgeTextWithCrossIconProps) => {
  return (
    <div className="badge-text-with-cross-icon container flex w-fit items-center gap-1 rounded-full border border-primaryGray-10 bg-white px-2 py-1">
      <div className="badge-text-with-cross-icon__text text-x-tiny font-semibold text-primaryGray-1">
        <span>{props.text}</span>
      </div>
      <div
        className="badge-text-with-cross-icon__cross-icon cursor-pointer"
        onClick={props.onCrossClick}
      >
        <CrossIcon height="14px" width="14px" />
      </div>
    </div>
  );
};

export default BadgeTextWithCrossIcon;
