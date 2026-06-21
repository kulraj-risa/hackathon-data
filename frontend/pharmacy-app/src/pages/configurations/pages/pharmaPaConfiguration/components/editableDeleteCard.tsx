import { useEffect, useMemo, useRef, useState } from "react";
import { Delete } from "../../../../../svg/delete";
import EditIcon from "../../../../../svg/editIcon";

interface EditableDeleteCardProps {
  text: string;
  onDelete: () => void;
  onTextChange?: (newText: string) => void;
  exitDirection?: "left" | "right";
}

const EditableDeleteCard = ({
  text,
  onDelete,
  onTextChange,
  exitDirection = "left",
}: EditableDeleteCardProps) => {
  const [isExiting, setIsExiting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [textChanged, setTextChanged] = useState(text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTextChanged(text);
  }, [text]);

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [textChanged]);

  useEffect(() => {
    if (isExiting) {
      const timer = setTimeout(() => {
        onDelete();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isExiting, onDelete]);

  const handleDelete = () => {
    setIsExiting(true);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setTextChanged(newText);
    onTextChange?.(newText);
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  const exitDirectionClass = useMemo(() => {
    return exitDirection === "left" ? "-translate-x-4" : "translate-x-4";
  }, [exitDirection]);

  return (
    <div
      className={`editable-delete-card flex cursor-pointer items-center justify-between gap-2 rounded border border-primaryGray-16 bg-white p-2 shadow-sm transition-all duration-300 ease-in-out ${isExiting ? `${exitDirectionClass} opacity-0` : "opacity-100"} `}
    >
      <textarea
        ref={textareaRef}
        value={textChanged}
        onChange={handleTextChange}
        onBlur={handleBlur}
        className={`text w-[90%] resize-none overflow-hidden p-1 text-h12 outline-none ${isEditing ? "bg-primaryGray-16" : "bg-white"}`}
        rows={1}
        readOnly={!isEditing}
        style={{
          height: "auto",
          minHeight: "1.5rem",
        }}
      />
      <div className="icon mr-1 cursor-pointer" onClick={handleEdit}>
        <EditIcon />
      </div>
      <div className="icon cursor-pointer" onClick={handleDelete}>
        <Delete height={14} width={14} className="hover:scale-105" />
      </div>
    </div>
  );
};

export default EditableDeleteCard;
