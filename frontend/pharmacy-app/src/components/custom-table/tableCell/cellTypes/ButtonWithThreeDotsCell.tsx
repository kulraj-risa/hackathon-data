import { useEffect, useRef, useState } from "react";
import AnchoredPortal from "../../../../components/anchoredPortal/anchoredPortal";

import { TableCellButtonWithThreeDots } from "../../../../data-model/tableCells";
import { ThreeDotIcon } from "../../../../svg/three-dot-icon";
import PopOverWithClickableOptions from "../../../popOverWithClickableOptions/popOverWithClickableOptions";
import { useDropdownPosition } from "./hooks/useDropdownPosition";

interface ButtonWithThreeDotsCellProps {
  value: TableCellButtonWithThreeDots;
  onThreeDotsOptionClick?: (optionId: string, rowId: string) => void;
}

const ButtonWithThreeDotsCell = (props: ButtonWithThreeDotsCellProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const { position, shouldFlipUp } = useDropdownPosition(
    isOpen,
    parentRef,
    menuRef,
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        parentRef.current &&
        menuRef.current &&
        !parentRef.current.contains(event.target as Node) &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleOnOptionsClick = (id: string) => {
    if (props.onThreeDotsOptionClick && props.value.rowId) {
      props.onThreeDotsOptionClick(id, props.value.rowId);
    }
    setIsOpen(false);
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (props.value.disabled) return;
    if (props.onThreeDotsOptionClick && props.value.rowId) {
      props.onThreeDotsOptionClick(props.value.buttonId, props.value.rowId);
    }
  };

  const handleThreeDotsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const hasOptions =
    props.value.threeDotsOptions && props.value.threeDotsOptions.length > 0;

  const handleArrowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (props.onThreeDotsOptionClick && props.value.rowId) {
      props.onThreeDotsOptionClick(
        props.value.navigateArrowId ?? "view_details",
        props.value.rowId,
      );
    }
  };

  const handleEyeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (props.onThreeDotsOptionClick && props.value.rowId) {
      props.onThreeDotsOptionClick(
        props.value.eyeIconId ?? "workflow_timeline",
        props.value.rowId,
      );
    }
  };

  const showSecondaryGroup =
    props.value.showEyeIcon || props.value.showNavigateArrow || hasOptions;

  return (
    <div className="flex flex-row items-center gap-1.5">
      {/* Main button */}
      <div
        onClick={handleButtonClick}
        className={`h-auto rounded-md px-3.5 py-2 text-center text-xs font-semibold ${
          props.value.disabled
            ? "bg-black text-gray-200 opacity-50"
            : "cursor-pointer bg-black text-white hover:bg-gray-800"
        }`}
      >
        {props.value.label}
      </div>

      {/* Secondary icon group — unified pill */}
      {showSecondaryGroup && (
        <div className="flex h-8 items-center overflow-hidden rounded-md border border-gray-200 bg-white">
          {props.value.showEyeIcon && (
            <div
              className="flex h-full w-8 cursor-pointer items-center justify-center text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
              onClick={handleEyeClick}
              title="Workflow Timeline"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
          )}
          {props.value.showNavigateArrow && (
            <>
              {props.value.showEyeIcon && (
                <div className="h-4 w-px bg-gray-200" />
              )}
              <div
                className="flex h-full w-8 cursor-pointer items-center justify-center text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                onClick={handleArrowClick}
                title="View Details"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </div>
            </>
          )}
          {hasOptions && (
            <>
              {(props.value.showEyeIcon || props.value.showNavigateArrow) && (
                <div className="h-4 w-px bg-gray-200" />
              )}
              <div
                className="flex h-full w-8 cursor-pointer items-center justify-center text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                onClick={handleThreeDotsClick}
                ref={parentRef}
              >
                <ThreeDotIcon />
                <AnchoredPortal
                  parentRef={parentRef}
                  shouldShow={isOpen}
                  top={shouldFlipUp ? undefined : (position?.bottom ?? 0) + 5}
                  bottom={
                    shouldFlipUp
                      ? window.innerHeight - (position?.top ?? 0) + 5
                      : undefined
                  }
                  right={15}
                  zIndex={1000}
                  children={
                    <div ref={menuRef}>
                      <PopOverWithClickableOptions
                        options={
                          props.value.threeDotsOptions?.map((opt) => ({
                            text: opt.text,
                            id: opt.id,
                          })) ?? []
                        }
                        onClick={handleOnOptionsClick}
                      />
                    </div>
                  }
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ButtonWithThreeDotsCell;
