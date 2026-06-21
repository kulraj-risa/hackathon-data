import React from "react";

interface EmptyStateProps {
  message?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  message = "No document preview available",
}) => {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="text-sm text-primaryGray-6">{message}</div>
    </div>
  );
};
