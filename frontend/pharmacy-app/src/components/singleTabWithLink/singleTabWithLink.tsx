import { NavLink } from "react-router-dom";

export interface SingleTabWithLinkProps {
  defaultIcon?: React.ReactNode;
  selectedIcon?: React.ReactNode;
  label: string;
  id: string;
}
const SingleTabWithLink = (props: SingleTabWithLinkProps) => {
  return (
    <NavLink
      to={props.id}
      className={({ isActive }) =>
        isActive
          ? "nav-active flex flex-col items-center"
          : "nav-inactive flex flex-col items-center"
      }
    >
      {({ isActive }) => (
        <div className="flex flex-col items-center">
          <div className="icon-container flex h-9 w-9 items-center justify-center rounded-md hover:bg-[#FFFFFF26]">
            {isActive ? props.selectedIcon : props.defaultIcon}
          </div>
          <div className={`label mt-1 text-center text-tiny`}>
            {props.label}
          </div>
        </div>
      )}
    </NavLink>
  );
};

export default SingleTabWithLink;
