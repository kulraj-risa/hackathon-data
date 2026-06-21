import { useEffect, useState } from "react";
import { Button, TextInput } from "risa-oasis-ui_v2";
import CardWithDeleteIcon from "../../../../pages/configurations/pages/pharmaPaConfiguration/components/cardWithDeleteIcon";

interface CardComponentProps {
  title?: string;
  data?: string | string[];
  onChange?: (data: string | string[]) => void;
}

const CardComponent = ({ title, data, onChange }: CardComponentProps) => {
  const [isAddNewRuleOpen, setIsAddNewRuleOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editValue, setEditValue] = useState(
    typeof data === "string" ? data : "",
  );
  const [rules, setRules] = useState<string[]>([]);
  const [isSwapMode, setIsSwapMode] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!isSwapMode) {
      e.preventDefault();
      return;
    }
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.currentTarget.classList.add("opacity-50");
  };

  useEffect(() => {
    if (data && Array.isArray(data)) {
      const filterData = data.filter((item) => item !== "");
      setRules(filterData ?? []);
    }
  }, [data]);

  useEffect(() => {
    if (typeof data === "string" && onChange) {
      onChange(editValue);
    } else if (Array.isArray(data) && onChange) {
      onChange(rules);
    }
  }, [editValue, rules]);

  const handleDragOver = (e: React.DragEvent) => {
    if (!isSwapMode) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("opacity-50");
    setDraggedIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    if (!isSwapMode || draggedIndex === null) {
      e.preventDefault();
      return;
    }
    e.preventDefault();

    if (draggedIndex === targetIndex) return;

    const newRules = [...rules];
    // Swap the elements at draggedIndex and targetIndex
    [newRules[draggedIndex], newRules[targetIndex]] = [
      newRules[targetIndex],
      newRules[draggedIndex],
    ];
    setRules(newRules);
  };

  const handleSwapModeToggle = () => {
    setIsSwapMode(!isSwapMode);
  };

  const handleAddNewRuleClick = () => {
    setIsAddNewRuleOpen((prev) => !prev);
    setIsEditOpen(false);
  };
  const handleEditClick = () => {
    setIsEditOpen((prev) => !prev);
    setIsAddNewRuleOpen(false);
  };

  const handleAddRule = () => {
    const trimmedValue = inputValue.trim();
    if (!trimmedValue) return;

    // Check for duplicates (case-insensitive)
    const isDuplicate = rules.some(
      (rule) => rule.toLowerCase() === trimmedValue.toLowerCase(),
    );

    if (isDuplicate) return;

    setRules([...rules, trimmedValue]);
    setInputValue("");
  };

  const handleDeleteRule = (index: number) => {
    const newRules = [...rules];
    newRules.splice(index, 1);
    setRules(newRules);
  };

  // Array value: show Add New Rule and list, do NOT render <pre>
  if (Array.isArray(data)) {
    return (
      <div className="mb-2 overflow-y-auto rounded-md border border-primaryGray-14 p-3">
        <div className="flex items-center justify-between">
          <div className="flex w-1/2 items-center gap-2">
            <span className="text-sm font-semibold">
              {title === "Icl Examples" ? "ICL Examples" : title}
            </span>
          </div>
          <div className="flex w-1/2 items-center justify-end gap-4">
            {title !== "Icl Examples" &&
              title !== "Glossary Items" &&
              rules.length > 0 && (
                <div
                  className={`cursor-pointer text-xs font-semibold ${
                    isSwapMode
                      ? "text-tertiaryBlue-5"
                      : "text-tertiaryRed-5 hover:text-tertiaryRed-3"
                  }`}
                  onClick={handleSwapModeToggle}
                >
                  {isSwapMode ? "Exit Swap Mode" : "Swap Rules"}
                </div>
              )}
          </div>
        </div>
        {/* Show array items */}

        <div className="mt-3 flex w-full flex-col gap-2 bg-primaryGray-16">
          <div className="flex w-full flex-col gap-2 rounded p-2">
            {!isSwapMode && (
              <div className="flex w-full flex-row items-start justify-between">
                <div className="w-4/5">
                  <div
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && inputValue.trim()) {
                        handleAddRule();
                      }
                    }}
                  >
                    <TextInput
                      label="Rule Name"
                      id="ruleName"
                      placeholder="Enter Rule"
                      hideLabel={true}
                      defaultValue={inputValue}
                      error={
                        inputValue.trim() &&
                        rules.some(
                          (rule) =>
                            rule.toLowerCase() ===
                            inputValue.trim().toLowerCase(),
                        )
                          ? "This rule already exists!"
                          : undefined
                      }
                      onChange={(e) => setInputValue(e.value)}
                    />
                  </div>
                </div>
                <div className="flex items-start">
                  <Button
                    disabled={!inputValue.trim()}
                    buttonType="primary"
                    size="medium"
                    onClick={handleAddRule}
                  >
                    Add
                  </Button>
                </div>
              </div>
            )}
          </div>

          {rules.map(
            (rule, index) =>
              rule && (
                <div
                  key={`${rule}-${index}`}
                  draggable={isSwapMode}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`cursor-${isSwapMode ? "move" : "default"} px-2 py-1 transition-all duration-200`}
                >
                  <CardWithDeleteIcon
                    text={rule}
                    onDelete={() => handleDeleteRule(index)}
                    exitDirection="left"
                  />
                </div>
              ),
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-2 overflow-y-auto rounded-md border border-primaryGray-14 p-3">
      <div className="flex items-center justify-between">
        <div className="flex w-1/2 items-center gap-2">
          <span className="text-sm font-semibold">{title}</span>
        </div>
        <div className="flex w-1/2 items-center justify-end gap-4">
          <div
            className="cursor-pointer text-xs font-semibold text-tertiaryBlue-5 hover:text-tertiaryBlue-3"
            onClick={handleEditClick}
          >
            Edit Rules
          </div>
        </div>
      </div>

      <div className="mt-2 flex flex-col gap-2">
        <textarea
          className="w-full rounded border p-2 text-xs"
          rows={4}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          readOnly={!isEditOpen}
        />
      </div>
    </div>
  );
};

export default CardComponent;
