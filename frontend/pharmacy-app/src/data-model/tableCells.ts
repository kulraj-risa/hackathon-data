import { InfoWithContextMenuProps } from "../components/iconWithContextMenu/iconWithContextMenu";
import { ThreeDotIconWithContextMenuProps } from "../components/threeDotsWithContextMenu/threeDotsWithContextMenu";

export interface TableCellMultiline {
  mainText?: string;
  secondaryText?: string;
  hideCopyIcon?: boolean;
}

export interface TableCellForAuthRequired {
  count?: string;
  cptCodesWithStatus?: InfoWithContextMenuProps[] | null;
}

export interface TableCellButtonWithThreeDots {
  label: string;
  buttonId: string;
  disabled: boolean;
  threeDotsOptions?: Array<{
    id: string;
    text: string;
  }>;
  rowId?: string;
  showNavigateArrow?: boolean;
  navigateArrowId?: string;
  showEyeIcon?: boolean;
  eyeIconId?: string;
}

export interface TableCellWithColoredText {
  text?: string;
  color?: string;
}

export interface TableCellWithBadge {
  text?: string;
  color?: string;
  bgColor?: string;
  displayText?: string;
  hoverText?: string;
  onClick?: () => void;
}

export interface TableCellClickableBadgeForOpeningModal {
  text?: string;
  id?: string;
}

export interface TableCellWithImage {
  image: (props: { className?: string }) => JSX.Element;
  contextMenuItems: ThreeDotIconWithContextMenuProps[];
}

export interface TableStringWithBadge {
  stringText: string;
  badgeText: string;
}

export interface TableDataForAssignModal {
  assignee: string;
  id: string;
  assigneeId: string;
}

export interface TableDataForNycbsStatus {
  id: string;
  status: number;
}

export interface TableCellClickableIcon {
  data: any;
  icon?: () => JSX.Element;
}

export interface TableCellWithDisabledStatus {
  data: string;
  status: string;
}

export interface TableCellWithCheckbox {
  id: string;
  label: string;
  isChecked?: boolean;
}

export interface TableCellAddKeyButton {
  value: string;
  isDisabled?: boolean;
  title?: string;
  isSftp?: boolean;
  sftpStatus?: string | null;
}
