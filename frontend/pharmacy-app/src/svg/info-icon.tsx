interface InfoIconProps {
  height?: string;
  width?: string;
  stroke?: string;
  className?: string;
  strokeWidth?: string;
}

export const InfoIcon = (props?: InfoIconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props?.width || "16"}
      height={props?.height || "16"}
      viewBox="0 0 16 16"
      fill="none"
      className={props?.className}
    >
      <g clip-path="url(#clip0_2777_8315)">
        <path
          d="M7.9987 10.6654V7.9987M7.9987 5.33203H8.00536M14.6654 7.9987C14.6654 11.6806 11.6806 14.6654 7.9987 14.6654C4.3168 14.6654 1.33203 11.6806 1.33203 7.9987C1.33203 4.3168 4.3168 1.33203 7.9987 1.33203C11.6806 1.33203 14.6654 4.3168 14.6654 7.9987Z"
          stroke={props?.stroke || "#000000"}
          strokeWidth={props?.strokeWidth || "1.2"}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_2777_8315">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};
