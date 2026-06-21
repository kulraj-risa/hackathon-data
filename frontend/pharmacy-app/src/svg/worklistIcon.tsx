const WorklistIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#D1D5DB"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Bullet list: circles + lines */}
      <circle cx="5" cy="6" r="1.5" fill="#D1D5DB" stroke="none" />
      <line x1="10" y1="6" x2="20" y2="6" />
      <circle cx="5" cy="12" r="1.5" fill="#D1D5DB" stroke="none" />
      <line x1="10" y1="12" x2="20" y2="12" />
      <circle cx="5" cy="18" r="1.5" fill="#D1D5DB" stroke="none" />
      <line x1="10" y1="18" x2="20" y2="18" />
    </svg>
  );
};

export default WorklistIcon;
