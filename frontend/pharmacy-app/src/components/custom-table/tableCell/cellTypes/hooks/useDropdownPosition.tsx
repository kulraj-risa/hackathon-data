import { RefObject, useLayoutEffect, useState } from "react";

/**
 * Result object returned by the useDropdownPosition hook.
 * @interface DropdownPositionResult
 * @property {DOMRect | null} position - The bounding rectangle of the parent element, or null if not calculated
 * @property {boolean} shouldFlipUp - Whether the dropdown should flip upward due to insufficient space below
 */
interface DropdownPositionResult {
  position: DOMRect | null;
  shouldFlipUp: boolean;
}

/**
 * Custom hook to calculate and track dropdown menu positioning relative to a parent element.
 *
 * This hook determines whether a dropdown menu should appear above or below its parent element
 * based on available viewport space. It automatically updates the position on window resize
 * and scroll events.
 *
 * The flip logic compares available space above and below the parent element:
 * - If space below is less than the menu height AND space above is greater than space below,
 *   the dropdown will flip upward.
 *
 * @param {boolean} isOpen - Whether the dropdown is currently open
 * @param {RefObject<HTMLElement>} parentRef - Reference to the parent/trigger element
 * @param {RefObject<HTMLElement>} menuRef - Reference to the dropdown menu element
 * @returns {DropdownPositionResult} Object containing position data and flip direction
 *
 * @example
 * const parentRef = useRef<HTMLDivElement>(null);
 * const menuRef = useRef<HTMLDivElement>(null);
 * const { position, shouldFlipUp } = useDropdownPosition(isOpen, parentRef, menuRef);
 *
 * // Use shouldFlipUp to conditionally apply CSS classes for positioning
 * <div style={{ top: shouldFlipUp ? 'auto' : position?.bottom, bottom: shouldFlipUp ? position?.top : 'auto' }}>
 *   {menuContent}
 * </div>
 */
export function useDropdownPosition(
  isOpen: boolean,
  parentRef: RefObject<HTMLElement>,
  menuRef: RefObject<HTMLElement>,
): DropdownPositionResult {
  const [position, setPosition] = useState<DOMRect | null>(null);
  const [shouldFlipUp, setShouldFlipUp] = useState(false);

  useLayoutEffect(() => {
    if (!isOpen) return;
    if (!parentRef.current || !menuRef.current) return;

    const updatePosition = () => {
      const parentRect = parentRef.current!.getBoundingClientRect();
      const menuRect = menuRef.current!.getBoundingClientRect();

      setPosition(parentRect);

      const spaceBelow = window.innerHeight - parentRect.bottom;
      const spaceAbove = parentRect.top;

      const flip = spaceBelow < menuRect.height && spaceAbove > spaceBelow;
      setShouldFlipUp(flip);
    };

    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, parentRef, menuRef]);

  return { position, shouldFlipUp };
}
