import React from "react";
import { SelectedThinking } from "../../types";

interface ThinkingViewProps {
  selectedThinking: SelectedThinking;
  onBackToTable: () => void;
}

export const ThinkingView: React.FC<ThinkingViewProps> = ({
  selectedThinking,
  onBackToTable,
}) => {
  return (
    <div className="llm-thinking-view">
      <button onClick={onBackToTable} className="diagnosis-modal__back-button">
        ← Back to Table
      </button>
      <div className="llm-thinking-modal__content">
        <div className="llm-thinking-modal__text-container">
          <pre className="llm-thinking-modal__text">
            {selectedThinking.thinking || "No thinking data available."}
          </pre>
        </div>
      </div>
    </div>
  );
};
