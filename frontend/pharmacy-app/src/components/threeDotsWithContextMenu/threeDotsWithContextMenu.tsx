import { useEffect, useRef, useState } from "react";
import { ThreeDotIcon } from "../../svg/three-dot-icon";
import { MenuItem } from "../menuItems/menuItems";
import "./threeDotsWithContextMenu";

export interface ThreeDotIconWithContextMenuProps {
  label: string;
  color?: string;
  onClick: (arg?: any) => Promise<void> | void;
}

const ThreeDotIconWithContextMenu = (props: {
  menuData: ThreeDotIconWithContextMenuProps[];
  className?: string;
}) => {
  const iconRef = useRef<HTMLDivElement>(null);
  const [topValue, setTopValue] = useState(0);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    if (iconRef.current) {
      const { top } = iconRef.current.getBoundingClientRect();
      setTopValue(top);
    }
  }, [iconRef]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (iconRef.current && !iconRef.current.contains(event.target as Node)) {
        setMenuVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [iconRef]);

  const toggleMenuVisibility = () => {
    setMenuVisible(!menuVisible);
  };

  return (
    <div className="three-dots-icon-with-context-menu-container">
      <div
        className="three-dots-icon-with-context-menu-container--icon"
        ref={iconRef}
      >
        <div onClick={toggleMenuVisibility}>
          <ThreeDotIcon className={props.className} />
        </div>
        {menuVisible && (
          <div
            className={
              topValue > window.innerHeight * 0.65
                ? "three-dots-icon-with-context-menu-container--menu-holder __bottom"
                : "three-dots-icon-with-context-menu-container--menu-holder __top"
            }
          >
            <div className="context-menu-items">
              {props.menuData.map((item, index) => (
                <MenuItem
                  key={index}
                  label={item.label}
                  onClick={() => item.onClick(item)}
                  color={item.color}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThreeDotIconWithContextMenu;
