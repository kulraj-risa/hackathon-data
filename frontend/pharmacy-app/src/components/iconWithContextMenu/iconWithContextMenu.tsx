import { useEffect, useRef, useState } from "react";

export interface InfoWithContextMenuProps {
  text?: string;
  value?: boolean;
  image: () => JSX.Element;
}

interface Props {
  infoWithContextMenuProps: InfoWithContextMenuProps[];
}

export default function InfoIconWithContextMenu(props: Props) {
  const iconRef = useRef<HTMLDivElement>(null);
  const [topValue, setTopValue] = useState(0);

  useEffect(() => {
    if (iconRef.current) {
      const { top } = iconRef.current.getBoundingClientRect();
      setTopValue(top);
    }
  }, []);

  return (
    <div className="info-with-context-menu-container">
      <div className="info-with-context-menu-container--icon" ref={iconRef}>
        {props.infoWithContextMenuProps?.[0]?.image?.()}
        <div
          className={
            topValue > window.innerHeight * 0.65
              ? "info-with-context-menu-container--menu-holder __bottom"
              : "info-with-context-menu-container--menu-holder __top"
          }
        >
          {props.infoWithContextMenuProps.map((item, index) => (
            <div key={index} className="context-menu-items">
              <div className="context-menu-items--text">{item.text}</div>
              <div>-</div>
              <div
                className={`context-menu-items--value__${
                  item.value ? "true" : "false"
                }`}
              >
                {item.value ? "Req." : "NA"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
