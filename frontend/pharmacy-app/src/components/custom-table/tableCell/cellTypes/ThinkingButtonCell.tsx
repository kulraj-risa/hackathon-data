import React from "react";

interface ThinkingButtonCellProps {
  value: {
    hasThinking: boolean;
    onViewThinking?: (thinking: any, diagnosisId: any) => void;
    thinking: any;
    diagnosisId: any;
  };
  [key: string]: any;
}

export const ThinkingButtonCell: React.FC<ThinkingButtonCellProps> = ({
  value,
}) => {
  return (
    <>
      {value.hasThinking ? (
        <div
          className="thinking-button text-h12 font-semibold text-tertiaryBlue-5 hover:cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            if (value.onViewThinking) {
              value.onViewThinking(value.thinking, value.diagnosisId);
            }
          }}
        >
          View Thinking
        </div>
      ) : (
        <span className="text-gray-400">No thinking</span>
      )}
    </>
  );
};

export default ThinkingButtonCell;
