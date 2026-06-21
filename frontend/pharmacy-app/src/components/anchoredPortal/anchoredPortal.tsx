import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface AnchoredPortalProps {
  container?: Element | DocumentFragment | null;
  parentRef: React.RefObject<HTMLElement>;
  shouldShow: boolean;
  children: React.ReactNode;
  top?: number | string;
  left?: number | string;
  right?: number | string;
  bottom?: number | string;
  zIndex?: number;
}

const AnchoredPortal: React.FC<AnchoredPortalProps> = ({
  container,
  parentRef,
  shouldShow,
  children,
  top,
  left,
  right,
  bottom,
  zIndex = 1000,
}) => {
  const [mountNode, setMountNode] = useState<Element | DocumentFragment | null>(
    null,
  );
  const [position, setPosition] = useState<{
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
  }>({});

  useEffect(() => {
    setMountNode(container || document.body);
  }, [container]);

  useEffect(() => {
    if (parentRef.current && shouldShow) {
      const rect = parentRef.current.getBoundingClientRect();

      const calculatePosition = (
        value: number | string | undefined,
        rectValue: number,
      ): string | undefined => {
        if (value === undefined) return undefined;

        if (typeof value === "string") {
          // If it's already a string (like "calc(100% - 20px)"), use it as is
          return value;
        }

        // If it's a number, add it to the rect value and convert to px
        return `${value}px`;
      };

      setPosition({
        top: calculatePosition(top, rect.top),
        left: calculatePosition(left, rect.left),
        right: calculatePosition(right, rect.right),
        bottom: calculatePosition(bottom, rect.bottom),
      });
    }
  }, [parentRef, shouldShow, top, left, right, bottom]);

  if (!shouldShow || !mountNode) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        right: position.right,
        bottom: position.bottom,
        zIndex,
      }}
    >
      {children}
    </div>,
    mountNode,
  );
};

export default AnchoredPortal;
