interface ArrowRightProps {
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

const ArrowRight = ({ width, height, color, className }: ArrowRightProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width ?? 16}
      height={height ?? 16}
      fill="none"
      className={className}
    >
      <path
        d="M3.33203 7.99967H12.6654M12.6654 7.99967L7.9987 3.33301M12.6654 7.99967L7.9987 12.6663"
        stroke={color ?? "#000"}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default ArrowRight;
