import ChevronDown from "../../../../svg/chevron-down";

interface ExpandableRowIconCellProps {
  value: {
    borderColor?: string;
    borderWidth?: number;
    id?: string;
    isExpanded?: boolean;
  };
  onRowExpandChange?: (expanded: boolean, id: string) => void;
}

const ExpandableRowIconCell = (props: ExpandableRowIconCellProps) => {
  const expanded = props.value?.isExpanded ?? false;
  const handleToggle = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const newExpanded = !expanded;
    props.onRowExpandChange?.(newExpanded, props.value?.id ?? "");
  };
  return (
    <div
      className={`flex h-full w-full items-center justify-center`}
      style={{
        borderColor: `${props.value.borderColor}`,
        borderLeftWidth: props.value.borderWidth,
        transition: "border-color 0.3s ease",
      }}
      onClick={handleToggle}
    >
      <ChevronDown
        rotate={!expanded ? 0 : -180}
        height={18}
        width={18}
        strokeWidth={1.55}
      />
    </div>
  );
};

export default ExpandableRowIconCell;
