import React, { useState } from "react";
import ReactDOM from "react-dom";

interface RecordClosedByCellProps {
  value: {
    closedBy: string;
    assigneeId: string;
    humanCheckDescription?: string;
    humanAgent?: string;
  };
}

const ICON_SIZE = 28;

const AgentIcon = () => (
  <div
    className="flex shrink-0 items-center justify-center rounded-full"
    style={{
      width: ICON_SIZE,
      height: ICON_SIZE,
      background: "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)",
      boxShadow: "0 1px 3px rgba(124,58,237,0.25)",
    }}
  >
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="4" r="1.5" fill="white" fillOpacity="0.9" />
      <line
        x1="12"
        y1="5.5"
        x2="12"
        y2="8"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.9"
      />
      <rect
        x="5"
        y="8"
        width="14"
        height="10"
        rx="3.5"
        fill="white"
        fillOpacity="0.92"
      />
      <circle cx="9.5" cy="13" r="1.5" fill="#7C3AED" />
      <circle cx="14.5" cy="13" r="1.5" fill="#7C3AED" />
      <rect
        x="9"
        y="16"
        width="6"
        height="1"
        rx="0.5"
        fill="#7C3AED"
        fillOpacity="0.5"
      />
    </svg>
  </div>
);

const AvatarInitial = ({ name }: { name: string }) => {
  const letter = (name ?? "").trim().charAt(0).toUpperCase() || "?";
  const palette = [
    { bg: "#7C3AED", text: "#FFFFFF" },
    { bg: "#2563EB", text: "#FFFFFF" },
    { bg: "#059669", text: "#FFFFFF" },
    { bg: "#D97706", text: "#FFFFFF" },
    { bg: "#DC2626", text: "#FFFFFF" },
    { bg: "#4F46E5", text: "#FFFFFF" },
    { bg: "#0891B2", text: "#FFFFFF" },
    { bg: "#BE185D", text: "#FFFFFF" },
  ];
  const idx = letter.charCodeAt(0) % palette.length;
  const { bg, text } = palette[idx];

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-semibold"
      style={{
        width: ICON_SIZE,
        height: ICON_SIZE,
        backgroundColor: bg,
        color: text,
        fontSize: 12,
        lineHeight: 1,
        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
      }}
      title={name}
    >
      {letter}
    </div>
  );
};

export const RecordClosedByCell: React.FC<RecordClosedByCellProps> = ({
  value,
}) => {
  const [showPopup, setShowPopup] = useState(false);

  const closedBy = (value?.closedBy ?? "").toLowerCase().replace(/\s+/g, "_");
  const assigneeId = value?.assigneeId ?? "";
  const description = value?.humanCheckDescription ?? "";
  const humanAgent = (value?.humanAgent ?? "").trim();
  const isAgentOnly = humanAgent.toLowerCase() === "agent";

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isAgentOnly) return;
    setShowPopup(true);
  };

  const renderIcon = () => {
    if (closedBy.includes("agent") && closedBy.includes("human")) {
      return (
        <div className="flex items-center">
          <div
            className="relative flex items-center"
            style={{ width: ICON_SIZE + 16, height: ICON_SIZE }}
          >
            <div className="absolute left-0" style={{ zIndex: 1 }}>
              <AgentIcon />
            </div>
            <div
              className="absolute rounded-full"
              style={{
                left: ICON_SIZE - 12,
                zIndex: 2,
                border: "2px solid white",
                borderRadius: "50%",
              }}
            >
              <AvatarInitial name={assigneeId} />
            </div>
          </div>
        </div>
      );
    }

    if (closedBy.includes("human")) {
      return (
        <div className="flex items-center">
          <AvatarInitial name={assigneeId} />
        </div>
      );
    }

    if (closedBy.includes("agent")) {
      return (
        <div className="flex items-center">
          <AgentIcon />
        </div>
      );
    }

    return (
      <div className="truncate text-x-tiny text-primaryGray-6">
        {value?.closedBy || "—"}
      </div>
    );
  };

  const modal = showPopup
    ? ReactDOM.createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          onClick={() => setShowPopup(false)}
          style={{ animation: "pocFadeIn .15s ease-out" }}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative z-10 w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "pocSlideUp .2s ease-out" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-primaryGray-14 px-6 py-4">
              <h3 className="text-body font-bold text-primaryGray-1">
                POC Details
              </h3>
              <button
                className="rounded-full p-1.5 text-primaryGray-9 hover:bg-primaryGray-16 hover:text-primaryGray-1"
                onClick={() => setShowPopup(false)}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-col gap-4 bg-primaryGray-16/50 px-6 py-6">
              {assigneeId && (
                <div>
                  <div className="mb-1 text-x-tiny font-medium text-primaryGray-6">
                    Assignee
                  </div>
                  <div className="text-small font-semibold text-primaryGray-1">
                    {assigneeId}
                  </div>
                </div>
              )}

              <div>
                <div className="mb-1 text-x-tiny font-medium text-primaryGray-6">
                  Description
                </div>
                <div className="max-h-48 overflow-y-auto rounded-md border border-primaryGray-14 bg-white px-3 py-2.5 text-small leading-relaxed text-primaryGray-1">
                  {description || "No description available"}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end border-t border-primaryGray-14 px-6 py-4">
              <button
                className="rounded-md border border-primaryGray-14 bg-white px-5 py-2 text-small font-semibold text-primaryGray-1 transition-colors duration-150 hover:bg-primaryGray-16"
                onClick={() => setShowPopup(false)}
              >
                Close
              </button>
            </div>
          </div>

          <style>{`
            @keyframes pocFadeIn { from { opacity: 0 } to { opacity: 1 } }
            @keyframes pocSlideUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
          `}</style>
        </div>,
        document.body,
      )
    : null;

  return (
    <div>
      <div
        className={`${isAgentOnly ? "cursor-default" : "cursor-pointer"} transition-opacity hover:opacity-80`}
        onClick={handleClick}
      >
        {renderIcon()}
      </div>
      {modal}
    </div>
  );
};

export default RecordClosedByCell;
