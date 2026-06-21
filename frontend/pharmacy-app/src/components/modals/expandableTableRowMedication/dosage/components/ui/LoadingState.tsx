import React from "react";
import { SpinningLoader } from "risa-oasis-ui_v2";

export const LoadingState: React.FC = () => {
  return (
    <div className="flex w-full flex-row justify-center gap-2">
      <SpinningLoader />
      <div className="text-sm text-primaryGray-6">
        Loading prescription data...
      </div>
    </div>
  );
};
