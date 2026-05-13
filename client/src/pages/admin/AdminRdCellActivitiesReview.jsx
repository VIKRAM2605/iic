import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getAdminRdCellActivitiesReviewQueue } from "../../../config/api";
import Alert from "../../components/Alert";
import SearchableSelect from "../../components/SearchableSelect";
import { getAuthToken } from "../../utils/auth";

export default function AdminRdCellActivitiesReview() {
  const token = useMemo(() => getAuthToken(), []);
  const location = useLocation();
  const [activities, setActivities] = useState([]);
  const [facultyName, setFacultyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [alertState, setAlertState] = useState({
    isOpen: false,
    message: "",
    severity: "info",
  });

  useEffect(() => {
    const loadQueue = async () => {
      setLoading(true);
      try {
        const payload = await getAdminRdCellActivitiesReviewQueue(token);
        setActivities(payload.data || []);
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

    loadQueue();
  }, [token]);

  const facultyOptions = useMemo(() => {
    const collected = new Set();

    activities.forEach((item) => {
      [item.ownerName, item.ownerEmail, item.eventName, item.title, item.levelDuration]
        .filter(Boolean)
        .forEach((value) => collected.add(value));
    });

    return Array.from(collected).sort((left, right) => left.localeCompare(right));
  }, [activities]);

  const filteredActivities = useMemo(
    () =>
      activities.filter((item) => {
        if (!facultyName) {
          return true;
        }

        const searchableFields = [
          item.ownerName,
          item.ownerEmail,
          item.eventName,
          item.title,
          item.levelDuration,
        ]
          .filter(Boolean)
          .map((value) => String(value).toLowerCase());

        return searchableFields.some((value) =>
          value.includes(facultyName.toLowerCase()),
        );
      }),
    [activities, facultyName],
  );

  const fromPath = `${location.pathname}${location.search}`;

  return (
    <section className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="border-b border-gray-200 bg-white px-8 py-8">
        <div className="space-y-2">
          <h1 className="heading-xl">R & D Cell Activities Review Queue</h1>
          <p className="text-muted">
            Review pending and rejected R & D Cell activity submissions
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
            onClick={() => setFacultyName("")}
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
            {filteredActivities.length} activit
            {filteredActivities.length === 1 ? "y" : "ies"}
          </span>
        </div>

        {!loading && filteredActivities.length === 0 && (
          <div className="empty-state">
            <p className="empty-state-title">No Activities in Review Queue</p>
            <p className="empty-state-description">
              All pending activities have been reviewed.
            </p>
          </div>
        )}

        {filteredActivities.length > 0 && (
          <div
            className="overflow-x-auto rounded-xl bg-white"
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}
          >
            <table className="w-full border-collapse">
              <thead>
                <tr
                  className="border-b border-cyan-100"
                  style={{ backgroundColor: "#effbff" }}
                >
                  <th className="px-4 py-3.5 text-left text-sm font-bold text-cyan-700">
                    S.No.
                  </th>
                  <th className="px-4 py-3.5 text-left text-sm font-bold text-cyan-700">
                    Sub Theme
                  </th>
                  <th className="px-4 py-3.5 text-left text-sm font-bold text-cyan-700">
                    Title
                  </th>
                  <th className="px-4 py-3.5 text-left text-sm font-bold text-cyan-700">
                    Level Duration
                  </th>
                  <th className="px-4 py-3.5 text-center text-sm font-bold text-cyan-700">
                    Status
                  </th>
                  <th className="px-4 py-3.5 text-left text-sm font-bold text-cyan-700">
                    Review Comments
                  </th>
                  <th className="px-4 py-3.5 text-center text-sm font-bold text-cyan-700">
                    View Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.map((item, index) => (
                  <tr
                    key={item.id}
                    className={`border-b border-cyan-100 transition-colors ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-cyan-50`}
                  >
                    <td className="px-4 py-3.5 text-xs font-medium text-gray-600">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3.5 text-xs font-semibold text-gray-900">
                      {item.eventName || `Activity #${item.id}`}
                    </td>
                    <td className="px-4 py-3.5 text-xs font-medium text-gray-700">
                      {item.title || "-"}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-700">
                      {item.levelDuration || "-"}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                          item.status === "rejected"
                            ? "bg-red-50 text-red-700"
                            : item.status === "pending"
                              ? "bg-yellow-50 text-yellow-700"
                              : "bg-green-50 text-green-700"
                        }`}
                      >
                        {item.status || "pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-700">
                      {item.rejectionMessage || "-"}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <Link
                        to={`/rd-cell-activity/${item.id}`}
                        state={{ from: fromPath }}
                        className="inline-block rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-cyan-700"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
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
