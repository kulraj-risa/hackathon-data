import TagWithIcon from "../../../tagWithIcon/tagWithIcon";

interface TagWithIconCellProps {
  value: {
    alert_badges: string[];
    alerts: string[];
  };
}
const TagWithIconCell = ({ value }: TagWithIconCellProps) => {
  const hoverText = value.alerts?.join("\n") || "";
  const alertBadges = value.alert_badges || [];
  const remainingCount = alertBadges.length > 1 ? alertBadges.length - 1 : 0;

  return (
    <div className="flex w-full min-w-0 flex-row items-center gap-2">
      {alertBadges.length > 0 && (
        <TagWithIcon
          key={0}
          text={alertBadges[0]}
          textOnHover={hoverText}
          maxWidth="100%"
        />
      )}
      {remainingCount > 0 && (
        <span className="whitespace-nowrap text-x-tiny font-semiBold">
          +{remainingCount}
        </span>
      )}
    </div>
  );
};

export default TagWithIconCell;
