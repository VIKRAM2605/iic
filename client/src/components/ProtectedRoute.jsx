import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAuthenticated } from "../utils/auth";

export default function ProtectedRoute() {
  const location = useLocation();
  if (!isAuthenticated()) {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "post-login-redirect",
        `${location.pathname}${location.search}`
      );
    }
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return <Outlet />;
}
