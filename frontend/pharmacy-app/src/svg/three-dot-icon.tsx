interface ThreeDotIconProps {
  className?: string;
}

export const ThreeDotIcon = (props: ThreeDotIconProps) => {
  return (
    <svg
      width="16"
      height="4"
      viewBox="0 0 16 4"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={props.className}
    >
      <g id="Icon">
        <path
          d="M8.0026 2.83854C8.46284 2.83854 8.83594 2.46545 8.83594 2.00521C8.83594 1.54497 8.46284 1.17188 8.0026 1.17188C7.54237 1.17188 7.16927 1.54497 7.16927 2.00521C7.16927 2.46545 7.54237 2.83854 8.0026 2.83854Z"
          stroke="black"
          stroke-width="1.66667"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M13.8359 2.83854C14.2962 2.83854 14.6693 2.46545 14.6693 2.00521C14.6693 1.54497 14.2962 1.17188 13.8359 1.17188C13.3757 1.17188 13.0026 1.54497 13.0026 2.00521C13.0026 2.46545 13.3757 2.83854 13.8359 2.83854Z"
          stroke="black"
          stroke-width="1.66667"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M2.16927 2.83854C2.62951 2.83854 3.0026 2.46545 3.0026 2.00521C3.0026 1.54497 2.62951 1.17188 2.16927 1.17188C1.70903 1.17188 1.33594 1.54497 1.33594 2.00521C1.33594 2.46545 1.70903 2.83854 2.16927 2.83854Z"
          stroke="black"
          stroke-width="1.66667"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </g>
    </svg>
  );
};
