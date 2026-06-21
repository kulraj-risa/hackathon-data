import { useEffect, useMemo, useRef, useState } from "react";
import {
  controlToastState,
  Modal,
  openModal,
  SpinningLoader,
} from "risa-oasis-ui_v2";
import { fetchPaCasesFromBigQuery } from "../../../api/bigQuery/paCasesBigQuery";
import { fetchDrugLabel } from "../../../api/getCalls/drugLabel";

interface DrugLabelModalProps {
  onClose: () => void;
  drugList?: string[];
}

/**
 * Parse raw FDA drug label text into structured sections.
 *
 * FDA text typically has:
 *   "1 INDICATIONS AND USAGE ... ( 1.1 ) ... ( 1.2 ) ...
 *    1.1 Section Title body text...
 *    1.2 Section Title body text..."
 *
 * Parenthetical refs like "( 1.1 )" are cross-references, NOT headings.
 * Real headings are "1.1 Title Text" (not inside parentheses).
 */
function parseDrugContent(raw: string): {
  overview: string;
  sections: { title: string; body: string }[];
} {
  if (!raw || typeof raw !== "string") {
    return { overview: raw ?? "", sections: [] };
  }

  // Step 1: Strip parenthetical cross-references like "( 1.1 )" or "(1.2)"
  let cleaned = raw.replace(/\(\s*\d+(?:\.\d+)?\s*\)/g, "");
  // Also remove leading "1 INDICATIONS AND USAGE" header
  cleaned = cleaned.replace(/^\d+\s+INDICATIONS?\s+AND\s+USAGE\s*/i, "");
  // Collapse multiple spaces
  cleaned = cleaned.replace(/\s{2,}/g, " ").trim();

  // Step 2: Find real section headings — "1.1 ", "1.2 ", "1.3 " NOT inside parens
  // Real headings are followed by capitalized words (the title)
  const sectionRegex = /(?:^|\.\s+)(\d+\.\d+)\s+([A-Z])/g;
  const matches: { index: number; number: string; fullMatchLen: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = sectionRegex.exec(cleaned)) !== null) {
    // The section number starts after the ". " prefix if present
    const prefixLen = m[0].indexOf(m[1]);
    matches.push({
      index: m.index + prefixLen,
      number: m[1],
      fullMatchLen: m[0].length,
    });
  }

  // Step 3: Extract overview (text before first real section heading)
  let overview = "";
  if (matches.length > 0) {
    overview = cleaned.substring(0, matches[0].index).trim();
    // Remove trailing period if the split left one
    overview = overview.replace(/\.\s*$/, "").trim();
  } else {
    overview = cleaned;
  }

  // Step 4: Extract each section
  const sections: { title: string; body: string }[] = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index + matches[i].number.length + 1; // skip "1.1 "
    const end = i + 1 < matches.length ? matches[i + 1].index : cleaned.length;
    let content = cleaned.substring(start, end).trim();
    // Remove trailing period left from the regex split
    content = content.replace(/\.\s*$/, "").trim();

    // The title is the capitalized phrase before the first sentence of body
    // Look for "Title Words Body starts here..."
    // Title is usually all-caps or title-case words before the drug name or a lowercase word
    const titleMatch = content.match(
      /^([A-Z][A-Za-z]+(?:\s+(?:of|in|to|for|the|and|or|with|Due|Not|a)\s+|\s+[A-Z])[A-Za-z\s]*?)\s+[A-Z][a-z]/,
    );

    let title: string;
    let body: string;

    if (titleMatch) {
      title = titleMatch[1].trim();
      body = content.substring(title.length).trim();
    } else {
      // Fallback: use text up to first lowercase-starting sentence
      const fallback = content.match(
        /^(.+?)\s(?=[A-Z][a-z].*(?:is|are|has|was|for|to)\s)/,
      );
      if (fallback) {
        title = fallback[1].trim();
        body = content.substring(title.length).trim();
      } else {
        title = content.length > 80 ? content.substring(0, 60).trim() : content;
        body = content.length > 80 ? content.substring(60).trim() : "";
      }
    }

    sections.push({ title, body });
  }

  return { overview, sections };
}

/** Format body text: split bullet points into a list */
function formatBody(text: string): React.ReactNode[] {
  // Split on bullet points
  const bulletParts = text.split(/\s*•\s*/);

  if (bulletParts.length > 1) {
    const nodes: React.ReactNode[] = [];
    // First part is introductory text
    if (bulletParts[0].trim()) {
      nodes.push(
        <p
          key="intro"
          className="mb-2 text-small leading-relaxed text-primaryGray-4"
        >
          {bulletParts[0].trim()}
        </p>,
      );
    }
    // Rest are bullet items
    nodes.push(
      <ul key="bullets" className="ml-1 flex flex-col gap-1.5">
        {bulletParts.slice(1).map((item, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-small leading-relaxed text-primaryGray-4"
          >
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primaryGray-9" />
            <span>{item.trim()}</span>
          </li>
        ))}
      </ul>,
    );
    return nodes;
  }

  return [
    <p key="text" className="text-small leading-relaxed text-primaryGray-4">
      {text}
    </p>,
  ];
}

