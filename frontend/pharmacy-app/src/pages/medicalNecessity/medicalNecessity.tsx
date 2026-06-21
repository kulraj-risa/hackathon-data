import axios from "axios";
import { useEffect, useMemo, useRef, useState } from "react";
import { sampleDataForUI } from "../../constants/sampleQuestionsData";
import { QuestionForUI, SampleDataModel } from "../../data-model/sampleData";

// API Response types
interface ApiResponseFacts {
  supportive_facts: string[];
  contradictory_facts: string[];
}

interface QuestionApiResponse {
  facts: ApiResponseFacts;
  answer: string;
}

interface ApiResponseItem {
  question: string;
  answer: string;
  api_response: QuestionApiResponse;
  options: string[];
  type: string;
}

interface MedicalNecessityApiResponse {
  responses: ApiResponseItem[];
}

interface PredictStatusResponse {
  drug: string;
  status: string;
  matched_questions: number;
  total_questions: number;
  criteria: string;
  thinking: string;
}

// Available MRN PDFs
const AVAILABLE_PDF_MRNS = [
  "4206249",
  "7801005",
  "8184614",
  "8742953",
  "8751692",
  "8778374",
];

// Mapping real MRNs to display (dummy) MRNs for privacy
const MRN_DISPLAY_MAP: Record<string, string> = {
  "4206249": "MRN1234",
  "7801005": "MRN2345",
  "8184614": "MRN3456",
  "8742953": "MRN4567",
  "8751692": "MRN5678",
  "8778374": "MRN6789",
};

// Reverse mapping: display MRN to real MRN
const DISPLAY_TO_REAL_MRN: Record<string, string> = Object.entries(
  MRN_DISPLAY_MAP,
).reduce(
  (acc, [real, display]) => {
    acc[display] = real;
    return acc;
  },
  {} as Record<string, string>,
);

// Get display MRN from real MRN
const getDisplayMrn = (realMrn: string): string => {
  return MRN_DISPLAY_MAP[realMrn] || realMrn;
};

// Get real MRN from display MRN
const getRealMrn = (displayMrn: string): string => {
  return DISPLAY_TO_REAL_MRN[displayMrn] || displayMrn;
};

