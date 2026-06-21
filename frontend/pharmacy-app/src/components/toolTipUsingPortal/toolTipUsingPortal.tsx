import React from "react";
import { createPortal } from "react-dom";

export type TooltipPlacement =
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export function computeTooltipPosition(
  anchorRect: DOMRect,
  placement: TooltipPlacement,
  offsetPx: number = 15,
  maxWidth: string = "500px",
): React.CSSProperties {
  const halfWidth = anchorRect.width / 2;
  const halfHeight = anchorRect.height / 2;

  switch (placement) {
    case "right":
      return {
        position: "fixed",
        top: anchorRect.top + halfHeight,
        left: anchorRect.right + offsetPx,
        transform: "translate(0, -10px)",
        zIndex: 2147483647,
        maxWidth: maxWidth,
      };
    case "left":
      return {
        position: "fixed",
        top: anchorRect.top + halfHeight,
        left: anchorRect.left - offsetPx,
        transform: "translate(-100%, -10px)",
        zIndex: 2147483647,
        maxWidth: maxWidth,
      };
    case "top":
      return {
        position: "fixed",
        top: anchorRect.top - offsetPx,
        left: anchorRect.left + halfWidth,
        transform: "translate(-10px, -100%)",
        zIndex: 2147483647,
        maxWidth: maxWidth,
      };
    case "top-left":
      return {
        position: "fixed",
        top: anchorRect.top - offsetPx,
        left: anchorRect.left,
        transform: "translate(0, -100%)",
        zIndex: 2147483647,
        maxWidth: maxWidth,
      };
    case "top-right":
      return {
        position: "fixed",
        top: anchorRect.top - offsetPx,
        left: anchorRect.right,
        transform: "translate(-100%, -100%)",
        zIndex: 2147483647,
        maxWidth: maxWidth,
      };
    case "bottom":
    default:
      return {
        position: "fixed",
        top: anchorRect.bottom + offsetPx,
        left: anchorRect.left + halfWidth,
        transform: "translate(-10px, 0)",
        zIndex: 2147483647,
        maxWidth: maxWidth,
      };
    case "bottom-left":
      return {
        position: "fixed",
        top: anchorRect.bottom + offsetPx,
        left: anchorRect.left,
        transform: "translate(0, 0)",
        zIndex: 2147483647,
        maxWidth: maxWidth,
      };
    case "bottom-right":
      return {
        position: "fixed",
        top: anchorRect.bottom + offsetPx,
        left: anchorRect.right,
        transform: "translate(-100%, 0)",
        zIndex: 2147483647,
        maxWidth: maxWidth,
      };
  }
}

const ToolTipUsingPortal = ({
  children,
  title,
  placement,
  showTooltip,
  parentRef,
  offsetPx = 5,
  wrapText = false,
  maxWidth = "500px",
}: {
  children: React.ReactNode;
  title?: string;
  placement: TooltipPlacement;
  showTooltip: boolean;
  parentRef: React.RefObject<HTMLDivElement>;
  offsetPx?: number;
  wrapText?: boolean;
  maxWidth?: string;
}) => {
  if (!showTooltip) return null;
  const anchor = parentRef.current;
  if (!anchor) return null;

  const rect = anchor.getBoundingClientRect();
  const style = computeTooltipPosition(rect, placement, offsetPx, maxWidth);

  return createPortal(
    <div
      style={style}
      data-placement={placement}
      role="tooltip"
      className={`border-priamryGray-16 rounded-md border bg-white p-2 text-tiny shadow-lg ${
        wrapText ? `whitespace-normal` : "w-fit max-w-fit whitespace-nowrap"
      }`}
    >
      {children ?? title}
    </div>,
    document.body,
  );
};

export default ToolTipUsingPortal;
