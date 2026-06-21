import React from "react";

interface BackArrowProps {
  width?: string;
  height?: string;
  color?: string;
  className?: string;
}

export const BackArrow: React.FC<BackArrowProps> = ({
  width = "16",
  height = "16",
  color = "#1F1F1F",
  className = "",
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 16 16"
      fill="none"
      className={className}
    >
      <path
        d="M10.45 1.8L4.60001 7.65C4.54446 7.70555 4.50557 7.76111 4.48335 7.81667C4.46112 7.87222 4.45001 7.93333 4.45001 8C4.45001 8.06667 4.46112 8.12778 4.48335 8.18333C4.50557 8.23889 4.54446 8.29444 4.60001 8.35L10.45 14.2C10.5722 14.3222 10.7278 14.3833 10.9167 14.3833C11.1056 14.3833 11.2611 14.3222 11.3833 14.2C11.5167 14.0667 11.5833 13.9083 11.5833 13.725C11.5833 13.5417 11.5167 13.3833 11.3833 13.25L6.13335 8L11.3833 2.75C11.5278 2.60555 11.5945 2.44444 11.5833 2.26666C11.5722 2.08889 11.5056 1.93889 11.3833 1.81666C11.25 1.68333 11.0917 1.61666 10.9083 1.61666C10.725 1.61666 10.5722 1.67778 10.45 1.8Z"
        fill={color}
      />
    </svg>
  );
};
