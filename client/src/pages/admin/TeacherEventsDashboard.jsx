import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CirclePlus } from "lucide-react";
import { getFacultyMyEvents } from "../../../config/api";
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

export default function TeacherEventsDashboard() {
  const token = useMemo(() => getAuthToken(), []);
  const location = useLocation();
  const [events, setEvents] = useState([]);
  const [quarterFilter, setQuarterFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [alertState, setAlertState] = useState({
    isOpen: false,
    message: "",
    severity: "info",
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const payload = await getFacultyMyEvents(token);
        setEvents(payload.data || []);
      } catch (error) {
        setAlertState({
          isOpen: true,
          message: error.message || "Failed to fetch your events.",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token]);

  const quarterOptions = useMemo(() => {
    return Array.from(
      new Set(events.map((eventItem) => eventItem.quarter).filter(Boolean)),
    ).sort((left, right) => String(left).localeCompare(String(right)));
  }, [events]);

  const statusOptions = useMemo(() => {
    return Array.from(
      new Set(events.map((eventItem) => eventItem.status).filter(Boolean)),
    );
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
    <section className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="border-b border-gray-200 bg-white px-8 py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h1 className="heading-xl">My Events</h1>
            <p className="text-muted">
              Record a new IIC activity or event you participated in
            </p>
          </div>

          <Link
            to="/eventdetails"
            className="btn-primary-custom inline-flex items-center gap-2 whitespace-nowrap"
          >
            <CirclePlus size={18} strokeWidth={2.25} />
            <span>New Events</span>
          </Link>
        </div>
      </div>

      <div className="border-b border-gray-200 bg-white px-8 py-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-900">
              Actions
            </label>
            <button
              type="button"
              onClick={handleReset}
              className="btn-secondary-custom"
            >
              Reset Filters
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-900">
              Results
            </label>
            <span className="badge-primary mt-0.5">
              {filteredEvents.length} event
              {filteredEvents.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      <div className="px-8 py-8">
        {!loading && filteredEvents.length === 0 && (
          <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
            <p className="text-base text-gray-600 font-medium">
              No events found.
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Try adjusting your filters or create a new event.
            </p>
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredEvents.map((eventItem) => (
            <Link
              to={`/event/${eventItem.id}`}
              state={{ from: fromPath }}
              key={eventItem.id}
              className="card-custom group"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-semibold text-slate-900 group-hover:text-primary transition-colors line-clamp-1">
                  {eventItem.eventName || `Event #${eventItem.id}`}
                </h3>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize flex-shrink-0 ${
                    statusBadgeClass[eventItem.status] ||
                    "bg-gray-100 text-gray-700"
                  }`}
                >
                  {eventItem.status || "pending"}
                </span>
              </div>

              <p className="mt-3 text-sm text-gray-700 line-clamp-2">
                {eventItem.majorReason || "No major reason provided."}
              </p>

              <div className="mt-5 space-y-2 text-xs text-gray-600 border-t border-gray-100 pt-4">
                <div className="flex justify-between">
                  <span className="font-semibold">Quarter:</span>
                  <span className="text-gray-700">
                    {eventItem.quarter || "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Date:</span>
                  <span className="text-gray-700">
                    {getEventDateLabel(eventItem)}
                  </span>
                </div>
                {eventItem.rejectionMessage && (
                  <div className="flex justify-between">
                    <span className="font-semibold">Rejection:</span>
                    <span className="text-gray-700">
                      {eventItem.rejectionMessage}
                    </span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>

      <Alert
        isOpen={alertState.isOpen}
        onClose={() =>
          setAlertState((previous) => ({ ...previous, isOpen: false }))
        }
        severity={alertState.severity}
        message={alertState.message}
      />
    </section>
  );
}


