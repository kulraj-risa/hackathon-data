import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SpinningLoader } from "risa-oasis-ui_v2";

interface FdaSection {
  key: string;
  label: string;
  icon: React.ReactNode;
  accentColor: string;
  bgColor: string;
}

const FDA_SECTIONS: FdaSection[] = [
  {
    key: "boxed_warning",
    label: "Boxed Warning",
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    accentColor: "#DC2626",
    bgColor: "#FEF2F2",
  },
  {
    key: "indications_and_usage",
    label: "Indications & Usage",
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
    accentColor: "#2563EB",
    bgColor: "#EFF6FF",
  },
  {
    key: "dosage_and_administration",
    label: "Dosage & Administration",
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
    accentColor: "#059669",
    bgColor: "#ECFDF5",
  },
  {
    key: "contraindications",
    label: "Contraindications",
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
      </svg>
    ),
    accentColor: "#DC2626",
    bgColor: "#FEF2F2",
  },
  {
    key: "warnings_and_cautions",
    label: "Warnings & Precautions",
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    accentColor: "#D97706",
    bgColor: "#FFFBEB",
  },
  {
    key: "adverse_reactions",
    label: "Adverse Reactions",
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    ),
    accentColor: "#E11D48",
    bgColor: "#FFF1F2",
  },
  {
    key: "drug_interactions",
    label: "Drug Interactions",
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M14.31 8l5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16L3.95 6.06M14.31 16H2.83M16.62 12l-5.74 9.94" />
      </svg>
    ),
    accentColor: "#7C3AED",
    bgColor: "#F5F3FF",
  },
  {
    key: "use_in_specific_populations",
    label: "Use in Specific Populations",
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    accentColor: "#0891B2",
    bgColor: "#ECFEFF",
  },
];

