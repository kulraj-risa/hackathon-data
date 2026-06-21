import { PharmaQuestionModel } from "../../../data-model/pharmaQuestion";

export const generateTimestamp = (): string => {
  const now = new Date();
  return now.toISOString();
};

export const processQuestions = (
  questions: PharmaQuestionModel[],
): PharmaQuestionModel[] => {
  const result: PharmaQuestionModel[] = [];

  questions.forEach((question) => {
    if (question.type === "combined") {
      if (question.combined_answer?.multiChoiceAnswer) {
        const { combined_answer, ...rest } = question;
        result.push({
          ...rest,
          type: "multi-choice",
          answer: question.combined_answer.multiChoiceAnswer,
        });
      }

      if (question.combined_answer?.subjectiveAnswer) {
        const { combined_answer, ...rest } = question;
        result.push({
          ...rest,
          type: "subjective",
          answer: question.combined_answer.subjectiveAnswer,
        });
      }
    } else {
      const { combined_answer, ...rest } = question;
      result.push(rest);
    }
  });

  return result;
};
