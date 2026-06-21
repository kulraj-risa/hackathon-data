const AgentStudioIcon = () => {
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
      {/* Orchestrator node + branching agent nodes */}
      <circle cx="12" cy="4" r="2.2" />
      <circle cx="5" cy="19" r="2.2" />
      <circle cx="12" cy="19" r="2.2" />
      <circle cx="19" cy="19" r="2.2" />
      <path d="M12 6.2v4.3M12 10.5L5 16.8M12 10.5v6.3M12 10.5l7 6.3" />
    </svg>
  );
};

export default AgentStudioIcon;
