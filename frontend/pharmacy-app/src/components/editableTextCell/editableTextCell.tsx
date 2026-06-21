import React, { useEffect, useRef, useState } from "react";

interface EditableTextCellProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rowIndex?: number;
  fieldKey?: string;
  onTableRowUpdate?: (
    rowIndex: number,
    fieldKey: string,
    newValue: any,
  ) => void;
  hasError?: boolean;
}

const EditableTextCell: React.FC<EditableTextCellProps> = ({
  value,
  onValueChange,
  placeholder = "Enter text...",
  className = "",
  rowIndex,
  fieldKey,
  onTableRowUpdate,
  hasError = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    setIsEditing(true);
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setEditValue(newValue);

    if (newValue !== value) {
      try {
        setIsUpdating(true);
        onValueChange(newValue);

        if (onTableRowUpdate && fieldKey && typeof rowIndex === "number") {
          onTableRowUpdate(rowIndex, fieldKey, newValue);
        }
      } catch (error) {
        console.error(`EditableTextCell: Error updating data:`, error);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  return (
    <div
      className={`flex w-full cursor-pointer items-center rounded-md border p-1 transition-colors hover:bg-gray-50 ${className} ${isUpdating ? "opacity-50" : ""} ${hasError ? "border-red-500" : "border-primaryGray-15"}`}
      onClick={handleClick}
    >
      {isEditing ? (
        <div className="flex w-full items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            className="w-full bg-transparent text-xs text-primaryGray-1 outline-none"
            disabled={isUpdating}
          />
          {isUpdating && (
            <div className="text-xs text-blue-500">Updating...</div>
          )}
        </div>
      ) : (
        <span className="w-full truncate text-xs text-primaryGray-1">
          {value?.toString() || placeholder}
        </span>
      )}
    </div>
  );
};

export default EditableTextCell;
