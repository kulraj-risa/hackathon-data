export interface PharmaQuestionModel {
  answer?: string;
  api_response?: ApiResponseModel;
  options?: string[];
  question?: string;
  type?: string;
  combined_answer?: CombinedAnswerModel;
  isDiffData?: boolean;
  isMissingData?: boolean;
  isNewData?: boolean;
  isAnswerChanged?: boolean;
  tag?: string;
}

export interface ApiResponseModel {
  answer?: string;
  facts?: FactsModel;
}

export interface FactsModel {
  contradictory_facts?: string[];
  supportive_facts?: string[];
}

export interface PharmaQuestionsModel {
  identifier?: string;
  created_at?: string;
  document_name?: string;
  file_path?: string;
  questions?: PharmaQuestionModel[];
}

export interface CombinedAnswerModel {
  subjectiveAnswer?: string;
  multiChoiceAnswer?: string;
}
