import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CirclePlus } from "lucide-react";
import { getFacultyMyIdeas } from "../../../config/api";
import Alert from "../../components/Alert";
import SearchableSelect from "../../components/SearchableSelect";
import { getAuthToken } from "../../utils/auth";

const statusBadgeClass = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const getEventDateLabel = (eventItem) => {
  if (eventItem.fromDate && eventItem.toDate) {
    return `${eventItem.fromDate} to ${eventItem.toDate}`;
  }

  if (eventItem.fromDate) {
    return eventItem.fromDate;
  }

  return "-";
};

export default function TeacherIdeasDashboard() {
  const token = useMemo(() => getAuthToken(), []);
  const location = useLocation();
  const [events, setEvents] = useState([]);
  const [quarterFilter, setQuarterFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [alertState, setAlertState] = useState({ isOpen: false, message: "", severity: "info" });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const payload = await getFacultyMyIdeas(token);
        setEvents(payload.data || []);
      } catch (error) {
        setAlertState({
          isOpen: true,
          message: error.message || "Failed to fetch your ideas.",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token]);

  const quarterOptions = useMemo(() => {
    return Array.from(new Set(events.map((eventItem) => eventItem.quarter).filter(Boolean))).sort((left, right) =>
      String(left).localeCompare(String(right))
    );
  }, [events]);

  const statusOptions = useMemo(() => {
    return Array.from(new Set(events.map((eventItem) => eventItem.status).filter(Boolean)));
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((eventItem) => {
      if (quarterFilter && eventItem.quarter !== quarterFilter) {
        return false;
      }

      if (statusFilter && eventItem.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [events, quarterFilter, statusFilter]);

  const handleReset = () => {
    setQuarterFilter("");
    setStatusFilter("");
  };

  const fromPath = `${location.pathname}${location.search}`;

  return (
    <section className="-m-6 min-h-[calc(100vh-4rem)] bg-white">
      <div className="border-b border-gray-200 px-6 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-[28px]">Ideas Dashboard</h1>
            <p className="text-sm text-[#7a80a6] sm:text-base">Track and manage your ideas submissions</p>
          </div>

          <Link
            to="/ideadetails"
            className="inline-flex w-fit items-center gap-2 rounded-xl bg-primary px-5 py-3 text-base font-semibold text-white transition-all duration-200 hover:opacity-90"
            style={{ boxShadow: "0 10px 20px -10px rgba(125, 83, 246, 0.6)" }}
          >
            <CirclePlus size={18} strokeWidth={2.25} />
            <span>New Ideas</span>
          </Link>
        </div>
      </div>
      <div className="grid gap-4 border-b border-gray-200 px-6 py-5 md:grid-cols-2 xl:grid-cols-4">
        <SearchableSelect
          label="Quarter"
          value={quarterFilter}
          onChange={setQuarterFilter}
          options={quarterOptions}
          emptyLabel="All Quarters"
        />

        <SearchableSelect
          label="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={statusOptions}
          emptyLabel="All Statuses"
        />

        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Reset
          </button>
        </div>

        <div className="flex items-end justify-end">
          <span className="rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary">
            {filteredEvents.length} ideas
          </span>
        </div>
      </div>

      <div className="px-6 py-5">
        {!loading && filteredEvents.length === 0 && (
          <div className="rounded-md border border-gray-200 p-6 text-center text-sm text-gray-500">No ideas found.</div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredEvents.map((eventItem) => (
            <Link
              to={`/idea/${eventItem.id}`}
              state={{ from: fromPath }}
              key={eventItem.id}
              className="rounded-md border border-gray-200 bg-white p-4 transition-colors hover:border-primary"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="line-clamp-1 text-base font-semibold text-gray-900">{eventItem.eventName || `Idea #${eventItem.id}`}</h3>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                    statusBadgeClass[eventItem.status] || "bg-gray-100 text-gray-700"
                  }`}
                >
                  {eventItem.status || "pending"}
                </span>
              </div>

              <p className="mt-3 line-clamp-3 text-sm text-gray-700">{eventItem.majorReason || "No major reason provided."}</p>

              <div className="mt-4 space-y-1 text-xs text-gray-600">
                <p><span className="font-semibold">Quarter:</span> {eventItem.quarter || "-"}</p>
                <p><span className="font-semibold">Date:</span> {getEventDateLabel(eventItem)}</p>
                <p><span className="font-semibold">Rejection Msg:</span> {eventItem.rejectionMessage || "-"}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <Alert
        isOpen={alertState.isOpen}
        onClose={() => setAlertState((previous) => ({ ...previous, isOpen: false }))}
        severity={alertState.severity}
        message={alertState.message}
      />
    </section>
  );
}


