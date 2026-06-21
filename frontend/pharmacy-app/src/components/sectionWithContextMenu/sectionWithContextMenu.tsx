import ThreeDotIconWithContextMenu from "../threeDotsWithContextMenu/threeDotsWithContextMenu";

interface SectionWithContextMenuProps {
  menuOptions?: {
    key: string;
    label: string;
    onClick: (arg?: any) => void | Promise<void>;
    color?: string;
  }[];
  id?: string;
  title?: string;
  onSectionClick?: () => void;
}

const SectionWithContextMenu = (props: SectionWithContextMenuProps) => {
  const menuOptions = props.menuOptions ?? [];
  return (
    <div className="section-with-context-menu--container flex items-center justify-between border border-primaryGray-16 bg-primaryGray-16 p-3">
      <div
        className="sectioc-header--label cursor-pointer text-h11 font-semibold text-primaryGray-1 hover:underline"
        onClick={(e) => {
          e.stopPropagation();
          props.onSectionClick?.();
        }}
      >
        {props.title || "Section"}
      </div>
      <div className="section-header--action">
        <ThreeDotIconWithContextMenu
          menuData={menuOptions}
          className="rotate-90"
        />
      </div>
    </div>
  );
};

export default SectionWithContextMenu;
