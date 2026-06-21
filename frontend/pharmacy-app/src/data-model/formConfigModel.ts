import { FormField } from "./pharmaPaFormModel";

export interface FormConfigModel {
  id: string;
  created_at: string;
  updated_at: string;
  updated_by: string;
  data: {
    formTitle: string;
    drugName?: string;
    providerName?: string;
    fields: FormField[];
  };
}
