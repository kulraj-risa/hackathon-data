import React from "react";

interface AddIconProps {
  width?: string;
  height?: string;
  color?: string;
  className?: string;
}

export const AddIcon: React.FC<AddIconProps> = ({
  width = "20",
  height = "20",
  color = "#0056d6",
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
    >
      <g id="AddIcon">
        {/* Horizontal line */}
        <path
          d="M12 5V19"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Vertical line */}
        <path
          d="M5 12H19"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
};
