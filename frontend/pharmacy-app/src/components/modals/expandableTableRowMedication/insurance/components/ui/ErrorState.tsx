import React from "react";

interface ErrorStateProps {
  message?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = "Failed to load document",
}) => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-8">
      <div className="text-sm text-red-500">{message}</div>
    </div>
  );
};
