import { useMemo } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Building2, CheckSquare, FileSpreadsheet, LayoutDashboard, LogOut } from "lucide-react";
import { logoutUser } from "../../config/api";
import { clearAuthSession, getAuthToken, getAuthUser } from "../utils/auth";

function linkClassName({ isActive }) {
  return [
    "block w-full rounded-md px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-primary-light text-primary"
      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
  ].join(" ");
}

export default function Navbar() {
  const navigate = useNavigate();
  const user = useMemo(() => getAuthUser(), []);
  const canAccessEventDetails = ["admin", "faculty"].includes(user?.roleName);
  const canAccessIdeaDetails = ["admin", "faculty"].includes(user?.roleName);
  const canAccessPrototypeDetails = ["admin", "faculty"].includes(user?.roleName);
  const isAdmin = user?.roleName === "admin";
  const isFaculty = user?.roleName === "faculty";

  const handleLogout = async () => {
    const token = getAuthToken();

    try {
      if (token) {
        await logoutUser(token);
      }
    } catch {
    } finally {
      clearAuthSession();
      navigate("/login", { replace: true });
    }
  };

  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-gray-50">
      <div className="flex h-16 items-center border-b border-gray-200 px-4">
        <h1 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Building2 size={18} className="text-gray-700" aria-hidden="true" />
          <span>BIT IIC</span>
        </h1>
      </div>

      <nav className="flex-1 px-3 py-4">
        <p className="px-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Institute</p>
        <ul className="mt-2 space-y-1">
          {isAdmin && (
            <li>
              <NavLink to="/admin/dashboard" className={linkClassName}>
                <span className="flex items-center gap-2">
                  <LayoutDashboard size={16} aria-hidden="true" />
                  <span>Admin Dashboard</span>
                </span>
              </NavLink>
            </li>
          )}

          {isAdmin && (
            <li>
              <NavLink to="/admin/review" className={linkClassName}>
                <span className="flex items-center gap-2">
                  <CheckSquare size={16} aria-hidden="true" />
                  <span>Event Review</span>
                </span>
              </NavLink>
            </li>
          )}

          {isAdmin && (
            <li>
              <NavLink to="/admin/ideas" className={linkClassName}>
                <span className="flex items-center gap-2">
                  <LayoutDashboard size={16} aria-hidden="true" />
                  <span>Idea Dashboard</span>
                </span>
              </NavLink>
            </li>
          )}

          {isAdmin && (
            <li>
              <NavLink to="/admin/idea-review" className={linkClassName}>
                <span className="flex items-center gap-2">
                  <CheckSquare size={16} aria-hidden="true" />
                  <span>Idea Review</span>
                </span>
              </NavLink>
            </li>
          )}

          {isAdmin && (
            <li>
              <NavLink to="/admin/prototypes" className={linkClassName}>
                <span className="flex items-center gap-2">
                  <LayoutDashboard size={16} aria-hidden="true" />
                  <span>Prototype Dashboard</span>
                </span>
              </NavLink>
            </li>
          )}

          {isAdmin && (
            <li>
              <NavLink to="/admin/prototype-review" className={linkClassName}>
                <span className="flex items-center gap-2">
                  <CheckSquare size={16} aria-hidden="true" />
                  <span>Prototype Review</span>
                </span>
              </NavLink>
            </li>
          )}

          {isFaculty && (
            <li>
              <NavLink to="/teacher/dashboard" className={linkClassName}>
                <span className="flex items-center gap-2">
                  <LayoutDashboard size={16} aria-hidden="true" />
                  <span>Teacher Dashboard</span>
                </span>
              </NavLink>
            </li>
          )}

          {isFaculty && (
            <li>
              <NavLink to="/teacher/ideas" className={linkClassName}>
                <span className="flex items-center gap-2">
                  <LayoutDashboard size={16} aria-hidden="true" />
                  <span>Teacher Ideas</span>
                </span>
              </NavLink>
            </li>
          )}

          {isFaculty && (
            <li>
              <NavLink to="/teacher/prototypes" className={linkClassName}>
                <span className="flex items-center gap-2">
                  <LayoutDashboard size={16} aria-hidden="true" />
                  <span>Teacher Prototypes</span>
                </span>
              </NavLink>
            </li>
          )}

          {canAccessEventDetails && (
            <li>
              <NavLink to="/eventdetails" className={linkClassName}>
                <span className="flex items-center gap-2">
                  <FileSpreadsheet size={16} aria-hidden="true" />
                  <span>Event Form</span>
                </span>
              </NavLink>
            </li>
          )}

          {canAccessIdeaDetails && (
            <li>
              <NavLink to="/ideadetails" className={linkClassName}>
                <span className="flex items-center gap-2">
                  <FileSpreadsheet size={16} aria-hidden="true" />
                  <span>Idea Form</span>
                </span>
              </NavLink>
            </li>
          )}

          {canAccessPrototypeDetails && (
            <li>
              <NavLink to="/prototypedetails" className={linkClassName}>
                <span className="flex items-center gap-2">
                  <FileSpreadsheet size={16} aria-hidden="true" />
                  <span>Prototype Form</span>
                </span>
              </NavLink>
            </li>
          )}
        </ul>
      </nav>

      <div className="border-t border-gray-200 p-3">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          <LogOut size={16} aria-hidden="true" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
