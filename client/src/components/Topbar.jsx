import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { getAuthUser } from "../utils/auth";

export default function Topbar() {
  const location = useLocation();
  const user = useMemo(() => getAuthUser(), []);

  const sectionTitle = useMemo(() => {
    if (location.pathname.startsWith("/admin/dashboard")) {
      return "Activities & Events";
    }

    if (location.pathname.startsWith("/admin/ideas")) {
      return "Idea / PoC Repository";
    }

    if (location.pathname.startsWith("/admin/idea-review")) {
      return "Idea & PoC Reviews";
    }

    if (location.pathname.startsWith("/admin/prototypes")) {
      return "Innovation / Prototype Repository";
    }

    if (location.pathname.startsWith("/admin/prototype-review")) {
      return "Prototype Reviews";
    }

    if (location.pathname.startsWith("/teacher/dashboard")) {
      return "Activities & Events";
    }

    if (location.pathname.startsWith("/teacher/ideas")) {
      return "Idea / PoC Repository";
    }

    if (location.pathname.startsWith("/teacher/prototypes")) {
      return "Innovation / Prototype Repository";
    }

    if (location.pathname.startsWith("/admin/businesses")) {
      return "Business Model / Startup";
    }

    if (location.pathname.startsWith("/admin/business-review")) {
      return "Startup Reviews";
    }

    if (location.pathname.startsWith("/teacher/businesses")) {
      return "Business Model / Startup";
    }

    if (location.pathname.startsWith("/teacher/businessdetails")) {
      return "Business Submission";
    }

    if (location.pathname.startsWith("/eventdetails")) {
      return "Activities & Events";
    }

    if (location.pathname.startsWith("/event/")) {
      return "Activities & Events";
    }

    if (location.pathname.startsWith("/ideadetails")) {
      return "Idea Submission";
    }

    if (location.pathname.startsWith("/idea/")) {
      return "Idea Details";
    }

    if (location.pathname.startsWith("/prototype/")) {
      return "Prototype Details";
    }

    if (location.pathname.startsWith("/prototypedetails")) {
      return "Prototype Submission";
    }

    if (location.pathname.startsWith("/businessdetails")) {
      return "Business Submission";
    }

    if (location.pathname.startsWith("/business/")) {
      return "Business Details";
    }

    return "Dashboard";
  }, [location.pathname]);

  return (
    <header
      className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-8 sticky top-0 z-10"
      style={{ boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)" }}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-primary bg-primary-light px-3 py-1 rounded-full">
          {user?.roleName?.toUpperCase() || "USER"}
        </span>
        <svg
          className="w-1 h-1 text-gray-300"
          fill="currentColor"
          viewBox="0 0 4 4"
        >
          <circle cx="2" cy="2" r="2" />
        </svg>
        <span className="text-base font-semibold text-slate-900">
          {sectionTitle}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-sm">
            <svg
              className="w-5 h-5 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-900">
              {user?.name || "User"}
            </span>
            <span className="text-xs text-gray-500">
              {user?.roleName || "Role"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
