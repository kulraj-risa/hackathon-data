import { useEffect, useState } from "react";
import { PharmaQuestionModel } from "../../../data-model/pharmaQuestion";
import RenderAnswerSection from "./renderAnswerSection";

interface PharmaQuestionsProps {
  questions: PharmaQuestionModel[];
  onQuestionUpdated?: (questions: PharmaQuestionModel[]) => void;
}

const PharmaQuestions = (props: PharmaQuestionsProps) => {
  const [questionsWithResponse, setQuestionsWithResponse] = useState<
    PharmaQuestionModel[]
  >([]);

  useEffect(() => {
    if (props.questions) {
      setQuestionsWithResponse([...props.questions]);
    }
  }, [props.questions]);

  const updateQuestionWithResponseAtIndex = (value: string, index: number) => {
    setQuestionsWithResponse((prev) =>
      prev.map((question, i) =>
        i === index ? { ...question, answer: value } : question,
      ),
    );
  };

  const updateCombinedQuestionWithResponseAtIndex = (
    value: { multiChoiceAnswer: string; subjectiveAnswer: string },
    index: number,
  ) => {
    setQuestionsWithResponse((prev) =>
      prev.map((question, i) =>
        i === index
          ? {
              ...question,
              combined_answer: {
                multiChoiceAnswer: value.multiChoiceAnswer,
                subjectiveAnswer: value.subjectiveAnswer,
              },
            }
          : question,
      ),
    );
  };

  useEffect(() => {
    if (props.onQuestionUpdated) {
      props.onQuestionUpdated(questionsWithResponse);
    }
  }, [questionsWithResponse]);

  return (
    <div className="flex flex-col">
      {questionsWithResponse.length > 0 ? (
        questionsWithResponse.map((question, index) => (
          <div
            key={index}
            className={`pharma-question--container flex gap-3 px-1 py-4 ${index > 0 ? "border-t border-primaryGray-14" : ""} ${question?.isDiffData ? "has-diff" : ""} ${question?.isMissingData ? "bg-tertiaryRed-11" : ""} ${question?.isNewData ? "bg-primaryGreen-11" : ""} ${question?.isAnswerChanged ? "bg-secondaryYellow-11" : ""}`}
          >
            <div className="question-index mt-[1px] text-small font-semibold text-primaryGray-9">
              {index + 1}.
            </div>
            <div className="question-body flex-1">
              <div className="pharma-question--question text-small font-semibold leading-relaxed text-primaryGray-1">
                {question.question ?? ""}
              </div>
              <div className="pharma-question--answer mb-4 mt-2">
                <RenderAnswerSection
                  question={question}
                  onHandleChange={(value) =>
                    updateQuestionWithResponseAtIndex(value, index)
                  }
                  onCombinedHandleChange={(value) => {
                    updateCombinedQuestionWithResponseAtIndex(value, index);
                  }}
                />
              </div>
              <div className="pharma-question--facts flex flex-col gap-2">
                {question?.api_response?.facts?.supportive_facts &&
                  question?.api_response?.facts?.supportive_facts.length >
                    0 && (
                    <div className="pharma-question--facts correct rounded-lg border border-[#d1fae5] bg-[#ECFDF5] p-3">
                      <div className="facts-header mb-1.5 text-xs font-bold text-[#065f46]">
                        Supportive Statement
                      </div>
                      <ul className="facts-container flex flex-col gap-1">
                        <RenderFacts
                          facts={
                            question?.api_response?.facts?.supportive_facts
                          }
                        />
                      </ul>
                    </div>
                  )}

                {question?.api_response?.facts?.contradictory_facts &&
                  question?.api_response?.facts?.contradictory_facts.length >
                    0 && (
                    <div className="pharma-question--facts contradictory rounded-lg border border-[#fde68a] bg-[#FFFBEB] p-3">
                      <div className="facts-header mb-1.5 text-xs font-bold text-[#92400e]">
                        Contradictory Statement
                      </div>
                      <ul className="facts-container flex flex-col gap-1">
                        <RenderFacts
                          facts={
                            question?.api_response?.facts?.contradictory_facts
                          }
                        />
                      </ul>
                    </div>
                  )}
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="pharma-question--container flex h-full items-center justify-center gap-1 text-h10 text-primaryGray-9">
          No questions found
        </div>
      )}
    </div>
  );
};

const RenderFacts = (props: { facts: string[] }) => {
  return (
    <>
      {props.facts.map((fact) => (
        <>
          <li className="facts-content text-[0.8125rem]" key={fact}>
            &#8226;&nbsp;&nbsp;{fact}
          </li>
        </>
      ))}
    </>
  );
};

export default PharmaQuestions;
