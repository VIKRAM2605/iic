import { Navigate, Route, Routes } from "react-router-dom";
import Applayout from "./applayout/Applayout";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import AdminApprovedDashboard from "./pages/admin/AdminApprovedDashboard";
import AdminEventReview from "./pages/admin/AdminEventReview";
import AdminIdeaApprovedDashboard from "./pages/admin/AdminIdeaApprovedDashboard";
import AdminIdeaReview from "./pages/admin/AdminIdeaReview";
import EventDetails from "./pages/admin/EventDetails";
import EventOverview from "./pages/admin/EventOverview";
import IdeaDetails from "./pages/admin/IdeaDetails";
import IdeaOverview from "./pages/admin/IdeaOverview";
import Login from "./pages/admin/Login";
import TeacherEventsDashboard from "./pages/admin/TeacherEventsDashboard";
import TeacherIdeasDashboard from "./pages/admin/TeacherIdeasDashboard";
import Unauthorized from "./pages/admin/Unauthorized";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Applayout />}>
          <Route element={<RoleProtectedRoute allowedRoles={["admin", "faculty"]} />}>
            <Route path="/eventdetails" element={<EventDetails />} />
            <Route path="/event/:eventId" element={<EventOverview />} />
            <Route path="/ideadetails" element={<IdeaDetails />} />
            <Route path="/idea/:ideaId" element={<IdeaOverview />} />
          </Route>

          <Route element={<RoleProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="/admin/dashboard" element={<AdminApprovedDashboard />} />
            <Route path="/admin/review" element={<AdminEventReview />} />
            <Route path="/admin/ideas" element={<AdminIdeaApprovedDashboard />} />
            <Route path="/admin/idea-review" element={<AdminIdeaReview />} />
          </Route>

          <Route element={<RoleProtectedRoute allowedRoles={["faculty"]} />}>
            <Route path="/teacher/dashboard" element={<TeacherEventsDashboard />} />
            <Route path="/teacher/ideas" element={<TeacherIdeasDashboard />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