const DrugLabelModal = ({ onClose, drugList }: DrugLabelModalProps) => {
  const [drugName, setDrugName] = useState("");
  const [drugData, setDrugData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [selfFetchedDrugs, setSelfFetchedDrugs] = useState<string[]>([]);

  useEffect(() => {
    openModal("drug-label-modal");
  }, []);

  // If no drugList prop provided, self-fetch from BigQuery
  useEffect(() => {
    if (!drugList) {
      fetchPaCasesFromBigQuery()
        .then((res) => {
          const drugs = new Set<string>();
          res.rows.forEach((row: any) => {
            const name = row?.drug?.drug_name_onco_emr || row?.drug?.drug_name;
            if (name) drugs.add(String(name));
          });
          setSelfFetchedDrugs(
            Array.from(drugs).sort((a, b) =>
              a.toLowerCase().localeCompare(b.toLowerCase()),
            ),
          );
        })
        .catch(() => {
          // silently fail – dropdown just won't have options
        });
    }
  }, [drugList]);

  const activeDrugList = drugList ?? selfFetchedDrugs;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredDrugs = useMemo(() => {
    if (!drugName.trim()) return [];
    return activeDrugList.filter((d) =>
      d.toLowerCase().includes(drugName.toLowerCase()),
    );
  }, [drugName, activeDrugList]);

  const handleFetchDrugLabel = async () => {
    if (!drugName.trim()) {
      controlToastState(`drug-name-error`);
      return;
    }

    try {
      setLoading(true);
      setDrugData(null);
      const result = await fetchDrugLabel(drugName);

      const parsedResult = JSON.parse(result);
      if (parsedResult.results && parsedResult.results.length > 0) {
        const indications = parsedResult.results[0].indications_and_usage;
        if (indications && indications.length > 0) {
          setDrugData(indications[0]);
        } else {
          setDrugData(
            "No indications and usage information found for this drug.",
          );
        }
      } else {
        setDrugData("No results found for this drug.");
      }
    } catch (error) {
      console.error("Error fetching drug label:", error);
      setDrugData("An error occurred while fetching the drug label.");
    } finally {
      setLoading(false);
    }
  };

  const parsed = useMemo(() => {
    if (!drugData) return null;
    return parseDrugContent(drugData);
  }, [drugData]);

  return (
    <Modal
      title="Drug Label"
      onClose={onClose}
      dialogId="drug-label-modal"
      onSave={onClose}
      saveButtonText="Cancel"
      showSingleButton={true}
      cancelText="Cancel"
      heightPercentage={80}
    >
      <div className="flex h-full flex-col gap-4">
        <div
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setDropdownOpen(false);
              handleFetchDrugLabel();
            }
          }}
        >
          <div className="relative" ref={dropdownRef}>
            <label className="mb-1 block text-small font-semibold text-primaryGray-1">
              Drug Name <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={drugName}
                onChange={(e) => {
                  setDrugName(e.target.value);
                  if (e.target.value.trim().length > 0) {
                    setDropdownOpen(true);
                  } else {
                    setDropdownOpen(false);
                  }
                }}
                placeholder="Start typing to search drugs…"
                className="w-full rounded-md border border-primaryGray-14 bg-white px-3 py-2.5 text-small text-primaryGray-1 outline-none transition-all duration-150 placeholder:text-primaryGray-11 focus:border-primaryGray-9 focus:ring-1 focus:ring-primaryGray-9/20"
              />
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  handleFetchDrugLabel();
                }}
                disabled={!drugName.trim() || loading}
                className="flex items-center justify-center rounded-md bg-primaryGray-1 px-3.5 text-white transition-colors duration-150 hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
                title="Search drug label"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>
            </div>
            {dropdownOpen && filteredDrugs.length > 0 && (
              <div className="absolute left-0 right-12 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-md border border-primaryGray-14 bg-white shadow-lg">
                {filteredDrugs.map((drug) => (
                  <div
                    key={drug}
                    className="cursor-pointer px-3 py-2 text-small text-primaryGray-1 transition-colors hover:bg-primaryGray-16"
                    onClick={() => {
                      setDrugName(drug);
                      setDropdownOpen(false);
                    }}
                  >
                    {drug}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {loading && (
          <div className="mt-2 flex h-20 w-full items-center justify-center gap-3 rounded-lg border border-primaryGray-14 bg-primaryGray-16/50 p-4">
            <SpinningLoader />
            <div className="text-small font-semibold text-primaryGray-6">
              Fetching Drug Label…
            </div>
          </div>
        )}

        {parsed && !loading && (
          <div className="mt-1 flex flex-col overflow-y-auto rounded-lg border border-primaryGray-14 bg-white">
            {/* Result header */}
            <div className="flex items-center gap-2 border-b border-primaryGray-14 bg-primaryGray-16/40 px-5 py-3">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2563EB"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="flex-shrink-0"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <h3 className="text-small font-bold text-primaryGray-1">
                Indications &amp; Usage
              </h3>
              <span className="ml-auto rounded-full bg-[#EBF2FF] px-2.5 py-0.5 text-x-tiny font-semibold text-[#2563EB]">
                {drugName}
              </span>
            </div>

            {/* Result body */}
            <div className="flex flex-col gap-4 px-5 py-5">
              {/* Overview */}
              {parsed.overview && (
                <div className="rounded-md border border-blue-100 bg-[#F8FAFF] px-4 py-3">
                  <p className="text-small font-medium leading-relaxed text-primaryGray-1">
                    {parsed.overview}
                  </p>
                </div>
              )}

              {/* Numbered sections */}
              {parsed.sections.length > 0 ? (
                parsed.sections.map((section, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col gap-2 border-l-2 border-primaryGray-14 pl-4"
                  >
                    <h4 className="flex items-center gap-2 text-small font-bold text-primaryGray-1">
                      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-primaryGray-16 text-x-tiny font-bold text-primaryGray-6">
                        {idx + 1}
                      </span>
                      {section.title}
                    </h4>
                    <div className="ml-7">{formatBody(section.body)}</div>
                  </div>
                ))
              ) : (
                /* Fallback: no sections detected, try bullet formatting */
                <div>{formatBody(parsed.overview || drugData)}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default DrugLabelModal;
