import { ChangeEvent } from "react";
import CustomRadioButton from "../../../components/customRadioButton/customRadioButton";
import { PharmaQuestionModel } from "../../../data-model/pharmaQuestion";

interface RenderAnswerSectionProps {
  question: PharmaQuestionModel;
  onHandleChange?: (value: string) => void;
  onCombinedHandleChange?: (value: {
    multiChoiceAnswer: string;
    subjectiveAnswer: string;
  }) => void;
}

enum QuestionType {
  MULTI_CHOICE = "multi-choice",
  SUBJECTIVE = "subjective",
  COMBINED = "combined",
}

const RenderAnswerSection = (props: RenderAnswerSectionProps) => {
  const { question } = props;

  switch (question.type) {
    case QuestionType.MULTI_CHOICE:
      return (
        <div className="multi-choice--container mt-2">
          {question.options?.map((option, index) => (
            <>
              {option.trim() !== "" && (
                <CustomRadioButton
                  name={`${question.question ?? ""}_${question.tag ?? ""}`}
                  value={option}
                  checked={question.answer === option}
                  label={option}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    props.onHandleChange &&
                      props.onHandleChange(e.target.value);
                  }}
                  className="mb-2"
                />
              )}
            </>
          ))}
        </div>
      );
    case QuestionType.SUBJECTIVE:
      return (
        <div className="subjective--container">
          <textarea
            name={`${question.question ?? ""}_${question.tag ?? ""}`}
            id={`${question.question ?? ""}_${question.tag ?? ""}`}
            placeholder="Enter the information here"
            className="subjective--input mt-2 h-20 w-full rounded border border-gray-300 p-2 text-tiny font-normal"
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
              props.onHandleChange && props.onHandleChange(e.target.value);
            }}
            defaultValue={question.answer ?? ""}
          />
        </div>
      );

    case QuestionType.COMBINED:
      return (
        <>
          <div className="multi-choice--container mt-2">
            {question.options?.map((option, index) => (
              <>
                <CustomRadioButton
                  name={`${question.question ?? ""}_${question.tag ?? ""}`}
                  value={option}
                  checked={
                    question?.combined_answer?.multiChoiceAnswer === option
                  }
                  label={option}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    props.onCombinedHandleChange &&
                      props.onCombinedHandleChange({
                        multiChoiceAnswer: e.target.value,
                        subjectiveAnswer:
                          question?.combined_answer?.subjectiveAnswer ?? "",
                      });
                  }}
                  className="mb-2"
                />
              </>
            ))}
          </div>
          <div className="subjective--container">
            <textarea
              name={`${question.question ?? ""}_${question.tag ?? ""}`}
              id={`${question.question ?? ""}_${question.tag ?? ""}`}
              placeholder="Enter the information here"
              className="subjective--input mt-2 w-full rounded border border-gray-300 p-2 text-tiny font-normal"
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
                props.onCombinedHandleChange &&
                  props.onCombinedHandleChange({
                    multiChoiceAnswer:
                      question?.combined_answer?.multiChoiceAnswer ?? "",
                    subjectiveAnswer: e.target.value,
                  });
              }}
              defaultValue={question?.combined_answer?.subjectiveAnswer ?? ""}
            />
          </div>
        </>
      );

    default:
      return null;
  }
};

export default RenderAnswerSection;
