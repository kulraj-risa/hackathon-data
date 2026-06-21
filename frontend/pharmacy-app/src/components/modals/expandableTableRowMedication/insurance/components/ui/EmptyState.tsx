import React from "react";

interface EmptyStateProps {
  message?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  message = "No data found",
}) => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-8">
      <div className="text-sm text-primaryGray-6">{message}</div>
    </div>
  );
};
