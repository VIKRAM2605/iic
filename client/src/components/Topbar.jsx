import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { getAuthUser } from "../utils/auth";

export default function Topbar() {
  const location = useLocation();
  const user = useMemo(() => getAuthUser(), []);

  const sectionTitle = useMemo(() => {
    if (location.pathname.startsWith("/admin/dashboard")) {
      return "Admin Dashboard";
    }

    if (location.pathname.startsWith("/admin/review")) {
      return "Event Review";
    }

    if (location.pathname.startsWith("/admin/ideas")) {
      return "Idea Dashboard";
    }

    if (location.pathname.startsWith("/admin/idea-review")) {
      return "Idea Review";
    }

    if (location.pathname.startsWith("/admin/prototypes")) {
      return "Prototype Dashboard";
    }

    if (location.pathname.startsWith("/admin/prototype-review")) {
      return "Prototype Review";
    }

    if (location.pathname.startsWith("/teacher/dashboard")) {
      return "Teacher Dashboard";
    }

    if (location.pathname.startsWith("/teacher/ideas")) {
      return "Teacher Ideas";
    }

    if (location.pathname.startsWith("/teacher/prototypes")) {
      return "Teacher Prototypes";
    }

    if (location.pathname.startsWith("/eventdetails")) {
      return "Event Form";
    }

    if (location.pathname.startsWith("/event/")) {
      return "Event Details";
    }

    if (location.pathname.startsWith("/ideadetails")) {
      return "Idea Form";
    }

    if (location.pathname.startsWith("/idea/")) {
      return "Idea Details";
    }

    if (location.pathname.startsWith("/prototype/")) {
      return "Prototype Details";
    }

    if (location.pathname.startsWith("/prototypedetails")) {
      return "Prototype Form";
    }

    return "Dashboard";
  }, [location.pathname]);

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6" style={{boxShadow: '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)'}}>
      <div className="flex items-center gap-3 text-sm text-gray-600">
        <span className="text-primary font-semibold">{user?.roleName || "User"}</span>
        <span className="text-gray-300">/</span>
        <span className="font-semibold text-gray-800">{sectionTitle}</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center">
            <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-sm text-gray-600">
            <span className="font-semibold text-gray-800">{user?.name || "User"}</span>
          </span>
        </div>
      </div>
    </header>
  );
}
