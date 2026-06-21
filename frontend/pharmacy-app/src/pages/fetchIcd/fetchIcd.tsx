import { useEffect, useMemo, useRef, useState } from "react";
import { medicationOptions } from "../../constants/medicationOptions";

interface DiagnosisScore {
  icd10_code: string;
  description: string;
  confidence_score: number;
  reasoning: string;
  specificity_score: number;
}

interface ApiResponse {
  patient_id: string | null;
  identifier: string | null;
  drug_name: string;
  fda_instructions: string;
  primary_diagnosis: DiagnosisScore | null;
  secondary_diagnosis: DiagnosisScore | null;
  all_scores: DiagnosisScore[];
}

const AUTH_URL = "https://authentication.risalabs.ai/api/v1/user-auth/token";
const API_URL =
  "https://apis.risalabs.ai/ai-service/commons/icd-code-detect/get-confidence-scores";
const AUTH_CREDENTIALS = {
  username: "risa_front_end_user",
  password: "e4Itc/E[df~z",
};

// Sample data for quick selection
const SAMPLE_DATA = [
  { icd: "C50.911, E11.9, I10, Z17.0", medication: "Ontruzant" },
  {
    icd: "D72.829, C77.0, C00.1, C76.0, K12.31, H93.19",
    medication: "Gabapentin",
  },
  { icd: "I10, D64.9, D56.3, D51.9", medication: "Riabni" },
  { icd: "N32.81, R39.12, R35.1, R39.15", medication: "Gemtesa" },
  { icd: "D50.9, D64.9, Z51.89", medication: "Injectafer" },
];

