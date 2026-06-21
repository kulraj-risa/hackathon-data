import React from "react";

interface RedWarningIconProps {
  width?: number;
  height?: number;
  className?: string;
}

const RedWarningIcon: React.FC<RedWarningIconProps> = ({
  width = 12,
  height = 12,
  className = "",
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      shapeRendering="geometricPrecision"
    >
      {/* Triangle */}
      <path
        d="M12 2L2 20H22L12 2Z"
        stroke="#DC2626"
        strokeWidth="2"
        fill="transparent"
        strokeLinejoin="round"
      />

      {/* Exclamation mark */}
      <path
        d="M12 8V14M12 16V16.5"
        stroke="#DC2626"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default RedWarningIcon;
