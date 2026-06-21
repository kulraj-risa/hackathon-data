interface TickWithGreenBgProps {
  width?: string;
  height?: string;
}
const TickWithGreenBg = (props: TickWithGreenBgProps) => {
  return (
    <svg
      width={props.width || "24"}
      height={props.height || "24"}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="0.428571"
        y="0.428571"
        width="23.1429"
        height="23.1429"
        rx="11.5714"
        fill="#008367"
      />
      <rect
        x="0.428571"
        y="0.428571"
        width="23.1429"
        height="23.1429"
        rx="11.5714"
        stroke="#008367"
        stroke-width="0.857143"
      />
      <g clip-path="url(#clip0_3821_5564)">
        <path
          d="M9.96118 14.8355L7.13154 12.0059L6.16797 12.9627L9.96118 16.7559L18.104 8.61304L17.1473 7.65625L9.96118 14.8355Z"
          fill="white"
        />
      </g>
      <defs>
        <clipPath id="clip0_3821_5564">
          <rect
            width="16.2857"
            height="16.2857"
            fill="white"
            transform="translate(3.85547 3.85938)"
          />
        </clipPath>
      </defs>
    </svg>
  );
};

export default TickWithGreenBg;
