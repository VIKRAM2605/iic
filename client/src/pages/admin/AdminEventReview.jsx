import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getAdminReviewQueue } from "../../../config/api";
import Alert from "../../components/Alert";
import SearchableSelect from "../../components/SearchableSelect";
import { getAuthToken } from "../../utils/auth";

const statusBadgeClass = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default function AdminEventReview() {
  const token = useMemo(() => getAuthToken(), []);
  const location = useLocation();
  const [events, setEvents] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [facultyFilter, setFacultyFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [alertState, setAlertState] = useState({ isOpen: false, message: "", severity: "info" });

  const loadQueue = async () => {
    setLoading(true);
    try {
      const payload = await getAdminReviewQueue(token);
      setEvents(payload.data || []);
    } catch (error) {
      setAlertState({
        isOpen: true,
        message: error.message || "Failed to fetch review queue.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, [token]);

  const statusOptions = useMemo(() => {
    return Array.from(new Set(events.map((eventItem) => eventItem.status).filter(Boolean)));
  }, [events]);

  const facultyOptions = useMemo(() => {
    const collected = new Set();

    events.forEach((eventItem) => {
      [eventItem.ownerName, eventItem.faculty1, eventItem.faculty2, eventItem.faculty3, eventItem.facultyApplied]
        .filter(Boolean)
        .forEach((value) => collected.add(value));
    });

    return Array.from(collected).sort((left, right) => left.localeCompare(right));
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((eventItem) => {
      if (statusFilter && eventItem.status !== statusFilter) {
        return false;
      }

      if (facultyFilter) {
        const facultyValues = [
          eventItem.ownerName,
          eventItem.faculty1,
          eventItem.faculty2,
          eventItem.faculty3,
          eventItem.facultyApplied,
        ]
          .filter(Boolean)
          .map((value) => String(value));

        if (!facultyValues.includes(facultyFilter)) {
          return false;
        }
      }

      return true;
    });
  }, [events, statusFilter, facultyFilter]);

  const handleReset = () => {
    setStatusFilter("");
    setFacultyFilter("");
  };

  const fromPath = `${location.pathname}${location.search}`;

  return (
    <section className="-m-6 min-h-[calc(100vh-4rem)] bg-white">
      <div className="grid gap-4 border-b border-gray-200 px-6 py-5 md:grid-cols-2 xl:grid-cols-4">
        <SearchableSelect
          label="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={statusOptions}
          emptyLabel="All Statuses"
        />

        <SearchableSelect
          label="Faculty"
          value={facultyFilter}
          onChange={setFacultyFilter}
          options={facultyOptions}
          emptyLabel="All Faculty"
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
            {filteredEvents.length} events
          </span>
        </div>
      </div>

      <div className="px-6 py-5">
        {!loading && filteredEvents.length === 0 && (
          <div className="rounded-md border border-gray-200 p-6 text-center text-sm text-gray-500">No events in review queue.</div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredEvents.map((eventItem) => (
            <Link
              to={`/event/${eventItem.id}`}
              state={{ from: fromPath }}
              key={eventItem.id}
              className="rounded-md border border-gray-200 bg-white p-4 transition-colors hover:border-primary"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="line-clamp-1 text-base font-semibold text-gray-900">{eventItem.eventName || `Event #${eventItem.id}`}</h3>
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
                <p><span className="font-semibold">Owner:</span> {eventItem.ownerName || "-"}</p>
                <p><span className="font-semibold">Quarter:</span> {eventItem.quarter || "-"}</p>
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


