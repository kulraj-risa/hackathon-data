import { ReactNode, useEffect, useRef, useState } from "react";

interface SideModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  id?: string;
  width?: string;
}

const SideModal = (props: SideModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        props.onClose();
      }
    };

    if (props.isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 100);

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        clearTimeout(timer);
        setIsVisible(false);
      };
    }
  }, [props.isOpen, props.onClose]);

  return (
    <div
      className={`filter-modal--container fixed inset-0 z-[999] bg-black bg-opacity-65 transition-opacity duration-300 ${
        props.isOpen
          ? "pointer-events-auto opacity-100"
          : "pointer-events-none opacity-0"
      }`}
      onClick={props.onClose}
    >
      <div
        ref={modalRef}
        className={`filter-modal--body absolute right-0 top-0 h-full transform bg-white shadow-lg transition-transform duration-300 ${
          isVisible ? "translate-x-0" : "translate-x-full"
        } ${props.width ? `w-[${props.width}]` : "w-2/5"}`}
        id={props?.id ?? "filter-modal"}
        onClick={(e) => e.stopPropagation()}
        style={{
          cursor: "default",
        }}
      >
        {props.children}
      </div>
    </div>
  );
};

export default SideModal;
