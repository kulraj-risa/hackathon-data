import { useState } from "react";

interface StepCardProps {
  type: string;
  priority: number;
  config: any;
}

const StepCard = ({ type, priority, config }: StepCardProps) => {
  const [showConfig, setShowConfig] = useState(false);

  return (
    <div className="overflow-y-auto rounded-md border border-primaryGray-14 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">
            Step {priority} - {type}
          </span>
        </div>
        <div
          className="cursor-pointer text-xs text-primaryGray-6 hover:text-primaryGray-4"
          onClick={() => setShowConfig(!showConfig)}
        >
          More details
        </div>
      </div>
      {showConfig && (
        <div className="mt-2 overflow-y-auto rounded bg-gray-50 p-2">
          <pre className="overflow-auto text-xs">
            {JSON.stringify(config, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default StepCard;
