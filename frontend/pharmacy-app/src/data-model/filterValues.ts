export interface FilterValues {
  name: string;
  values: {
    [key: string]: {
      values: string[];
      valuesLabel?: string[];
      label?: string;
      type: "string" | "number" | "date";
    };
  };
  filterCount: number;
}

export interface Option {
  label: string;
  value: string;
}

export interface FilterSection {
  id: string;
  label: string;
  options: Option[];
  type?: "string" | "number" | "date";
}
