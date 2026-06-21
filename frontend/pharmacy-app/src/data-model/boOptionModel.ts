export interface BOOptionModel {
  label: string;
  value: string;
  priority?: number;
}

export interface BOOptionModelResponse {
  data: BOOptionModel[];
}
