export interface MenuItemProps {
  label?: string;
  onEditClick?: () => void;
  onAddClick?: () => void;
  onDeleteClick?: () => void;
  onClick?: () => void;
  color?: string;
  className?: string;
}

const MenuItem: React.FC<MenuItemProps> = ({
  label,
  onEditClick,
  onAddClick,
  onDeleteClick,
  onClick,
  color = "text-primaryGray-1",
  className = "",
}) => {
  return (
    <div
      className={`flex cursor-pointer items-center gap-2 px-3 py-2 transition-colors duration-200 hover:font-bold ${color} ${className}`}
      onClick={onClick}
    >
      <span className="text-sm hover:font-bold">{label}</span>
    </div>
  );
};

interface MenuItemsListProps {
  items: MenuItemProps[];
  className?: string;
}

const MenuItemsList: React.FC<MenuItemsListProps> = ({
  items,
  className = "",
}) => {
  return (
    <div
      className={`rounded-md border border-primaryGray-16 bg-white shadow-lg ${className}`}
    >
      {items.map((item, index) => (
        <MenuItem key={index} {...item} />
      ))}
    </div>
  );
};

export { MenuItem, MenuItemsList };
