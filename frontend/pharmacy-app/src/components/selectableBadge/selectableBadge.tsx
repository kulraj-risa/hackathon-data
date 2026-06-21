import { useSelector } from "react-redux";
import { BadgeWithIconProps } from "../../data-model/badgeWithIconProps";
import { RootState } from "../../redux/store/store";
import BadgeDropdown from "../badgeDropdown/badgeDropdown";

interface SelectableBadgeProps {
  selectedBadge: BadgeWithIconProps | null;
  badgeList: BadgeWithIconProps[];
  onClick: (id: string) => void;
  onValueChange: (value: string) => void;
  rowIndex?: number;
  fieldKey?: string;
  onTableRowUpdate?: (
    rowIndex: number,
    fieldKey: string,
    newValue: any,
  ) => void;
  shouldUsePortal?: boolean;
  onDefaultBadgeClick?: (id: string) => void;
}

const SelectableBadge = (props: SelectableBadgeProps) => {
  const { user } = useSelector(
    (state: RootState) => state.firebaseAuthentication,
  );

  const handleBadgeSelection = (badgeId: string) => {
    const selectedBadge = props.badgeList.find((badge) => badge.id === badgeId);

    if (selectedBadge) {
      props.onClick(badgeId);

      if (props.onValueChange) {
        props.onValueChange(selectedBadge.text);
      }

      if (
        props.onTableRowUpdate &&
        props.fieldKey &&
        typeof props.rowIndex === "number"
      ) {
        const updatedBadgeValue = {
          text: selectedBadge.text,
          color: selectedBadge.textColor,
          bgColor: selectedBadge.bgColor,
          currentStatusId: selectedBadge.id,
        };
        props.onTableRowUpdate(
          props.rowIndex,
          props.fieldKey,
          updatedBadgeValue,
        );
      }
    }
  };

  return (
    <div className="selectable-badge">
      <div className="selectable-badge--icon">
        <BadgeDropdown
          selectedBadge={props.selectedBadge}
          badgeList={props.badgeList}
          onClick={handleBadgeSelection}
          shouldUsePortal={props.shouldUsePortal}
        />
      </div>
    </div>
  );
};

export default SelectableBadge;
