import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getAdminIdeaReviewQueue } from "../../../config/api";
import Alert from "../../components/Alert";
import SearchableSelect from "../../components/SearchableSelect";
import { getAuthToken } from "../../utils/auth";

const getTeamLabel = (eventItem) => {
  return (
    eventItem.eventName ||
    eventItem.innovationTitle ||
    `Idea #${eventItem.id}`
  );
};

const getTeamLeadLabel = (eventItem) => {
  return eventItem.teamLeadName || eventItem.ownerName || "-";
};

const getTeamLeadDetails = (eventItem) => {
  const details = [eventItem.teamLeadEmail, eventItem.teamLeadGender].filter(
    Boolean,
  );

  return details.length > 0 ? details.join(" | ") : "-";
};

export default function AdminIdeaReview() {
  const token = useMemo(() => getAuthToken(), []);
  const location = useLocation();
  const [events, setEvents] = useState([]);
  const [facultyName, setFacultyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [alertState, setAlertState] = useState({
    isOpen: false,
    message: "",
    severity: "info",
  });

  const loadQueue = async () => {
    setLoading(true);
    try {
      const payload = await getAdminIdeaReviewQueue(token);
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
      if (facultyName) {
        const facultyFields = [
          eventItem.ownerName,
          eventItem.faculty1,
          eventItem.faculty2,
          eventItem.faculty3,
          eventItem.facultyApplied,
        ]
          .filter(Boolean)
          .map((value) => String(value).toLowerCase());

        if (
          !facultyFields.some((value) =>
            value.includes(facultyName.toLowerCase()),
          )
        ) {
          return false;
        }
      }

      return true;
    });
  }, [events, facultyName]);

  const handleResetFilters = () => {
    setFacultyName("");
  };

  const fromPath = `${location.pathname}${location.search}`;

  return (
    <section className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="border-b border-gray-200 bg-white px-8 py-8">
        <div className="space-y-2">
          <h1 className="heading-xl">Idea Review Queue</h1>
          <p className="text-muted">
            Review and manage pending idea submissions
          </p>
        </div>
      </div>

      <div className="border-b border-gray-200 bg-white px-8 py-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <SearchableSelect
            label="Faculty Name"
            value={facultyName}
            onChange={setFacultyName}
            options={facultyOptions}
            emptyLabel="All Faculty"
          />
        </div>

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div />
          <button
            type="button"
            onClick={handleResetFilters}
            className="btn-reset-custom"
            disabled={loading}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <span className="badge-primary text-base">
            {filteredEvents.length} idea{filteredEvents.length !== 1 ? "s" : ""}
          </span>
        </div>

        {!loading && filteredEvents.length === 0 && (
          <div className="empty-state">
            <p className="empty-state-title">No Ideas in Review Queue</p>
            <p className="empty-state-description">
              All pending ideas have been reviewed.
            </p>
          </div>
        )}

        {filteredEvents.length > 0 && (
          <div
            className="overflow-x-auto rounded-xl bg-white"
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}
          >
            <table className="w-full border-collapse">
              <thead>
                <tr
                  className="border-b border-purple-100"
                  style={{ backgroundColor: "#f3f0ff" }}
                >
                  <th className="px-4 py-3.5 text-left text-sm font-bold text-purple-700">
                    S.No.
                  </th>
                  <th className="px-4 py-3.5 text-left text-sm font-bold text-purple-700">
                    Team
                  </th>
                  <th className="px-4 py-3.5 text-left text-sm font-bold text-purple-700">
                    Lead
                  </th>
                  <th className="px-4 py-3.5 text-left text-sm font-bold text-purple-700">
                    Lead Details
                  </th>
                  <th className="px-4 py-3.5 text-center text-sm font-bold text-purple-700">
                    Status
                  </th>
                  <th className="px-4 py-3.5 text-left text-sm font-bold text-purple-700">
                    Review Comments
                  </th>
                  <th className="px-4 py-3.5 text-center text-sm font-bold text-purple-700">
                    View Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((eventItem, index) => {
                  const isEvenRow = index % 2 === 0;

                  return (
                    <tr
                      key={eventItem.id}
                      className={`border-b border-purple-100 transition-colors ${
                        isEvenRow ? "bg-white" : "bg-gray-50"
                      } hover:bg-purple-50`}
                    >
                      <td className="px-4 py-3.5 text-xs font-medium text-gray-600">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3.5 text-xs font-semibold text-gray-900">
                        {getTeamLabel(eventItem)}
                      </td>
                      <td className="px-4 py-3.5 text-xs font-medium text-gray-700">
                        {getTeamLeadLabel(eventItem)}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-700">
                        {getTeamLeadDetails(eventItem)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                            eventItem.status === "rejected"
                              ? "bg-red-50 text-red-700"
                              : eventItem.status === "pending"
                              ? "bg-yellow-50 text-yellow-700"
                              : "bg-green-50 text-green-700"
                          }`}
                        >
                          {eventItem.status || "pending"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-700">
                        {eventItem.rejectionMessage || "-"}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <Link
                          to={`/idea/${eventItem.id}`}
                          state={{ from: fromPath }}
                          className="inline-block rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-purple-700"
                          style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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
