import { useEffect, useRef, useState } from "react";
import { BadgeWithIconProps } from "../../data-model/badgeWithIconProps";
import ChevronDown from "../../svg/chevron-down";
import BadgeWithIcon from "../badgeWithIcon/badgeWithIcon";
import "../portal/portal.scss";
import PositionedPortal from "../portal/PositionedPortal";

interface BadgeDropdownProps {
  label?: string;
  onClick?: (id: string) => void;
  defaultValue?: string;
  selectedBadge?: BadgeWithIconProps | null;
  defaultBadge?: BadgeWithIconProps | null;
  badgeList?: BadgeWithIconProps[];
  shouldUsePortal?: boolean;
  onDefaultBadgeClick?: (id: string) => void;
  showBorder?: boolean;
  borderColor?: string;
  resetCounter?: number;
}

const BadgeDropdown = (props: BadgeDropdownProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownOptionsRef = useRef<HTMLDivElement>(null);
  const [selectedBadge, setSelectedBadge] = useState<BadgeWithIconProps | null>(
    null,
  );

  const {
    shouldUsePortal = false,
    showBorder = false,
    borderColor = "#000000",
  } = props;

  useEffect(() => {
    setSelectedBadge(props.selectedBadge ?? props.defaultBadge ?? null);
  }, []);

  useEffect(() => {
    if (props?.resetCounter && props.resetCounter > 0) {
      setSelectedBadge(null);
    }
  }, [props.resetCounter]);

  const handleBadgeClick = (id: string) => {
    const selectedId = props.badgeList?.find((badge) => badge.id === id);
    selectedId && setSelectedBadge(selectedId);
  };

  const handleBadgeSelection = (id: string) => {
    handleBadgeClick(id);
    props?.onClick?.(id);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownOptionsRef.current &&
        !dropdownOptionsRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const renderDropdownContent = () => (
    <div
      className="portal-dropdown flex flex-col gap-3 p-3"
      ref={dropdownOptionsRef}
    >
      <div
        className="flex flex-col gap-3"
        onClick={(e) => {
          e.stopPropagation();
          const target = e.target as HTMLElement;
          const elementWithId = target.closest("[id]");
          selectedBadge?.id !== elementWithId?.id && setIsOpen(false);
        }}
      >
        {props.badgeList?.map((badge) => (
          <div
            className="w-full cursor-pointer rounded hover:bg-primaryGray-16"
            key={badge?.id ?? ""}
            onClick={() => {
              handleBadgeSelection(badge?.id ?? "");
            }}
          >
            <BadgeWithIcon
              style={{
                zIndex: 1000,
              }}
              text={badge?.text ?? ""}
              id={badge?.id ?? ""}
              textColor={badge?.textColor ?? "black"}
              bgColor={badge?.bgColor ?? "white"}
              key={badge?.id ?? ""}
              onClick={() => {}}
            />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="badge-drop-down__container relative w-max" ref={triggerRef}>
      {props.label && <div className="text-sm font-bold">{props.label}</div>}
      <BadgeWithIcon
        text={selectedBadge?.text || ""}
        icon={<ChevronDown stroke={selectedBadge?.textColor || "black"} />}
        id={selectedBadge?.id || ""}
        textColor={selectedBadge?.textColor || "black"}
        bgColor={selectedBadge?.bgColor || "white"}
        style={
          showBorder
            ? {
                border: `1px solid ${borderColor}`,
              }
            : undefined
        }
        onClick={() => {
          setIsOpen(true);
          props?.onDefaultBadgeClick?.(selectedBadge?.id || "");
        }}
      />

      {isOpen &&
        props.badgeList &&
        props.badgeList.length > 0 &&
        (shouldUsePortal ? (
          <PositionedPortal triggerRef={triggerRef} isOpen={isOpen}>
            {renderDropdownContent()}
          </PositionedPortal>
        ) : (
          <div className="absolute left-0 top-full z-50">
            {renderDropdownContent()}
          </div>
        ))}
    </div>
  );
};

export default BadgeDropdown;
