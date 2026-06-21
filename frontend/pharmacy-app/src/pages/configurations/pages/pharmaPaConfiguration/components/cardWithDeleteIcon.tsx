import { useMemo, useState } from "react";
import { Delete } from "../../../../../svg/delete";

interface CardWithDeleteIconProps {
  text: string;
  onDelete: () => void;
  exitDirection?: "left" | "right";
}

const CardWithDeleteIcon = ({
  text,
  onDelete,
  exitDirection = "left",
}: CardWithDeleteIconProps) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleDelete = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDelete();
    }, 300);
  };

  const exitDirectionClass = useMemo(() => {
    return exitDirection === "left" ? "-translate-x-4" : "translate-x-4";
  }, [exitDirection]);

  return (
    <div
      className={`card-with-delete-icon flex cursor-pointer items-center justify-between gap-2 rounded border border-primaryGray-16 bg-white p-2 shadow-sm transition-all duration-300 ease-in-out ${isExiting ? `${exitDirectionClass} opacity-0` : "opacity-100"} `}
    >
      <div className="text text-h12">{text}</div>
      <div className="icon cursor-pointer" onClick={handleDelete}>
        <Delete height={14} width={14} className="hover:scale-105" />
      </div>
    </div>
  );
};

export default CardWithDeleteIcon;
