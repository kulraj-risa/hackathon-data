interface EditPencilIconProps {
  className?: string;
  height?: number;
  width?: number;
  stroke?: string;
  strokeWidth?: number;
  onClick?: () => void;
}
const EditPencilIcon = (props: EditPencilIconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.width ?? 20}
      height={props.height ?? 20}
      viewBox="0 0 20 20"
      fill="none"
      className={props.className}
      {...props}
    >
      <path
        d="M2.3954 15.0963C2.43368 14.7517 2.45283 14.5794 2.50496 14.4184C2.55121 14.2755 2.61656 14.1396 2.69923 14.0142C2.79241 13.8729 2.91499 13.7503 3.16014 13.5052L14.1654 2.49992C15.0859 1.57945 16.5782 1.57945 17.4987 2.49993C18.4192 3.4204 18.4192 4.91279 17.4987 5.83326L6.49347 16.8385C6.24832 17.0836 6.12574 17.2062 5.98444 17.2994C5.85907 17.3821 5.72311 17.4474 5.58024 17.4937C5.4192 17.5458 5.24691 17.5649 4.90234 17.6032L2.08203 17.9166L2.3954 15.0963Z"
        stroke={props.stroke ?? "#1F1F1F"}
        strokeWidth={props.strokeWidth ?? 1.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default EditPencilIcon;
