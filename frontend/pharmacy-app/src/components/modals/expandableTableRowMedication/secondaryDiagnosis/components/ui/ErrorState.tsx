import React from "react";

interface ErrorStateProps {
  message?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = "Failed to load data. Please try again.",
}) => {
  return (
    <div className="diagnosis-codes-modal--container flex items-center justify-center p-8">
      <div className="text-sm text-red-500">{message}</div>
    </div>
  );
};
