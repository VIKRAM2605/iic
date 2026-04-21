import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getAdminReviewQueue } from "../../../config/api";
import Alert from "../../components/Alert";
import SearchableSelect from "../../components/SearchableSelect";
import { getAuthToken } from "../../utils/auth";

const statusBadgeClass = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  approved: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

export default function AdminEventReview() {
  const token = useMemo(() => getAuthToken(), []);
  const location = useLocation();
  const [events, setEvents] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [facultyFilter, setFacultyFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [alertState, setAlertState] = useState({
    isOpen: false,
    message: "",
    severity: "info",
  });

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
    return Array.from(
      new Set(events.map((eventItem) => eventItem.status).filter(Boolean)),
    );
  }, [events]);

  const facultyOptions = useMemo(() => {
    const collected = new Set();

    events.forEach((eventItem) => {
      [
        eventItem.ownerName,
        eventItem.faculty1,
        eventItem.faculty2,
        eventItem.faculty3,
        eventItem.facultyApplied,
      ]
        .filter(Boolean)
        .forEach((value) => collected.add(value));
    });

    return Array.from(collected).sort((left, right) =>
      left.localeCompare(right),
    );
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
          <span className="badge-primary">
            {filteredEvents.length} event
            {filteredEvents.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="px-6 py-5">
        {!loading && filteredEvents.length === 0 && (
          <div className="empty-state mx-auto max-w-md py-8">
            <div className="empty-state-icon">
              <svg
                className="mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <p className="empty-state-title">No Events in Review Queue</p>
            <p className="empty-state-description">
              All pending events have been reviewed.
            </p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredEvents.map((eventItem) => (
            <Link
              to={`/event/${eventItem.id}`}
              state={{ from: fromPath }}
              key={eventItem.id}
              className="card-custom group"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="line-clamp-1 text-base font-semibold text-slate-900 group-hover:text-primary transition-colors">
                  {eventItem.eventName || `Event #${eventItem.id}`}
                </h3>
                <span
                  className={`${
                    statusBadgeClass[eventItem.status] ||
                    "bg-gray-100 text-gray-700 border-gray-200"
                  } rounded-lg px-3 py-1.5 text-xs font-semibold capitalize border inline-flex items-center justify-center transition-all duration-200`}
                >
                  {eventItem.status || "pending"}
                </span>
              </div>

              <p className="mt-3 line-clamp-2 text-sm text-gray-700">
                {eventItem.majorReason || "No major reason provided."}
              </p>

              <div className="mt-4 space-y-2 text-xs text-gray-600">
                <p>
                  <span className="font-semibold">Owner:</span>{" "}
                  {eventItem.ownerName || "-"}
                </p>
                <p>
                  <span className="font-semibold">Quarter:</span>{" "}
                  {eventItem.quarter || "-"}
                </p>
              </div>

              {eventItem.rejectionMessage && (
                <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-2">
                  <p className="text-xs font-semibold text-amber-900 mb-1">
                    Reviewer's Comment
                  </p>
                  <p className="line-clamp-2 text-xs text-amber-800">
                    {eventItem.rejectionMessage}
                  </p>
                </div>
              )}
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
