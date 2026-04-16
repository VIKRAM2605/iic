import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getAdminBusinessReviewQueue } from "../../../config/api";
import Alert from "../../components/Alert";
import SearchableSelect from "../../components/SearchableSelect";
import { getAuthToken } from "../../utils/auth";

const statusBadgeClass = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default function AdminBusinessReview() {
  const token = useMemo(() => getAuthToken(), []);
  const location = useLocation();
  const [businesses, setBusinesses] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [facultyFilter, setFacultyFilter] = useState("");
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
        const payload = await getAdminBusinessReviewQueue(token);
        setBusinesses(payload.data || []);
      } catch (error) {
        setAlertState({
          isOpen: true,
          message: error.message || "Failed to fetch business review queue.",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    loadQueue();
  }, [token]);

  const statusOptions = useMemo(
    () => Array.from(new Set(businesses.map((item) => item.status).filter(Boolean))),
    [businesses],
  );

  const facultyOptions = useMemo(
    () =>
      Array.from(new Set(businesses.map((item) => item.ownerName).filter(Boolean))).sort(
        (left, right) => left.localeCompare(right),
      ),
    [businesses],
  );

  const filteredBusinesses = useMemo(
    () =>
      businesses.filter((item) => {
        if (statusFilter && item.status !== statusFilter) {
          return false;
        }

        if (facultyFilter && item.ownerName !== facultyFilter) {
          return false;
        }

        return true;
      }),
    [businesses, statusFilter, facultyFilter],
  );

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
            onClick={() => {
              setStatusFilter("");
              setFacultyFilter("");
            }}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Reset
          </button>
        </div>

        <div className="flex items-end justify-end">
          <span className="rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary">
            {filteredBusinesses.length} businesses
          </span>
        </div>
      </div>

      <div className="px-6 py-5">
        {!loading && filteredBusinesses.length === 0 && (
          <div className="rounded-md border border-gray-200 p-6 text-center text-sm text-gray-500">
            No businesses in review queue.
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredBusinesses.map((item) => (
            <Link
              to={`/business/${item.id}`}
              state={{ from: fromPath }}
              key={item.id}
              className="rounded-md border border-gray-200 bg-white p-4 transition-colors hover:border-primary"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="line-clamp-1 text-base font-semibold text-gray-900">
                  {item.eventName || `Business #${item.id}`}
                </h3>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                    statusBadgeClass[item.status] || "bg-gray-100 text-gray-700"
                  }`}
                >
                  {item.status || "pending"}
                </span>
              </div>

              <p className="mt-3 line-clamp-3 text-sm text-gray-700">
                {item.majorReason || "No major reason provided."}
              </p>

              <div className="mt-4 space-y-1 text-xs text-gray-600">
                <p><span className="font-semibold">Owner:</span> {item.ownerName || "-"}</p>
                <p><span className="font-semibold">Financial Year:</span> {item.quarter || "-"}</p>
                <p><span className="font-semibold">Rejection Msg:</span> {item.rejectionMessage || "-"}</p>
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
