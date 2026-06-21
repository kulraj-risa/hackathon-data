interface SideNavElementProps {
  active?: boolean;
  label: string;
  id: string;
  onSelect?: (id: string) => void;
  className?: string;
  activeClassName?: string;
  inactiveClassName?: string;
  containerClassName?: string;
}

const SideNavElement = (props: SideNavElementProps) => {
  const {
    active = false,
    label,
    id,
    onSelect,
    className = "",
    activeClassName = "",
    inactiveClassName = "",
    containerClassName = "",
  } = props;

  const defaultContainerClass = `side-nav-element--container h-fit w-full cursor-pointer border-l-4 py-1 ${
    active ? "border-tertiaryBlue-4" : "border-transparent"
  }`;

  const defaultActiveContentClass =
    "side-nav-element--active-content truncate p-2 text-small font-bold text-tertiaryBlue-4";

  const defaultInactiveContentClass =
    "side-nav-element--inactive truncate p-2 text-small font-regular hover:bg-primaryGray-15 hover:font-semiBold";

  return (
    <div
      className={`${defaultContainerClass} ${containerClassName} ${className}`}
      onClick={() => onSelect?.(id)}
    >
      {active ? (
        <div className={`${defaultActiveContentClass} ${activeClassName}`}>
          {label}
        </div>
      ) : (
        <div className={`${defaultInactiveContentClass} ${inactiveClassName}`}>
          {label}
        </div>
      )}
    </div>
  );
};

export default SideNavElement;