function cleanHtml(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function formatSectionContent(text: string): React.ReactNode {
  if (!text) return null;
  const cleaned = cleanHtml(text);

  const paragraphs = cleaned
    .split(/(?:\.\s{2,}|\n\n|\r\n\r\n)/)
    .filter(Boolean);

  if (paragraphs.length <= 1) {
    const bulletParts = cleaned.split(/\s*•\s*/);
    if (bulletParts.length > 1) {
      return (
        <div className="flex flex-col gap-1.5">
          {bulletParts[0].trim() && (
            <p className="text-x-tiny leading-relaxed text-primaryGray-4">
              {bulletParts[0].trim()}
            </p>
          )}
          <ul className="flex flex-col gap-1">
            {bulletParts.slice(1).map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-1.5 text-x-tiny leading-relaxed text-primaryGray-4"
              >
                <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-primaryGray-9" />
                <span>{item.trim()}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    }
    return (
      <p className="text-x-tiny leading-relaxed text-primaryGray-4">
        {cleaned.length > 600 ? cleaned.slice(0, 600) + "…" : cleaned}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {paragraphs.slice(0, 4).map((p, i) => (
        <p key={i} className="text-x-tiny leading-relaxed text-primaryGray-4">
          {p.trim().length > 400 ? p.trim().slice(0, 400) + "…" : p.trim()}
        </p>
      ))}
      {paragraphs.length > 4 && (
        <p className="text-x-tiny italic text-primaryGray-9">
          +{paragraphs.length - 4} more sections…
        </p>
      )}
    </div>
  );
}

interface DrugInfoPanelProps {
  drugName: string;
  isOpen: boolean;
  onClose: () => void;
}

const DrugInfoPanel = ({ drugName, isOpen, onClose }: DrugInfoPanelProps) => {
  const [fdaData, setFdaData] = useState<Record<string, string[]> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(),
  );
  const [activeNav, setActiveNav] = useState<string | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const fetchFdaData = useCallback(async (name: string) => {
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    setFdaData(null);
    try {
      const res = await fetch(
        `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encodeURIComponent(name)}"`,
      );
      if (!res.ok) throw new Error(`No FDA data found for "${name}"`);
      const json = await res.json();
      const label = json.results?.[0];
      if (!label) throw new Error(`No label data for "${name}"`);
      setFdaData(label);
      const firstAvailable = FDA_SECTIONS.find((s) => label[s.key]?.length > 0);
      if (firstAvailable) {
        setExpandedSections(new Set([firstAvailable.key]));
        setActiveNav(firstAvailable.key);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch FDA data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && drugName) {
      fetchFdaData(drugName);
    }
  }, [isOpen, drugName, fetchFdaData]);

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
    setActiveNav(key);
    requestAnimationFrame(() => {
      sectionRefs.current[key]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    });
  };

  const availableSections = useMemo(() => {
    if (!fdaData) return [];
    return FDA_SECTIONS.filter((s) => fdaData[s.key]?.length > 0);
  }, [fdaData]);

  if (!isOpen) return null;

  return (
    <div className="flex h-full w-[380px] min-w-[380px] flex-col border-l border-primaryGray-14 bg-white">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-primaryGray-14 px-4 py-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EFF6FF]">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#2563EB"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="text-small font-bold text-primaryGray-1">
            FDA Drug Label
          </span>
          <span className="text-x-tiny text-primaryGray-9">
            Clinical Reference
          </span>
        </div>
        <div className="ml-auto flex items-center gap-1">
          {drugName && (
            <span className="rounded-full bg-[#EBF2FF] px-2.5 py-0.5 text-x-tiny font-semibold text-[#2563EB]">
              {drugName}
            </span>
          )}
          <button
            onClick={onClose}
            className="ml-1 flex h-6 w-6 items-center justify-center rounded-md text-primaryGray-9 transition-colors hover:bg-primaryGray-16 hover:text-primaryGray-1"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Quick Nav */}
      {availableSections.length > 0 && (
        <div className="flex flex-wrap gap-1 border-b border-primaryGray-14 px-4 py-2">
          {availableSections.map((section) => (
            <button
              key={section.key}
              onClick={() => toggleSection(section.key)}
              className="rounded-md px-2 py-0.5 text-[10px] font-medium transition-all"
              style={{
                backgroundColor:
                  activeNav === section.key ? section.bgColor : "transparent",
                color:
                  activeNav === section.key ? section.accentColor : "#6B7280",
                border: `1px solid ${activeNav === section.key ? section.accentColor + "30" : "transparent"}`,
              }}
            >
              {section.label.split(" ")[0]}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex h-40 flex-col items-center justify-center gap-3">
            <SpinningLoader />
            <span className="text-x-tiny font-medium text-primaryGray-9">
              Fetching FDA label for {drugName}…
            </span>
          </div>
        )}

        {error && (
          <div className="m-4 flex flex-col items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-center">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#DC2626"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span className="text-x-tiny font-medium text-red-700">
              {error}
            </span>
            <button
              onClick={() => fetchFdaData(drugName)}
              className="mt-1 rounded-md bg-red-600 px-3 py-1 text-x-tiny font-medium text-white transition-colors hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {fdaData && !loading && (
          <div className="flex flex-col gap-0.5 p-2">
            {availableSections.length === 0 && (
              <div className="p-4 text-center text-x-tiny text-primaryGray-9">
                No clinical sections available for this drug.
              </div>
            )}
            {availableSections.map((section) => {
              const isExpanded = expandedSections.has(section.key);
              const content = fdaData[section.key];
              const text = Array.isArray(content)
                ? content.join(" ")
                : String(content ?? "");

              return (
                <div
                  key={section.key}
                  ref={(el) => {
                    sectionRefs.current[section.key] = el;
                  }}
                  className="rounded-lg border transition-all"
                  style={{
                    borderColor: isExpanded
                      ? section.accentColor + "30"
                      : "#E5E7EB",
                    backgroundColor: isExpanded
                      ? section.bgColor + "40"
                      : "white",
                  }}
                >
                  <button
                    onClick={() => toggleSection(section.key)}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-primaryGray-16/50"
                  >
                    <div
                      className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md"
                      style={{
                        backgroundColor: section.bgColor,
                        color: section.accentColor,
                      }}
                    >
                      {section.icon}
                    </div>
                    <span className="flex-1 text-x-tiny font-semibold text-primaryGray-1">
                      {section.label}
                    </span>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#9CA3AF"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="flex-shrink-0 transition-transform"
                      style={{
                        transform: isExpanded
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                      }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {isExpanded && (
                    <div
                      className="border-t px-3 pb-3 pt-2"
                      style={{ borderColor: section.accentColor + "20" }}
                    >
                      {formatSectionContent(text)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-primaryGray-14 px-4 py-2">
        <div className="flex items-center gap-1.5 text-[10px] text-primaryGray-9">
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          Source: openFDA Drug Label API &bull; For clinical reference only
        </div>
      </div>
    </div>
  );
};

export default DrugInfoPanel;
