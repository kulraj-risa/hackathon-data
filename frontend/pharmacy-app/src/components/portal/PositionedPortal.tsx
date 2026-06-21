import { useEffect, useRef, useState } from "react";
import Portal from "./Portal";

interface PositionedPortalProps {
  children: React.ReactNode;
  triggerRef: React.RefObject<HTMLElement>;
  isOpen: boolean;
}

const PositionedPortal = ({
  children,
  triggerRef,
  isOpen,
}: PositionedPortalProps) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      // Default position below the trigger
      let top = rect.bottom + window.scrollY;
      let left = rect.left + window.scrollX;

      // Check if dropdown would go off the bottom of the screen
      if (dropdownRef.current) {
        const dropdownHeight = dropdownRef.current.offsetHeight;
        if (rect.bottom + dropdownHeight > viewportHeight + window.scrollY) {
          // Position above the trigger instead
          top = rect.top + window.scrollY - dropdownHeight;
        }

        // Check if dropdown would go off the right side of the screen
        const dropdownWidth = dropdownRef.current.offsetWidth;
        if (rect.left + dropdownWidth > viewportWidth + window.scrollX) {
          // Align to the right edge of the trigger
          left = rect.right + window.scrollX - dropdownWidth;
        }
      }

      setPosition({ top, left });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();

      // Update position on scroll and resize
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);

      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [isOpen, triggerRef]);

  if (!isOpen) return null;

  return (
    <Portal>
      <div
        ref={dropdownRef}
        style={{
          position: "absolute",
          top: position.top,
          left: position.left,
          zIndex: 9999,
        }}
      >
        {children}
      </div>
    </Portal>
  );
};

export default PositionedPortal;
