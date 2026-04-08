import { Navigate, Outlet, useLocation } from "react-router-dom";
import { hasAnyRole, isAuthenticated } from "../utils/auth";

export default function RoleProtectedRoute({ allowedRoles = [] }) {
  const location = useLocation();
  if (!isAuthenticated()) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  if (!hasAnyRole(allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
