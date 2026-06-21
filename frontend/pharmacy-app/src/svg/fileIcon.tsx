interface FileIconProps {
  className?: string;
  strokeColor?: string;
  width?: number;
  height?: number;
  onClick?: () => void;
}
const FileIcon = (props: FileIconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.width ?? "12"}
      height={props.height ?? "16"}
      viewBox="0 0 12 16"
      fill="none"
      onClick={props.onClick}
    >
      <path
        d="M7.33073 1.4248V4.1785C7.33073 4.55187 7.33073 4.73855 7.40339 4.88116C7.46731 5.0066 7.56929 5.10859 7.69474 5.1725C7.83734 5.24516 8.02403 5.24516 8.3974 5.24516H11.1511M8.66406 8.57845H3.33073M8.66406 11.2451H3.33073M4.66406 5.91178H3.33073M7.33073 1.24512H3.86406C2.74396 1.24512 2.18391 1.24512 1.75608 1.4631C1.37976 1.65485 1.0738 1.96081 0.882049 2.33714C0.664062 2.76496 0.664062 3.32501 0.664062 4.44512V11.3785C0.664062 12.4986 0.664062 13.0586 0.882049 13.4864C1.0738 13.8628 1.37976 14.1687 1.75608 14.3605C2.18391 14.5785 2.74396 14.5785 3.86406 14.5785H8.13073C9.25083 14.5785 9.81089 14.5785 10.2387 14.3605C10.615 14.1687 10.921 13.8628 11.1127 13.4864C11.3307 13.0586 11.3307 12.4986 11.3307 11.3785V5.24512L7.33073 1.24512Z"
        stroke={props.strokeColor ?? "#2E2E2E"}
        stroke-width="1.11111"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
};

export default FileIcon;
