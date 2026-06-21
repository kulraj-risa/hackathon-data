import { NavLink } from "react-router-dom";

interface SingleTabProps {
  id: string;
  label: string;
  logEvent?: (label: string) => void;
}

const SingleTab = (props: SingleTabProps) => {
  const handleClick = () => {
    props?.logEvent?.(props.label);
  };
  return (
    <>
      <NavLink
        to={props.id}
        className={({ isActive }) =>
          isActive ? "single-tab-content active" : "single-tab-content"
        }
        onClick={handleClick}
      >
        {props.label}
      </NavLink>
    </>
  );
};

export default SingleTab;
