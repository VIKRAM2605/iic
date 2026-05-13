import { Navigate, Route, Routes } from "react-router-dom";
import Applayout from "./applayout/Applayout";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import AdminApprovedDashboard from "./pages/admin/AdminApprovedDashboard";
import AdminEventReview from "./pages/admin/AdminEventReview";
import AdminIdeaApprovedDashboard from "./pages/admin/AdminIdeaApprovedDashboard";
import AdminIdeaReview from "./pages/admin/AdminIdeaReview";
import AdminPrototypeApprovedDashboard from "./pages/admin/AdminPrototypeApprovedDashboard";
import AdminPrototypeReview from "./pages/admin/AdminPrototypeReview";
import AdminBusinessApprovedDashboard from "./pages/admin/AdminBusinessApprovedDashboard";
import AdminBusinessReview from "./pages/admin/AdminBusinessReview";
import AdminIicAppliedApprovedDashboard from "./pages/admin/AdminIicAppliedApprovedDashboard";
import AdminIicAppliedReview from "./pages/admin/AdminIicAppliedReview";
import AdminRdCellActivitiesApprovedDashboard from "./pages/admin/AdminRdCellActivitiesApprovedDashboard";
import AdminRdCellActivitiesReview from "./pages/admin/AdminRdCellActivitiesReview";
import AdminRdFacilitiesServicesApprovedDashboard from "./pages/admin/AdminRdFacilitiesServicesApprovedDashboard";
import AdminRdFacilitiesServicesReview from "./pages/admin/AdminRdFacilitiesServicesReview";
import AdminRdEquipmentsServicesApprovedDashboard from "./pages/admin/AdminRdEquipmentsServicesApprovedDashboard";
import AdminRdEquipmentsServicesReview from "./pages/admin/AdminRdEquipmentsServicesReview";
import AdminRdCellApprovedDashboard from "./pages/admin/AdminRdCellApprovedDashboard";
import AdminRdCellReview from "./pages/admin/AdminRdCellReview";
import AdminRdProjectsOutputsApprovedDashboard from "./pages/admin/AdminRdProjectsOutputsApprovedDashboard";
import AdminRdProjectsOutputsReview from "./pages/admin/AdminRdProjectsOutputsReview";
import BusinessOverview from "./pages/admin/BusinessDetails";
import IicAppliedDetails from "./pages/admin/IicAppliedDetails";
import BusinessDetailsForm from "./pages/teacher/BusinessDetails";
import RdEquipmentsServiceDetails from "./pages/admin/RdEquipmentsServiceDetails";
import RdCellActivityDetails from "./pages/admin/RdCellActivityDetails";
import RdFacilitiesServiceDetails from "./pages/admin/RdFacilitiesServiceDetails";
import RdCellNominationDetails from "./pages/admin/RdCellNominationDetails";
import RdProjectsOutputDetails from "./pages/admin/RdProjectsOutputDetails";
import TeacherBusinessDashboard from "./pages/admin/TeacherBusinessDashboard";
import EventDetails from "./pages/admin/EventDetails";
import EventOverview from "./pages/admin/EventOverview";
import IdeaDetails from "./pages/admin/IdeaDetails";
import IdeaOverview from "./pages/admin/IdeaOverview";
import PrototypeDetails from "./pages/admin/PrototypeDetails";
import PrototypeOverview from "./pages/admin/PrototypeOverview";
import Login from "./pages/admin/Login";
import TeacherIicAppliedDashboard from "./pages/admin/TeacherIicAppliedDashboard";
import TeacherEventsDashboard from "./pages/admin/TeacherEventsDashboard";
import TeacherRdCellActivitiesDashboard from "./pages/admin/TeacherRdCellActivitiesDashboard";
import TeacherRdEquipmentsServicesDashboard from "./pages/admin/TeacherRdEquipmentsServicesDashboard";
import TeacherRdFacilitiesServicesDashboard from "./pages/admin/TeacherRdFacilitiesServicesDashboard";
import TeacherIdeasDashboard from "./pages/admin/TeacherIdeasDashboard";
import TeacherRdProjectsOutputsDashboard from "./pages/admin/TeacherRdProjectsOutputsDashboard";
import TeacherPrototypesDashboard from "./pages/admin/TeacherPrototypesDashboard";
import TeacherRdCellDashboard from "./pages/admin/TeacherRdCellDashboard";
import Unauthorized from "./pages/admin/Unauthorized";
import IicAppliedForm from "./pages/teacher/IicAppliedForm";
import RdEquipmentsServicesForm from "./pages/teacher/RdEquipmentsServicesForm";
import RdCellActivityForm from "./pages/teacher/RdCellActivityForm";
import RdFacilitiesServicesForm from "./pages/teacher/RdFacilitiesServicesForm";
import RdCellNominationForm from "./pages/teacher/RdCellNominationForm";
import RdProjectsOutputsForm from "./pages/teacher/RdProjectsOutputsForm";

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
            <Route path="/prototypedetails" element={<PrototypeDetails />} />
            <Route path="/prototype/:prototypeId" element={<PrototypeOverview />} />
            <Route path="/businessdetails" element={<BusinessDetailsForm />} />
            <Route path="/teacher/businessdetails" element={<BusinessDetailsForm />} />
            <Route path="/business/:businessId" element={<BusinessOverview />} />
            <Route path="/iicapplied" element={<IicAppliedForm />} />
            <Route path="/teacher/iicapplied" element={<IicAppliedForm />} />
            <Route path="/iic-applied/:appliedId" element={<IicAppliedDetails />} />
            <Route path="/rdcellactivities" element={<RdCellActivityForm />} />
            <Route path="/teacher/rdcellactivities" element={<RdCellActivityForm />} />
            <Route
              path="/rd-cell-activity/:activityId"
              element={<RdCellActivityDetails />}
            />
            <Route path="/rdcellnominations" element={<RdCellNominationForm />} />
            <Route path="/teacher/rdcellnominations" element={<RdCellNominationForm />} />
            <Route
              path="/rd-cell-nomination/:nominationId"
              element={<RdCellNominationDetails />}
            />
            <Route path="/rdfacilitiesservices" element={<RdFacilitiesServicesForm />} />
            <Route
              path="/teacher/rdfacilitiesservices"
              element={<RdFacilitiesServicesForm />}
            />
            <Route
              path="/rd-facility-service/:facilityId"
              element={<RdFacilitiesServiceDetails />}
            />
            <Route path="/rdequipmentsservices" element={<RdEquipmentsServicesForm />} />
            <Route
              path="/teacher/rdequipmentsservices"
              element={<RdEquipmentsServicesForm />}
            />
            <Route
              path="/rd-equipment-service/:equipmentId"
              element={<RdEquipmentsServiceDetails />}
            />
            <Route path="/rdprojectsoutputs" element={<RdProjectsOutputsForm />} />
            <Route
              path="/teacher/rdprojectsoutputs"
              element={<RdProjectsOutputsForm />}
            />
            <Route
              path="/rd-project-output/:projectId"
              element={<RdProjectsOutputDetails />}
            />
          </Route>

          <Route element={<RoleProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="/admin/dashboard" element={<AdminApprovedDashboard />} />
            <Route path="/admin/review" element={<AdminEventReview />} />
            <Route path="/admin/ideas" element={<AdminIdeaApprovedDashboard />} />
            <Route path="/admin/idea-review" element={<AdminIdeaReview />} />
            <Route path="/admin/prototypes" element={<AdminPrototypeApprovedDashboard />} />
            <Route path="/admin/prototype-review" element={<AdminPrototypeReview />} />
            <Route path="/admin/businesses" element={<AdminBusinessApprovedDashboard />} />
            <Route path="/admin/business-review" element={<AdminBusinessReview />} />
            <Route path="/admin/iic-applied" element={<AdminIicAppliedApprovedDashboard />} />
            <Route path="/admin/iic-applied-review" element={<AdminIicAppliedReview />} />
            <Route
              path="/admin/rd-cell-activities"
              element={<AdminRdCellActivitiesApprovedDashboard />}
            />
            <Route
              path="/admin/rd-cell-activities-review"
              element={<AdminRdCellActivitiesReview />}
            />
            <Route
              path="/admin/rd-cell-nominations"
              element={<AdminRdCellApprovedDashboard />}
            />
            <Route path="/admin/rd-cell-review" element={<AdminRdCellReview />} />
            <Route
              path="/admin/rd-facilities-services"
              element={<AdminRdFacilitiesServicesApprovedDashboard />}
            />
            <Route
              path="/admin/rd-facilities-services-review"
              element={<AdminRdFacilitiesServicesReview />}
            />
            <Route
              path="/admin/rd-equipments-services"
              element={<AdminRdEquipmentsServicesApprovedDashboard />}
            />
            <Route
              path="/admin/rd-equipments-services-review"
              element={<AdminRdEquipmentsServicesReview />}
            />
            <Route
              path="/admin/rd-projects-outputs"
              element={<AdminRdProjectsOutputsApprovedDashboard />}
            />
            <Route
              path="/admin/rd-projects-outputs-review"
              element={<AdminRdProjectsOutputsReview />}
            />
          </Route>

          <Route element={<RoleProtectedRoute allowedRoles={["faculty"]} />}>
            <Route path="/teacher/dashboard" element={<TeacherEventsDashboard />} />
            <Route path="/teacher/ideas" element={<TeacherIdeasDashboard />} />
            <Route path="/teacher/prototypes" element={<TeacherPrototypesDashboard />} />
            <Route path="/teacher/businesses" element={<TeacherBusinessDashboard />} />
            <Route path="/teacher/iic-applied" element={<TeacherIicAppliedDashboard />} />
            <Route
              path="/teacher/rd-cell-activities"
              element={<TeacherRdCellActivitiesDashboard />}
            />
            <Route
              path="/teacher/rd-cell-nominations"
              element={<TeacherRdCellDashboard />}
            />
            <Route
              path="/teacher/rd-facilities-services"
              element={<TeacherRdFacilitiesServicesDashboard />}
            />
            <Route
              path="/teacher/rd-equipments-services"
              element={<TeacherRdEquipmentsServicesDashboard />}
            />
            <Route
              path="/teacher/rd-projects-outputs"
              element={<TeacherRdProjectsOutputsDashboard />}
            />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;

