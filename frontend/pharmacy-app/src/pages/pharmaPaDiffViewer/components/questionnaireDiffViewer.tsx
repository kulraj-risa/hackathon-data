import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { PharmaQuestionModel } from "../../../data-model/pharmaQuestion";
import { RootState } from "../../../redux/store/store";
import PharmaQuestions from "../../pharmaQuestionaire/components/pharmaQuestions";
const QuestionnaireDiffViewer = () => {
  const { baselineData, currentData, loading, error } = useSelector(
    (state: RootState) => state.cmmDiffData,
  );

  const [currentQuestions, setCurrentQuestions] = useState<
    PharmaQuestionModel[]
  >([]);

  const [baselineQuestions, setBaselineQuestions] = useState<
    PharmaQuestionModel[]
  >([]);

  const [currentMismatchIndex, setCurrentMismatchIndex] = useState<number>(-1);
  const [cmmFormMismatchElementsLength, setCmmFormMismatchElementsLength] =
    useState<number>(0);

  const scrollToMismatch = (type: "next" | "prev") => {
    const mismatchElements = document.querySelectorAll(
      ".pharma-question--container.has-diff",
    );
    const index =
      type === "next"
        ? Math.min(currentMismatchIndex + 1, mismatchElements.length - 1)
        : Math.max(currentMismatchIndex - 1, 0);

    const targetElement = mismatchElements[index] as HTMLElement;

    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
      setCurrentMismatchIndex(index);
    }
  };

  const extractUniqueTaggedQuestions = (
    data: any,
    tag: string,
  ): PharmaQuestionModel[] => {
    const questions = data?.data?.questionnaire?.[
      "questions"
    ] as PharmaQuestionModel[];
    if (!questions || !Array.isArray(questions)) return [];

    return questions.map((question) => ({
      ...question,
      question: question?.question?.split("*")[0],
      tag,
    }));
  };

  const getQuestionsNotPresentInBaseline = (
    baselineQuestions: PharmaQuestionModel[],
    currentQuestions: PharmaQuestionModel[],
  ) => {
    const finalCurrentQuestions: PharmaQuestionModel[] = [];
    for (const [index, question] of currentQuestions.entries()) {
      const baselineQuestion = baselineQuestions[index];
      if (!baselineQuestion) {
        question.isNewData = true;
        question.isDiffData = true;
      } else {
        if (baselineQuestion.answer !== question.answer) {
          question.isAnswerChanged = true;
          question.isDiffData = true;
        }
      }
      finalCurrentQuestions.push(question);
    }
    return finalCurrentQuestions;
  };

  const getQuestionsNotPresentInCurrent = (
    baselineQuestions: PharmaQuestionModel[],
    currentQuestions: PharmaQuestionModel[],
  ) => {
    const finalBaselineQuestions: PharmaQuestionModel[] = [];
    for (const question of baselineQuestions) {
      const currentQuestion = currentQuestions.find(
        (q) => q.question === question.question,
      );
      if (!currentQuestion) {
        question.isMissingData = true;
        question.isDiffData = true;
      }
      finalBaselineQuestions.push(question);
    }
    return finalBaselineQuestions;
  };

  useEffect(() => {
    if (!loading && !error) {
      let baselineQuestions: PharmaQuestionModel[] = [];
      let currentQuestions: PharmaQuestionModel[] = [];
      if (baselineData) {
        baselineQuestions = extractUniqueTaggedQuestions(
          baselineData,
          "baseline",
        );
      }
      if (currentData) {
        currentQuestions = extractUniqueTaggedQuestions(currentData, "current");
      }

      setCurrentQuestions(
        getQuestionsNotPresentInBaseline(baselineQuestions, currentQuestions),
      );
      setBaselineQuestions(
        getQuestionsNotPresentInCurrent(baselineQuestions, currentQuestions),
      );
    }
  }, [baselineData, currentData, loading, error]);

  useEffect(() => {
    if (baselineQuestions.length > 0 && currentQuestions.length > 0) {
      setCmmFormMismatchElementsLength(
        currentQuestions.filter((question) => question.isDiffData).length,
      );
    }
  }, [currentQuestions, baselineQuestions]);

  return (
    <>
      <div className="pharma-pa-diff-viewer__body-content-left flex h-full flex-1 flex-col overflow-hidden rounded-md border border-primaryGray-15 bg-white">
        <div className="pharma-pa-diff-viewer__body-content-left-title border-b border-primaryGray-15 bg-primaryGray-16 px-4 py-2 text-small font-semibold leading-6 text-primaryGray-1 shadow-md">
          Baseline Data
        </div>
        <div className="pharma-pa-diff-viewer__body-content-left-content flex flex-1 flex-col gap-2 overflow-auto px-4 py-2">
          <PharmaQuestions questions={baselineQuestions} />
        </div>
      </div>
      <div className="pharma-pa-diff-viewer__body-content-right flex h-full flex-1 flex-col overflow-hidden rounded-md border border-primaryGray-15 bg-white">
        <div className="pharma-pa-diff-viewer__body-content-middle-title flex justify-between border-b border-primaryGray-15 bg-primaryGray-16 px-4 py-2 text-small font-semibold leading-6 text-primaryGray-1 shadow-md">
          Final Data
          <div className="text-small text-tertiaryRed-4">
            {cmmFormMismatchElementsLength > 0
              ? `${cmmFormMismatchElementsLength} mismatch(es)`
              : "No Mismatches"}
          </div>
          <div className="mismatch_navigate cursor-pointer text-tertiaryBlue-4">
            {currentMismatchIndex + 1} / {cmmFormMismatchElementsLength}
            <span
              className="ml-2 cursor-pointer text-xs text-tertiaryBlue-4"
              onClick={() => scrollToMismatch("next")}
            >
              Next
            </span>
            <span
              className="ml-2 cursor-pointer text-xs text-tertiaryBlue-4"
              onClick={() => scrollToMismatch("prev")}
            >
              Prev
            </span>
          </div>
        </div>
        <div className="pharma-pa-diff-viewer__body-content-middle-content form-data-diff flex flex-1 flex-col gap-2 overflow-auto px-4 py-2">
          <PharmaQuestions questions={currentQuestions} />
        </div>
      </div>
    </>
  );
};

export default QuestionnaireDiffViewer;