const FetchIcd = () => {
  const [diagnosisCode, setDiagnosisCode] = useState("");
  const [medication, setMedication] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredMedications = useMemo(() => {
    if (!medication.trim()) return [];
    const searchTerm = medication.toLowerCase();
    return medicationOptions
      .filter((med) => med.label.toLowerCase().includes(searchTerm))
      .slice(0, 10);
  }, [medication]);

  const handleMedicationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMedication(e.target.value);
    setShowDropdown(true);
    setHighlightedIndex(-1);
  };

  const handleSelectMedication = (selectedMed: string) => {
    setMedication(selectedMed);
    setShowDropdown(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || filteredMedications.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredMedications.length - 1 ? prev + 1 : prev,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelectMedication(filteredMedications[highlightedIndex].value);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  // Get authentication token
  const getAuthToken = async (): Promise<string> => {
    const response = await fetch(AUTH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(AUTH_CREDENTIALS),
    });

    if (!response.ok) {
      throw new Error("Authentication failed");
    }

    const data = await response.json();
    return data.access_token;
  };

  // Parse diagnosis codes from textarea
  const parseDiagnosisCodes = (
    input: string,
  ): { icd10_code: string; description: string }[] => {
    return input
      .split(",")
      .map((code) => code.trim())
      .filter((code) => code.length > 0)
      .map((code) => ({
        icd10_code: code,
        description: "",
      }));
  };

  // Fetch confidence scores
  const handleAnalyze = async () => {
    if (!medication.trim() || !diagnosisCode.trim()) {
      setError("Please enter both diagnosis codes and medication");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Get auth token
      const token = await getAuthToken();

      // Parse diagnosis codes
      const diagnosisCodes = parseDiagnosisCodes(diagnosisCode);

      // Call the API
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          drug_name: medication,
          diagnosis_codes: diagnosisCodes,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch confidence scores");
      }

      const data: ApiResponse = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 0.7) return "text-green-600 bg-green-50";
    if (score >= 0.4) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const canAnalyze = medication.trim() && diagnosisCode.trim() && !isLoading;

  // Format FDA instructions for better readability
  const formatFdaInstructions = (text: string): React.ReactNode => {
    if (!text) return null;

    // Split into sections and format
    const formatted = text
      // Add section breaks
      .replace(
        /Indications and Usage:/gi,
        "|||SECTION|||Indications and Usage:",
      )
      .replace(/Limitations of Use:?/gi, "|||SECTION|||Limitations of Use:")
      .replace(/WEGOVY is/g, "|||BULLET|||WEGOVY is")
      .replace(/WEGOVY injection is/g, "|||BULLET|||WEGOVY injection is")
      .replace(/WEGOVY tablets are/g, "|||BULLET|||WEGOVY tablets are")
      // Format bullet points
      .replace(/•\s*/g, "|||BULLET|||")
      .replace(/o\s+(?=[A-Z])/g, "|||SUBBULLET|||")
      // Clean up references like (1), (14.4)
      .replace(/\[\s*see\s+/gi, "[See ")
      .trim();

    const sections = formatted.split("|||SECTION|||");

    return (
      <div className="flex flex-col gap-3">
        {sections.map((section, sectionIndex) => {
          if (!section.trim()) return null;

          const lines = section.split("|||BULLET|||");
          const sectionTitle = lines[0]?.includes(":")
            ? lines[0].split(":")[0]
            : null;
          const sectionContent = sectionTitle
            ? lines[0].split(":").slice(1).join(":")
            : lines[0];

          return (
            <div key={sectionIndex} className="flex flex-col gap-2">
              {sectionTitle && (
                <p className="text-[13px] font-semibold text-[#1a1a1a]">
                  {sectionTitle.includes("Indications") ? "📋 " : "⚠️ "}
                  {sectionTitle}
                </p>
              )}
              {sectionContent && sectionContent.trim() && (
                <p className="text-[13px] leading-relaxed text-[#333333]">
                  {sectionContent.trim()}
                </p>
              )}
              {lines.slice(1).map((line, lineIndex) => {
                const subBullets = line.split("|||SUBBULLET|||");
                return (
                  <div key={lineIndex} className="ml-3 flex flex-col gap-1">
                    <div className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#4a4a4a]"></span>
                      <span className="text-[13px] leading-relaxed text-[#333333]">
                        {subBullets[0]?.trim()}
                      </span>
                    </div>
                    {subBullets.slice(1).map((sub, subIndex) => (
                      <div
                        key={subIndex}
                        className="ml-4 flex items-start gap-2"
                      >
                        <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-[#666666]"></span>
                        <span className="text-[12px] leading-relaxed text-[#555555]">
                          {sub.trim()}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  // Handle sample data selection
  const handleSampleClick = (sample: { icd: string; medication: string }) => {
    setDiagnosisCode(sample.icd);
    setMedication(sample.medication);
    setResult(null);
    setError(null);
  };

  return (
    <div className="fetch-icd-layout h-full w-full bg-primaryGray-16 p-2">
      <div className="fetch-icd-container flex h-full flex-col gap-2 overflow-hidden rounded bg-white p-4">
        {/* Header Section */}
        <div className="fetch-icd-header mb-4 ml-2 mt-2">
          <h1 className="text-h6 font-bold text-primaryGray-1">
            Medical Diagnostic Assistant
          </h1>
          <p className="text-h11 text-primaryGray-9">
            AI Powered diagnosis code validation with FDA guidelines
          </p>
        </div>

        <div className="fetch-icd-divider mb-4 h-px w-full bg-primaryGray-15"></div>

        <div className="fetch-icd-content flex flex-1 gap-6 overflow-hidden p-2">
          {/* Left Panel - Input */}
          <div className="fetch-icd-input-panel flex max-w-xl flex-1 flex-col gap-4">
            <div>
              <h2 className="mb-1 text-h10 font-bold text-primaryGray-1">
                Input
              </h2>
              <p className="text-h12 text-primaryGray-9">
                Enter patient diagnosis codes and select medication for analysis
              </p>
              <div className="mt-4 h-px w-full bg-primaryGray-16"></div>
            </div>

            {/* Sample Data Chips */}
            <div className="flex flex-col gap-2">
              <label className="text-h12 font-semiBold text-primaryGray-9">
                Quick Samples
              </label>
              <div className="flex flex-col gap-2">
                {SAMPLE_DATA.map((sample, index) => (
                  <button
                    key={index}
                    onClick={() => handleSampleClick(sample)}
                    className="rounded-full border border-primaryGray-14 bg-white px-3 py-1.5 text-left text-h12 text-primaryGray-3 transition-colors hover:border-primaryGray-9 hover:bg-[#F5F5F5]"
                  >
                    {sample.icd} → {sample.medication}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-h11 font-bold text-primaryGray-1">
                Diagnosis Code
              </label>
              <textarea
                className="h-32 w-full resize-none rounded border border-primaryGray-14 p-3 text-h11 focus:border-tertiaryBlue-4 focus:outline-none"
                placeholder="Enter diagnosis code separated by commas (eg: C61.2, C61.3, C61.4)"
                value={diagnosisCode}
                onChange={(e) => setDiagnosisCode(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2 shadow-sm">
              <label className="text-h11 font-bold text-primaryGray-1">
                Medication
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  className="w-full rounded border border-primaryGray-14 p-3 pr-10 text-h11 focus:border-tertiaryBlue-4 focus:outline-none"
                  placeholder="Enter text to search..."
                  value={medication}
                  onChange={handleMedicationChange}
                  onFocus={() => medication.trim() && setShowDropdown(true)}
                  onKeyDown={handleKeyDown}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-primaryGray-9">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M9.16667 15.8333C12.8486 15.8333 15.8333 12.8486 15.8333 9.16667C15.8333 5.48477 12.8486 2.5 9.16667 2.5C5.48477 2.5 2.5 5.48477 2.5 9.16667C2.5 12.8486 5.48477 15.8333 9.16667 15.8333Z"
                      stroke="currentColor"
                      strokeWidth="1.66667"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M17.5 17.5L13.875 13.875"
                      stroke="currentColor"
                      strokeWidth="1.66667"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                {/* Autocomplete Dropdown */}
                {showDropdown && filteredMedications.length > 0 && (
                  <div
                    ref={dropdownRef}
                    className="absolute left-0 top-full z-50 mt-1 max-h-60 w-full overflow-auto rounded border border-primaryGray-14 bg-white shadow-lg"
                  >
                    {filteredMedications.map((med, index) => (
                      <div
                        key={med.value}
                        className={`cursor-pointer px-3 py-2 text-h11 transition-colors ${
                          index === highlightedIndex
                            ? "bg-[#F5F5F5]"
                            : "hover:bg-[#F5F5F5]"
                        }`}
                        onClick={() => handleSelectMedication(med.value)}
                        onMouseEnter={() => setHighlightedIndex(index)}
                      >
                        {med.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              className={`mt-2 w-full rounded py-3 text-h11 font-bold text-white transition-colors ${
                canAnalyze
                  ? "bg-primaryGray-1 hover:bg-primaryGray-5"
                  : "cursor-not-allowed bg-primaryGray-9"
              }`}
              disabled={!canAnalyze}
              onClick={handleAnalyze}
            >
              {isLoading ? "Analyzing..." : "Analyze"}
            </button>
          </div>

          {/* Vertical Divider */}
          <div className="h-full w-px bg-primaryGray-15"></div>

          {/* Right Panel - Result */}
          <div className="fetch-icd-result-panel ml-2 mr-2 flex flex-1 flex-col overflow-hidden rounded-lg bg-primaryGray-17 p-4">
            {isLoading ? (
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primaryGray-14 border-t-tertiaryBlue-4"></div>
                <p className="text-h11 text-primaryGray-9">
                  Analyzing diagnosis codes...
                </p>
              </div>
            ) : error ? (
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <div className="mb-4 text-red-500">
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="M15 9L9 15M9 9L15 15"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <p className="mb-1 text-h10 font-bold text-red-600">Error</p>
                <p className="text-h12 text-primaryGray-9">{error}</p>
              </div>
            ) : result ? (
              <div className="flex flex-1 flex-col gap-4 overflow-auto">
                {/* Drug Name Header */}
                <div className="rounded-lg bg-white p-4">
                  <h3 className="text-h10 font-bold text-primaryGray-1">
                    {result.drug_name}
                  </h3>
                  <p className="mt-1 text-h12 text-primaryGray-9">
                    Analysis Results
                  </p>
                </div>

                {/* Diagnosis Scores */}
                {result.all_scores.map((score, index) => (
                  <div key={index} className="rounded-lg bg-white p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-primaryGray-16 px-2 py-1 text-h11 font-bold text-primaryGray-1">
                          {score.icd10_code}
                        </span>
                        {score.description && (
                          <span className="text-h12 text-primaryGray-9">
                            {score.description}
                          </span>
                        )}
                      </div>
                      <div
                        className={`rounded px-3 py-1 text-h11 font-bold ${getScoreColor(score.confidence_score)}`}
                      >
                        {(score.confidence_score * 100).toFixed(0)}% Confidence
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="mb-1.5 flex justify-between text-[13px]">
                        <span className="font-medium text-[#555555]">
                          Confidence Score
                        </span>
                        <span className="font-semibold text-[#1a1a1a]">
                          {(score.confidence_score * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-[#e5e7eb]">
                        <div
                          className={`h-full rounded-full transition-all ${
                            score.confidence_score >= 0.7
                              ? "bg-[#22c55e]"
                              : score.confidence_score >= 0.4
                                ? "bg-[#f59e0b]"
                                : "bg-[#ef4444]"
                          }`}
                          style={{ width: `${score.confidence_score * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="rounded bg-[#f8f9fa] p-3">
                      <p className="mb-1.5 text-[13px] font-semibold text-[#1a1a1a]">
                        Reasoning
                      </p>
                      <p className="text-[13px] leading-relaxed text-[#444444]">
                        {score.reasoning}
                      </p>
                    </div>
                  </div>
                ))}

                {/* FDA Instructions */}
                {result.fda_instructions && (
                  <div className="rounded-lg bg-white p-4">
                    <p className="mb-3 text-[14px] font-semibold text-[#1a1a1a]">
                      FDA Instructions
                    </p>
                    <div className="max-h-96 overflow-auto rounded-lg border border-[#e5e7eb] bg-[#fafafa] p-4">
                      {formatFdaInstructions(result.fda_instructions)}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <div className="mb-4 text-tertiaryBlue-4">
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 40 40"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="20"
                      cy="20"
                      r="18"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="M20 28V20"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <circle cx="20" cy="14" r="1.5" fill="currentColor" />
                  </svg>
                </div>
                <p className="mb-1 text-h10 font-bold text-primaryGray-1">
                  No analysis results found.
                </p>
                <p className="text-h12 font-semiBold text-primaryGray-9">
                  Enter diagnosis codes and medication to analyze.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FetchIcd;
