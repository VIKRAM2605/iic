import { useState, useMemo } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Building2,
  CheckSquare,
  ChevronDown,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import { logoutUser } from "../../config/api";
import { clearAuthSession, getAuthToken, getAuthUser } from "../utils/auth";

function linkClassName({ isActive }) {
  return [
    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
    isActive
      ? "bg-primary text-white shadow-md"
      : "text-gray-700 hover:bg-gray-200/50 hover:text-gray-900",
  ].join(" ");
}

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useMemo(() => getAuthUser(), []);
  const isAdmin = user?.roleName === "admin";
  const isFaculty = user?.roleName === "faculty";
  const [expandedSection, setExpandedSection] = useState("Review Panel");

  const adminSections = [
    {
      label: "Activities & Events",
      icon: LayoutDashboard,
      to: "/admin/dashboard",
      isActive:
        location.pathname.startsWith("/admin/dashboard") ||
        location.pathname.startsWith("/eventdetails"),
      children: [],
    },
    {
      label: "Idea / PoC Repository",
      icon: LayoutDashboard,
      to: "/admin/ideas",
      isActive:
        location.pathname.startsWith("/admin/ideas") ||
        location.pathname.startsWith("/ideadetails"),
      children: [],
    },
    {
      label: "Innovation / Prototype Repository",
      icon: LayoutDashboard,
      to: "/admin/prototypes",
      isActive:
        location.pathname.startsWith("/admin/prototypes") ||
        location.pathname.startsWith("/prototypedetails"),
      children: [],
    },
    {
      label: "Review Panel",
      icon: CheckSquare,
      to: null,
      isActive:
        location.pathname.startsWith("/admin/review") ||
        location.pathname.startsWith("/admin/idea-review") ||
        location.pathname.startsWith("/admin/prototype-review"),
      children: [
        { label: "Event Reviews", icon: CheckSquare, to: "/admin/review" },
        {
          label: "Idea & PoC Reviews",
          icon: CheckSquare,
          to: "/admin/idea-review",
        },
        {
          label: "Prototype Reviews",
          icon: CheckSquare,
          to: "/admin/prototype-review",
        },
      ],
    },
  ];

  const facultySections = [
    {
      label: "Activities & Events",
      icon: LayoutDashboard,
      to: "/teacher/dashboard",
      isActive: location.pathname.startsWith("/teacher/dashboard"),
      children: [],
    },
    {
      label: "Idea / PoC Repository",
      icon: LayoutDashboard,
      to: "/teacher/ideas",
      isActive: location.pathname.startsWith("/teacher/ideas"),
      children: [],
    },
    {
      label: "Innovation / Prototype Repository",
      icon: LayoutDashboard,
      to: "/teacher/prototypes",
      isActive: location.pathname.startsWith("/teacher/prototypes"),
      children: [],
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
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <h1 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <Building2 size={20} className="text-primary" aria-hidden="true" />
          <span>BIT IIC</span>
        </h1>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <p className="px-3 text-xs font-semibold uppercase tracking-widest text-gray-500">
          Navigation
        </p>
        <ul className="mt-3 space-y-1">
          {isAdmin &&
            adminSections.map((section) => {
              const SectionIcon = section.icon;

              return (
                <li key={section.label} className="space-y-1">
                  {section.to ? (
                    <NavLink
                      to={section.to}
                      className={() =>
                        linkClassName({ isActive: section.isActive })
                      }
                    >
                      <SectionIcon
                        size={18}
                        aria-hidden="true"
                        className="flex-shrink-0"
                      />
                      <span>{section.label}</span>
                    </NavLink>
                  ) : (
                    <button
                      type="button"
                      className={linkClassName({
                        isActive:
                          section.isActive || expandedSection === section.label,
                      })}
                      onClick={() =>
                        setExpandedSection(
                          expandedSection === section.label
                            ? ""
                            : section.label,
                        )
                      }
                    >
                      <SectionIcon
                        size={18}
                        aria-hidden="true"
                        className="flex-shrink-0"
                      />
                      <span className="flex-1 text-left">{section.label}</span>
                      {section.children.length > 0 && (
                        <ChevronDown
                          size={16}
                          aria-hidden="true"
                          className={`flex-shrink-0 transition-transform duration-200 ${
                            expandedSection === section.label
                              ? "rotate-180"
                              : ""
                          }`}
                        />
                      )}
                    </button>
                  )}

                  {(section.children.length === 0 ||
                    expandedSection === section.label) && (
                    <ul className="space-y-1 border-l-2 border-gray-200 pl-5 ml-2">
                      {section.children.map((item) => {
                        const ItemIcon = item.icon;

                        return (
                          <li key={item.label}>
                            <NavLink to={item.to} className={linkClassName}>
                              <ItemIcon
                                size={16}
                                aria-hidden="true"
                                className="flex-shrink-0 text-primary"
                              />
                              <span>{item.label}</span>
                            </NavLink>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}

          {isFaculty &&
            facultySections.map((section) => {
              const SectionIcon = section.icon;

              return (
                <li key={section.label} className="space-y-1">
                  <NavLink
                    to={section.to}
                    className={() =>
                      linkClassName({ isActive: section.isActive })
                    }
                  >
                    <SectionIcon
                      size={18}
                      aria-hidden="true"
                      className="flex-shrink-0"
                    />
                    <span>{section.label}</span>
                  </NavLink>

                  <ul className="space-y-1 border-l-2 border-gray-200 pl-5 ml-2">
                    {section.children.map((item) => {
                      const ItemIcon = item.icon;

                      return (
                        <li key={item.label}>
                          <NavLink to={item.to} className={linkClassName}>
                            <ItemIcon
                              size={16}
                              aria-hidden="true"
                              className="flex-shrink-0 text-primary"
                            />
                            <span>{item.label}</span>
                          </NavLink>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
        </ul>
      </nav>

      <div className="border-t border-gray-200 p-3">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-all duration-200 hover:bg-red-50 hover:text-red-700 active:scale-95"
        >
          <LogOut size={16} aria-hidden="true" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
