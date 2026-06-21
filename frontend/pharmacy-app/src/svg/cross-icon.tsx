interface CrossIconProps {
  onClick?: () => void;
  fillColor?: string;
  height?: string;
  width?: string;
}

export const CrossIcon = (props: CrossIconProps) => {
  return (
    <svg
      width={props?.width || "24"}
      height={props?.height || "24"}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M17 7L7 17M7 7L17 17"
        stroke={props?.fillColor ?? "black"}
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
};
