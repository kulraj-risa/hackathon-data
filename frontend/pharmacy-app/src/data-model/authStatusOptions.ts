export interface AuthStatusOptionModel {
  text: string;
  icon?: React.ReactNode;
  onClick?: (id: string) => void;
  textColor?: string;
  bgColor?: string;
  id: string;
  style?: React.CSSProperties;
  priority?: number;
}

export interface AuthStatusOptionModelResponse {
  data: AuthStatusOptionModel[];
}
