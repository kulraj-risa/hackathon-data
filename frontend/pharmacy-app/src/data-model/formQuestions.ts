import { Checklist } from "risa-data-model";

export interface SingleQuestionModel {
  cpt_code?: string;
  created_at?: string;
  id?: string;
  order_id?: string;
  status?: string;
  value?: Checklist[];
}

export interface FormQuestions {
  questions: SingleQuestionModel;
}
