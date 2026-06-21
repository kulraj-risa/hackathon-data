import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store/store";
import ErrorPage from "../errorPage/errorPage";

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({
  children,
}) => {
  const { data: providerDetails } = useSelector(
    (state: RootState) => state.providerDetails,
  );

  // Check if user is admin
  if (!providerDetails?.IsAdmin) {
    return <ErrorPage />;
  }

  return <>{children}</>;
};

export default ProtectedAdminRoute;
