import { ReactNode } from "react";
import DashedLines from "../../svg/dashedLines";

interface LabelValueRowProps {
  label: string;
  children: ReactNode;
  showDivider?: boolean;
}

const LabelValueRow = ({
  label,
  children,
  showDivider = true,
}: LabelValueRowProps) => {
  return (
    <>
      <div className="flex flex-row items-center gap-2 py-1">
        <div className="w-1/4 text-sm font-bold text-primaryGray-2">
          {label}
        </div>
        <div className="w-3/4 text-sm font-bold">{children}</div>
      </div>
      {showDivider && (
        <div className="flex flex-row">
          <DashedLines />
          <DashedLines />
        </div>
      )}
    </>
  );
};

export default LabelValueRow;
