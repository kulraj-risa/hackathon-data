import React from "react";

interface CodeBranchIconProps {
  width?: string;
  height?: string;
  color?: string;
  className?: string;
}

export const CodeBranchIcon: React.FC<CodeBranchIconProps> = ({
  width = "16",
  height = "16",
  color = "#4a90e2",
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
      <g id="CodeBranchIcon">
        {/* Left circle (main branch) */}
        <circle
          cx="6"
          cy="6"
          r="3"
          stroke={color}
          strokeWidth="2"
          fill="none"
        />
        {/* Right top circle (branch) */}
        <circle
          cx="18"
          cy="6"
          r="3"
          stroke={color}
          strokeWidth="2"
          fill="none"
        />
        {/* Bottom circle (merge point) */}
        <circle
          cx="6"
          cy="18"
          r="3"
          stroke={color}
          strokeWidth="2"
          fill="none"
        />
        {/* Vertical line (main branch) */}
        <path
          d="M6 9V15"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Branch connection */}
        <path
          d="M9 9C9 11.5 11.5 14 14 14H15"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Branch to merge line */}
        <path
          d="M15 14V15"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
};
