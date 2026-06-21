import { createSlice } from "@reduxjs/toolkit";
import { getAllQuestionsForOrder } from "../../../api/bigQuery/nycbsPharmaOrders";
import { fetchBqRecordByIdentifier } from "../../../api/bigQuery/paCasesBigQuery";
import {
  PharmaQuestionModel,
  PharmaQuestionsModel,
} from "../../../data-model/pharmaQuestion";
import { logDataToConsole } from "../../../utils/customLogger";

interface PharmaQuestionsSlice {
  data: PharmaQuestionsModel | null;
  loading: boolean;
  error: string | null;
}

const initialState: PharmaQuestionsSlice = {
  data: null,
  loading: false,
  error: null,
};

const pharmaQuestionsSlice = createSlice({
  name: "pharmaQuestionsSlice",
  initialState,
  reducers: {
    fetchPharmaQuestionsStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchPharmaQuestionsSuccess(state, action) {
      state.data = action.payload;
      state.loading = false;
    },
    fetchPharmaQuestionsFailure(state, action) {
      state.error = action.payload;
      state.loading = false;
    },
    resetPharmaQuestions(state) {
      state.data = null;
      state.loading = false;
      state.error = null;
    },
  },
});

export const { resetPharmaQuestions } = pharmaQuestionsSlice.actions;

export const fetchAllQuestionFromBigQuery =
  (id: string) => async (dispatch, getState) => {
    const { pharmaQuestions } = getState();
    if (pharmaQuestions.loading) {
      return;
    }

    dispatch(pharmaQuestionsSlice.actions.fetchPharmaQuestionsStart());
    try {
      const isDemo = process.env.REACT_APP_FIREBASE_CONFIG === "demo";
      let details: any = null;

      if (!isDemo) {
        try {
          const result = await getAllQuestionsForOrder(id);
          details = result["details"];
        } catch {
          // API failed — fall through to BQ
        }
      }

      if (!details || Object.keys(details).length === 0) {
        const row = await fetchBqRecordByIdentifier(id);
        if (row?.questionnaire) {
          details = row.questionnaire;
        }
      }

      if (details && Object.keys(details).length > 0) {
        logDataToConsole("All questions for order", details);
        const modifiedQuestion = mergeQuestions(details["questions"]);
        const data = { ...details, questions: modifiedQuestion };
        dispatch(
          pharmaQuestionsSlice.actions.fetchPharmaQuestionsSuccess(data),
        );
      } else {
        dispatch(
          pharmaQuestionsSlice.actions.fetchPharmaQuestionsSuccess(null),
        );
      }
    } catch (error) {
      dispatch(
        pharmaQuestionsSlice.actions.fetchPharmaQuestionsFailure(
          "Error fetching questions",
        ),
      );
    }
  };

const mergeQuestions = (questions: PharmaQuestionModel[]) => {
  const mergedQuestions: PharmaQuestionModel[] = [];

  questions.forEach((question) => {
    const index = mergedQuestions.findIndex(
      (q) => q.question === question.question,
    );

    if (index === -1) {
      mergedQuestions.push({ ...question });
    } else {
      const mergedQuestion = mergedQuestions[index];
      const type = question.type;
      const response = question?.answer ?? "";

      if (type === "multi-choice") {
        mergedQuestion.combined_answer = {
          multiChoiceAnswer: response,
          subjectiveAnswer: mergedQuestion.answer ?? "",
        };
      } else if (type === "subjective") {
        mergedQuestion.combined_answer = {
          multiChoiceAnswer: mergedQuestion.answer ?? "",
          subjectiveAnswer: response,
        };
      }
      mergedQuestion.type = "combined";
    }
  });

  return mergedQuestions;
};

export default pharmaQuestionsSlice.reducer;
