export interface BadgeWithIconProps {
  text: string;
  icon?: React.ReactNode;
  onClick?: (id: string) => void;
  textColor?: string;
  bgColor?: string;
  id: string;
  style?: React.CSSProperties;
  priority?: number;
}

export interface BadgeWithIconRoundedProps extends BadgeWithIconProps {
  borderColor?: string;
}
