export const SortArrow = (props) => {
  return (
    <svg
      onClick={props.onClick}
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M6 9.57143L9.57143 6L13.1429 9.57143H6Z" fill="#1F1F1F" />
      <path d="M6 11.5714L9.57143 15.1429L13.1429 11.5714H6Z" fill="#1F1F1F" />
    </svg>
  );
};
