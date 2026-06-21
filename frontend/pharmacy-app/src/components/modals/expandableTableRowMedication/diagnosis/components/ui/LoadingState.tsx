import React from "react";
import { SpinningLoader } from "risa-oasis-ui_v2";

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading...",
}) => {
  return (
    <div className="flex h-full w-full flex-row items-center justify-center gap-2">
      <SpinningLoader />
      <div className="text-sm text-primaryGray-6">{message}</div>
    </div>
  );
};
