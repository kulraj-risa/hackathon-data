import React from "react";

interface NextArrowProps {
  width?: string;
  height?: string;
  color?: string;
  className?: string;
}

export const NextArrow: React.FC<NextArrowProps> = ({
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
        d="M5.55 14.2L11.4 8.35C11.4556 8.29445 11.4944 8.23889 11.5167 8.18333C11.5389 8.12778 11.55 8.06667 11.55 8C11.55 7.93333 11.5389 7.87222 11.5167 7.81667C11.4944 7.76111 11.4556 7.70556 11.4 7.65L5.55 1.8C5.42778 1.67778 5.27222 1.61667 5.08333 1.61667C4.89444 1.61667 4.73889 1.67778 4.61667 1.8C4.48333 1.93334 4.41667 2.09167 4.41667 2.275C4.41667 2.45834 4.48333 2.61667 4.61667 2.75L9.86667 8L4.61667 13.25C4.47222 13.3944 4.40555 13.5556 4.41667 13.7333C4.42778 13.9111 4.49444 14.0611 4.61667 14.1833C4.75 14.3167 4.90833 14.3833 5.09167 14.3833C5.275 14.3833 5.42778 14.3222 5.55 14.2Z"
        fill={color}
      />
    </svg>
  );
};
