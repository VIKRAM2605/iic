import { useMemo } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
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

function groupLinkClassName(isActive) {
  return [
    "block w-full rounded-md px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-primary-light text-primary"
      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
  ].join(" ");
}

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useMemo(() => getAuthUser(), []);
  const canAccessEventDetails = ["admin", "faculty"].includes(user?.roleName);
  const canAccessIdeaDetails = ["admin", "faculty"].includes(user?.roleName);
  const canAccessPrototypeDetails = ["admin", "faculty"].includes(user?.roleName);
  const isAdmin = user?.roleName === "admin";
  const isFaculty = user?.roleName === "faculty";
  const adminSections = [
    {
      label: "Event Management",
      icon: LayoutDashboard,
      to: "/admin/dashboard",
      isActive:
        location.pathname.startsWith("/admin/dashboard")
        || location.pathname.startsWith("/admin/review")
        || location.pathname.startsWith("/eventdetails"),
      children: [
        { label: "Event Submission", icon: FileSpreadsheet, to: "/eventdetails", isVisible: canAccessEventDetails },
        { label: "Event Evaluation", icon: CheckSquare, to: "/admin/review" },
      ],
    },
    {
      label: "Idea Management",
      icon: LayoutDashboard,
      to: "/admin/ideas",
      isActive:
        location.pathname.startsWith("/admin/ideas")
        || location.pathname.startsWith("/admin/idea-review")
        || location.pathname.startsWith("/ideadetails"),
      children: [
        { label: "Idea Submission", icon: FileSpreadsheet, to: "/ideadetails", isVisible: canAccessIdeaDetails },
        { label: "Idea Evaluation", icon: CheckSquare, to: "/admin/idea-review" },
      ],
    },
    {
      label: "Prototype Management",
      icon: LayoutDashboard,
      to: "/admin/prototypes",
      isActive:
        location.pathname.startsWith("/admin/prototypes")
        || location.pathname.startsWith("/admin/prototype-review")
        || location.pathname.startsWith("/prototypedetails"),
      children: [
        { label: "Prototype Submission", icon: FileSpreadsheet, to: "/prototypedetails", isVisible: canAccessPrototypeDetails },
        { label: "Prototype Evaluation", icon: CheckSquare, to: "/admin/prototype-review" },
      ],
    },
  ];

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
        <ul className="mt-2 space-y-2">
          {isAdmin && adminSections.map((section) => {
            const SectionIcon = section.icon;

            return (
              <li key={section.label} className="space-y-1">
                <NavLink to={section.to} className={() => groupLinkClassName(section.isActive)}>
                  <span className="flex items-center gap-2">
                    <SectionIcon size={16} aria-hidden="true" />
                    <span>{section.label}</span>
                  </span>
                </NavLink>

                <ul className="space-y-1 pl-6">
                  {section.children
                    .filter((item) => item.isVisible ?? true)
                    .map((item) => {
                      const ItemIcon = item.icon;

                      return (
                        <li key={item.label}>
                          <NavLink to={item.to} className={linkClassName}>
                            <span className="flex items-center gap-2">
                              <ItemIcon size={16} aria-hidden="true" />
                              <span>{item.label}</span>
                            </span>
                          </NavLink>
                        </li>
                      );
                    })}
                </ul>
              </li>
            );
          })}

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

          {isFaculty && canAccessEventDetails && (
            <li>
              <NavLink to="/eventdetails" className={linkClassName}>
                <span className="flex items-center gap-2">
                  <FileSpreadsheet size={16} aria-hidden="true" />
                  <span>Event Form</span>
                </span>
              </NavLink>
            </li>
          )}

          {isFaculty && canAccessIdeaDetails && (
            <li>
              <NavLink to="/ideadetails" className={linkClassName}>
                <span className="flex items-center gap-2">
                  <FileSpreadsheet size={16} aria-hidden="true" />
                  <span>Idea Form</span>
                </span>
              </NavLink>
            </li>
          )}

          {isFaculty && canAccessPrototypeDetails && (
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
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
