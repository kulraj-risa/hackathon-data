interface ChevronDownProps extends React.SVGProps<SVGSVGElement> {
  fill?: string;
  stroke?: string;
  rotate?: number;
  height?: number;
  width?: number;
  strokeWidth?: number;
}

const ChevronDown: React.FC<ChevronDownProps> = ({
  fill = "none",
  stroke = "black",
  rotate = 0,
  height = 14,
  width = 14,
  strokeWidth = 1.33,
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 14 14"
      fill={fill}
      style={{
        transform: `rotate(${rotate}deg)`,
        transition: "transform 0.7s ease-in-out",
      }}
      {...props}
    >
      <path
        d="M3.5 5.25L7 8.75L10.5 5.25"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default ChevronDown;