const MedicalNecessity = () => {
  const [mrnInput, setMrnInput] = useState("");
  const [selectedMrn, setSelectedMrn] = useState<string | null>(null);
  const [showMrnDropdown, setShowMrnDropdown] = useState(false);
  const [highlightedMrnIndex, setHighlightedMrnIndex] = useState(-1);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isLoadingClinical, setIsLoadingClinical] = useState(false);
  const [isLoadingPredict, setIsLoadingPredict] = useState(false);
  const [apiResponse, setApiResponse] =
    useState<MedicalNecessityApiResponse | null>(null);
  const [predictResponse, setPredictResponse] =
    useState<PredictStatusResponse | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [pdfZoom, setPdfZoom] = useState(100);

  const mrnInputRef = useRef<HTMLInputElement>(null);
  const mrnDropdownRef = useRef<HTMLDivElement>(null);

  // Check if selected MRN has a PDF available
  const hasPdfAvailable = selectedMrn
    ? AVAILABLE_PDF_MRNS.includes(selectedMrn)
    : false;

  // Get PDF path for selected MRN
  const getPdfPath = () => {
    if (!selectedMrn || !hasPdfAvailable) return "";
    return `/md-notes/${selectedMrn}.pdf`;
  };

  // Get all available MRNs (display versions)
  const allDisplayMrns = useMemo(() => {
    return sampleDataForUI.map((item) => getDisplayMrn(item.mrn));
  }, []);

  // Filter MRNs based on input (using display MRNs)
  const filteredDisplayMrns = useMemo(() => {
    if (!mrnInput) return allDisplayMrns;
    return allDisplayMrns.filter((mrn) =>
      mrn.toLowerCase().includes(mrnInput.toLowerCase()),
    );
  }, [mrnInput, allDisplayMrns]);

  // Get selected display MRN
  const selectedDisplayMrn = selectedMrn ? getDisplayMrn(selectedMrn) : null;

  // Get selected patient data
  const selectedPatientData: SampleDataModel | undefined = useMemo(() => {
    if (!selectedMrn) return undefined;
    return sampleDataForUI.find((item) => item.mrn === selectedMrn);
  }, [selectedMrn]);

  // Get drug name from selected patient
  const drugName = selectedPatientData?.prescription?.drug_name || "";

  // Get questions for selected patient
  const questions: QuestionForUI[] =
    selectedPatientData?.questions_for_ui || [];

  // Create a map of question to API response for easy lookup
  const questionResponseMap = useMemo(() => {
    if (!apiResponse) return new Map<string, ApiResponseItem>();
    const map = new Map<string, ApiResponseItem>();
    apiResponse.responses.forEach((resp) => {
      map.set(resp.question, resp);
    });
    return map;
  }, [apiResponse]);

  // Fetch auth token
  const fetchAuthToken = async (): Promise<string | null> => {
    if (authToken) return authToken;

    try {
      const response = await axios.post(
        "https://authentication.risalabs.ai/api/v1/user-auth/token",
        {
          username: "risa_front_end_user",
          password: "e4Itc/E[df~z",
        },
      );
      const token = response.data.access_token;
      setAuthToken(token);
      return token;
    } catch (error) {
      console.error("Auth error:", error);
      return null;
    }
  };

  // Handle Answer Clinical click
  const handleAnswerClinical = async () => {
    if (!selectedPatientData) return;

    setIsLoadingClinical(true);
    setPredictResponse(null);

    try {
      const token = await fetchAuthToken();
      if (!token) {
        console.error("Failed to get auth token");
        setIsLoadingClinical(false);
        return;
      }

      const response = await axios.post<MedicalNecessityApiResponse>(
        "https://apis-dev.risalabs.ai/ai-service/commons/medical-necessity/get-batch-medical-necessity",
        selectedPatientData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      setApiResponse(response.data);

      // Auto-select answers from API response
      const newAnswers: Record<number, string> = {};
      response.data.responses.forEach((resp) => {
        const questionIndex = questions.findIndex(
          (q) => q.question === resp.question,
        );
        if (questionIndex >= 0) {
          newAnswers[questionIndex] = resp.answer;
        }
      });
      setAnswers(newAnswers);
    } catch (error) {
      console.error("API error:", error);
    } finally {
      setIsLoadingClinical(false);
    }
  };

  // Handle Predict Case Status click
  const handlePredictStatus = async () => {
    if (!apiResponse || !drugName) return;

    setIsLoadingPredict(true);

    try {
      const token = await fetchAuthToken();
      if (!token) {
        console.error("Failed to get auth token");
        setIsLoadingPredict(false);
        return;
      }

      // Build the payload from API response
      const questionsPayload = apiResponse.responses.map((resp) => ({
        question: resp.question,
        answer: resp.answer,
      }));

      const response = await axios.post<PredictStatusResponse>(
        "https://apis-dev.risalabs.ai/ai-service/commons/medical-necessity/check-drug-approval",
        {
          drug: drugName,
          questions: questionsPayload,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      setPredictResponse(response.data);
    } catch (error) {
      console.error("Predict API error:", error);
    } finally {
      setIsLoadingPredict(false);
    }
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mrnDropdownRef.current &&
        !mrnDropdownRef.current.contains(event.target as Node) &&
        mrnInputRef.current &&
        !mrnInputRef.current.contains(event.target as Node)
      ) {
        setShowMrnDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle MRN input change
  const handleMrnInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMrnInput(e.target.value);
    setShowMrnDropdown(true);
    setHighlightedMrnIndex(-1);
    // Reset selection if input changes
    if (selectedDisplayMrn && e.target.value !== selectedDisplayMrn) {
      setSelectedMrn(null);
      setAnswers({});
      setApiResponse(null);
      setPredictResponse(null);
    }
  };

  // Handle MRN selection (receives display MRN, stores real MRN)
  const handleSelectMrn = (displayMrn: string) => {
    const realMrn = getRealMrn(displayMrn);
    setMrnInput(displayMrn);
    setSelectedMrn(realMrn);
    setShowMrnDropdown(false);
    setHighlightedMrnIndex(-1);
    setAnswers({});
    setApiResponse(null);
    setPredictResponse(null);
  };

  // Handle keyboard navigation for MRN dropdown
  const handleMrnKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showMrnDropdown || filteredDisplayMrns.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedMrnIndex((prev) =>
        prev < filteredDisplayMrns.length - 1 ? prev + 1 : prev,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedMrnIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter" && highlightedMrnIndex >= 0) {
      e.preventDefault();
      handleSelectMrn(filteredDisplayMrns[highlightedMrnIndex]);
    } else if (e.key === "Escape") {
      setShowMrnDropdown(false);
    }
  };

  // Handle answer selection
  const handleAnswerSelect = (questionIndex: number, option: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: option,
    }));
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === "approved") return "text-[#4CAF50]";
    if (lowerStatus === "denied") return "text-[#F44336]";
    return "text-[#FFC107]";
  };

  return (
    <div className="medical-necessity-layout h-full w-full bg-primaryGray-16 p-2">
      <div className="medical-necessity-container flex h-full flex-col gap-2 overflow-hidden rounded bg-white p-4">
        {/* Header Section */}
        <div className="medical-necessity-header mb-4 ml-2 mt-2">
          <h1 className="text-h6 font-bold text-primaryGray-1">
            Medical Necessity Assistant
          </h1>
          <p className="text-h11 text-primaryGray-9">
            AI Powered Clinical Questionnaire & FDA-Based Approval Prediction
          </p>
        </div>

        <div className="medical-necessity-divider mb-4 h-px w-full bg-primaryGray-15"></div>

        <div className="medical-necessity-content flex flex-1 gap-6 overflow-hidden p-2">
          {/* Left Panel */}
          <div className="medical-necessity-left-panel flex flex-1 flex-col gap-4 overflow-hidden">
            {/* Input Row */}
            <div className="flex items-end gap-4">
              {/* MRN Input with Autocomplete */}
              <div className="relative flex w-48 flex-col gap-2">
                <label className="text-h12 font-bold text-primaryGray-1">
                  Select MRN
                </label>
                <div className="relative">
                  <input
                    ref={mrnInputRef}
                    type="text"
                    className="w-full rounded border border-primaryGray-14 p-2.5 pr-10 text-h12 focus:border-tertiaryBlue-4 focus:outline-none"
                    placeholder="Search MRN..."
                    value={mrnInput}
                    onChange={handleMrnInputChange}
                    onFocus={() => setShowMrnDropdown(true)}
                    onKeyDown={handleMrnKeyDown}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-primaryGray-9">
                    <svg
                      width="18"
                      height="18"
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
                </div>

                {/* MRN Dropdown */}
                {showMrnDropdown && filteredDisplayMrns.length > 0 && (
                  <div
                    ref={mrnDropdownRef}
                    className="absolute left-0 top-full z-50 mt-1 max-h-48 w-full overflow-y-auto rounded border border-primaryGray-14 bg-white shadow-lg"
                  >
                    {filteredDisplayMrns.map((mrn, index) => (
                      <div
                        key={mrn}
                        className={`cursor-pointer px-3 py-2.5 text-h12 transition-colors ${
                          index === highlightedMrnIndex
                            ? "bg-[#F5F5F5] text-primaryGray-1"
                            : "hover:bg-[#F5F5F5]"
                        }`}
                        onClick={() => handleSelectMrn(mrn)}
                        onMouseEnter={() => setHighlightedMrnIndex(index)}
                      >
                        {mrn}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Drug Name */}
              <div className="flex w-48 flex-col gap-2">
                <label className="text-h12 font-bold text-primaryGray-1">
                  Drug Name
                </label>
                <input
                  type="text"
                  className="w-full rounded border border-primaryGray-14 bg-primaryGray-16 p-2.5 text-h12 focus:outline-none"
                  value={drugName}
                  readOnly
                  placeholder=""
                />
              </div>

              {/* Buttons */}
              <div className="flex items-end gap-2">
                <button
                  className={`rounded border px-4 py-2.5 text-h12 font-bold transition-colors ${
                    selectedMrn && hasPdfAvailable
                      ? "border-primaryGray-1 hover:bg-primaryGray-16"
                      : "cursor-not-allowed border-primaryGray-14 text-primaryGray-9"
                  }`}
                  onClick={() => setShowNotesModal(true)}
                  disabled={!selectedMrn || !hasPdfAvailable}
                >
                  View Notes
                </button>
                <button
                  className={`rounded px-4 py-2.5 text-h12 font-bold text-white transition-colors ${
                    selectedMrn && !isLoadingClinical
                      ? "bg-primaryGray-1 hover:bg-primaryGray-5"
                      : "cursor-not-allowed bg-primaryGray-9"
                  }`}
                  onClick={handleAnswerClinical}
                  disabled={!selectedMrn || isLoadingClinical}
                >
                  {isLoadingClinical ? "Loading..." : "Answer Clinical"}
                </button>
              </div>
            </div>

            {/* Questions Section */}
            <div className="flex-1 overflow-y-auto pr-2">
              {isLoadingClinical ? (
                <div className="flex h-full flex-col items-center justify-center">
                  <div className="mb-3 h-8 w-8 animate-spin rounded-full border-4 border-primaryGray-14 border-t-tertiaryBlue-4"></div>
                  <p className="text-h11 font-semiBold text-primaryGray-9">
                    Analyzing clinical data...
                  </p>
                </div>
              ) : questions.length === 0 ? (
                <div className="flex h-full items-center justify-center text-h11 font-semiBold text-primaryGray-9">
                  No questions found
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {questions.map((question, qIndex) => {
                    const responseData = questionResponseMap.get(
                      question.question,
                    );
                    const supportiveFacts =
                      responseData?.api_response?.facts?.supportive_facts || [];
                    const contradictoryFacts =
                      responseData?.api_response?.facts?.contradictory_facts ||
                      [];

                    return (
                      <div key={qIndex} className="flex flex-col gap-2">
                        <p className="text-h11 font-semiBold text-primaryGray-1">
                          {qIndex + 1}. {question.question}
                        </p>
                        <div className="ml-4 flex flex-col gap-1.5">
                          {question.options.map((option, oIndex) => (
                            <label
                              key={oIndex}
                              className="flex cursor-pointer items-center gap-3"
                            >
                              <input
                                type="radio"
                                name={`question-${qIndex}`}
                                value={option}
                                checked={answers[qIndex] === option}
                                onChange={() =>
                                  handleAnswerSelect(qIndex, option)
                                }
                                className="h-4 w-4 cursor-pointer accent-primaryGray-1"
                              />
                              <span className="text-h12 text-primaryGray-3">
                                {option}
                              </span>
                            </label>
                          ))}
                        </div>

                        {/* Supportive Statement */}
                        {supportiveFacts.length > 0 && (
                          <div className="ml-4 mt-1 rounded border-l-4 border-[#4CAF50] bg-[#E8F5E9] p-3">
                            <p className="mb-1 text-h12 font-bold text-primaryGray-1">
                              Supportive Statement
                            </p>
                            <ul className="list-disc pl-4">
                              {supportiveFacts.map((fact, fIndex) => (
                                <li
                                  key={fIndex}
                                  className="text-h12 text-primaryGray-3"
                                >
                                  {fact}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Contradictory Statement */}
                        {contradictoryFacts.length > 0 && (
                          <div className="ml-4 mt-1 rounded border-l-4 border-[#FFC107] bg-[#FFF8E1] p-3">
                            <p className="mb-1 text-h12 font-bold text-primaryGray-1">
                              Contradictory Statement
                            </p>
                            <ul className="list-disc pl-4">
                              {contradictoryFacts.map((fact, fIndex) => (
                                <li
                                  key={fIndex}
                                  className="text-h12 text-primaryGray-3"
                                >
                                  {fact}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="h-full w-px bg-primaryGray-15"></div>

          {/* Right Panel - Analysis Results */}
          <div className="medical-necessity-right-panel flex flex-1 flex-col">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-h9 font-bold text-primaryGray-1">
                  Analysis Results
                </h2>
                <p className="text-h12 text-primaryGray-9">
                  AI Generated insights and FDA guidelines recommendations
                </p>
              </div>
              {apiResponse && (
                <button
                  className={`rounded px-4 py-2.5 text-h12 font-bold text-white transition-colors ${
                    !isLoadingPredict
                      ? "bg-primaryGray-1 hover:bg-primaryGray-5"
                      : "cursor-not-allowed bg-primaryGray-9"
                  }`}
                  onClick={handlePredictStatus}
                  disabled={isLoadingPredict}
                >
                  {isLoadingPredict ? "Loading..." : "Predict Case Status"}
                </button>
              )}
            </div>

            <div className="medical-necessity-divider mb-4 h-px w-full bg-primaryGray-15"></div>

            {/* Results Content */}
            {predictResponse ? (
              <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
                {/* Case Status Card */}
                <div className="rounded-lg border border-primaryGray-14 bg-white p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M16.6667 5L7.50001 14.1667L3.33334 10"
                          stroke="#4CAF50"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="text-h10 font-bold text-primaryGray-1">
                        Case Status
                      </span>
                    </div>
                    <span className="text-h12 text-primaryGray-9">Result</span>
                  </div>
                  <span
                    className={`text-h10 font-bold capitalize ${getStatusColor(predictResponse.status)}`}
                  >
                    {predictResponse.status}
                  </span>
                </div>

                {/* AI Analysis Card */}
                <div className="rounded-lg border border-primaryGray-14 bg-white p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle
                          cx="10"
                          cy="10"
                          r="8"
                          stroke="#6B7280"
                          strokeWidth="1.5"
                        />
                        <path
                          d="M10 6V10L12.5 12.5"
                          stroke="#6B7280"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="text-h10 font-bold text-primaryGray-1">
                        AI Analysis
                      </span>
                    </div>
                    <span className="text-h12 text-primaryGray-9">
                      Thinking
                    </span>
                  </div>
                  <p className="text-h12 leading-relaxed text-primaryGray-3">
                    {predictResponse.thinking}
                  </p>
                </div>

                {/* Approval Criteria Card */}
                <div className="rounded-lg border border-primaryGray-14 bg-white p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <rect
                          x="3"
                          y="3"
                          width="14"
                          height="14"
                          rx="2"
                          stroke="#6B7280"
                          strokeWidth="1.5"
                        />
                        <path
                          d="M7 7H13"
                          stroke="#6B7280"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                        <path
                          d="M7 10H13"
                          stroke="#6B7280"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                        <path
                          d="M7 13H10"
                          stroke="#6B7280"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="text-h10 font-bold text-primaryGray-1">
                        Approval Criteria
                      </span>
                    </div>
                    <span className="text-h12 text-primaryGray-9">
                      Reference
                    </span>
                  </div>
                  <div className="whitespace-pre-line text-h12 leading-relaxed text-primaryGray-3">
                    {predictResponse.criteria}
                  </div>
                </div>
              </div>
            ) : isLoadingPredict ? (
              <div className="flex flex-1 flex-col items-center justify-center rounded-lg bg-primaryGray-17 p-6">
                <div className="mb-3 h-8 w-8 animate-spin rounded-full border-4 border-primaryGray-14 border-t-tertiaryBlue-4"></div>
                <p className="text-h11 font-semiBold text-primaryGray-9">
                  Predicting case status...
                </p>
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center rounded-lg bg-primaryGray-17 p-6 text-center">
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
                  No case status found.
                </p>
                <p className="text-h12 font-semiBold text-primaryGray-9">
                  Enter questionnaire answers to analyze.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Clinical Document Modal */}
      {showNotesModal && selectedMrn && hasPdfAvailable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative flex h-[90vh] w-[700px] flex-col rounded-lg bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-primaryGray-14 px-6 py-4">
              <h2 className="text-[18px] font-semibold text-primaryGray-1">
                Clinical Document
              </h2>
              <button
                onClick={() => {
                  setShowNotesModal(false);
                  setPdfZoom(100);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full text-primaryGray-5 transition-colors hover:bg-primaryGray-16 hover:text-primaryGray-1"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18 6L6 18M6 6L18 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center justify-between border-b border-primaryGray-14 px-6 py-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPdfZoom((prev) => Math.max(50, prev - 10))}
                  className="flex h-8 w-8 items-center justify-center rounded border border-primaryGray-14 text-primaryGray-3 transition-colors hover:bg-primaryGray-16"
                >
                  -
                </button>
                <span className="min-w-[60px] text-center text-[14px] font-medium text-primaryGray-3">
                  {pdfZoom}%
                </span>
                <button
                  onClick={() => setPdfZoom((prev) => Math.min(200, prev + 10))}
                  className="flex h-8 w-8 items-center justify-center rounded border border-primaryGray-14 text-primaryGray-3 transition-colors hover:bg-primaryGray-16"
                >
                  +
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPdfZoom(100)}
                  className="flex h-8 w-8 items-center justify-center rounded text-primaryGray-5 transition-colors hover:bg-primaryGray-16 hover:text-primaryGray-1"
                  title="Reset zoom"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1 4V10H7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M3.51 15C4.15839 16.8404 5.38734 18.4202 7.01166 19.5014C8.63598 20.5826 10.5677 21.1066 12.5157 20.9945C14.4637 20.8824 16.3226 20.1401 17.8121 18.8798C19.3017 17.6195 20.3413 15.9093 20.7742 14.0064C21.2072 12.1035 21.0101 10.1145 20.2126 8.33111C19.4152 6.54773 18.0605 5.06428 16.3528 4.10039C14.6451 3.1365 12.6769 2.74294 10.7335 2.97985C8.79004 3.21677 6.97691 4.07146 5.56 5.42L1 10"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* PDF Viewer */}
            <div className="flex-1 overflow-auto bg-[#525659] p-4">
              <div
                className="mx-auto bg-white shadow-lg"
                style={{
                  width: `${(612 * pdfZoom) / 100}px`,
                  minHeight: `${(792 * pdfZoom) / 100}px`,
                }}
              >
                <iframe
                  src={`${getPdfPath()}#toolbar=0&navpanes=0`}
                  className="h-full w-full"
                  style={{
                    height: `${(792 * pdfZoom) / 100}px`,
                    border: "none",
                  }}
                  title={`Clinical Document - MRN ${selectedDisplayMrn}`}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-primaryGray-14 px-6 py-4">
              <button
                onClick={() => {
                  setShowNotesModal(false);
                  setPdfZoom(100);
                }}
                className="rounded border border-primaryGray-14 bg-white px-6 py-2.5 text-[14px] font-medium text-primaryGray-3 transition-colors hover:bg-primaryGray-16"
              >
                Cancel
              </button>
              <a
                href={getPdfPath()}
                download={`${selectedDisplayMrn}_clinical_notes.pdf`}
                className="rounded bg-primaryGray-1 px-6 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-primaryGray-5"
              >
                Download
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalNecessity;
