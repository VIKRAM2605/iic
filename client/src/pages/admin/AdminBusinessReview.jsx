import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getAdminBusinessReviewQueue } from "../../../config/api";
import Alert from "../../components/Alert";
import SearchableSelect from "../../components/SearchableSelect";
import { getAuthToken } from "../../utils/auth";

const statusBadgeClass = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  approved: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
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
    () =>
      Array.from(
        new Set(businesses.map((item) => item.status).filter(Boolean)),
      ),
    [businesses],
  );

  const facultyOptions = useMemo(
    () =>
      Array.from(
        new Set(businesses.map((item) => item.ownerName).filter(Boolean)),
      ).sort((left, right) => left.localeCompare(right)),
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
          <span className="badge-primary">
            {filteredBusinesses.length} business
            {filteredBusinesses.length !== 1 ? "es" : ""}
          </span>
        </div>
      </div>

      <div className="px-6 py-5">
        {!loading && filteredBusinesses.length === 0 && (
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
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4 0h1m-1-4h1"
                />
              </svg>
            </div>
            <p className="empty-state-title">No Businesses in Review Queue</p>
            <p className="empty-state-description">
              All pending businesses have been reviewed.
            </p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredBusinesses.map((item) => (
            <Link
              to={`/business/${item.id}`}
              state={{ from: fromPath }}
              key={item.id}
              className="card-custom group"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="line-clamp-1 text-base font-semibold text-slate-900 group-hover:text-primary transition-colors">
                  {item.eventName || `Business #${item.id}`}
                </h3>
                <span
                  className={`${
                    statusBadgeClass[item.status] ||
                    "bg-gray-100 text-gray-700 border-gray-200"
                  } rounded-lg px-3 py-1.5 text-xs font-semibold capitalize border inline-flex items-center justify-center transition-all duration-200`}
                >
                  {item.status || "pending"}
                </span>
              </div>

              <p className="mt-3 line-clamp-3 text-sm text-gray-700">
                {item.majorReason || "No major reason provided."}
              </p>

              <div className="mt-4 space-y-1 text-xs text-gray-600">
                <p>
                  <span className="font-semibold">Owner:</span>{" "}
                  {item.ownerName || "-"}
                </p>
                <p>
                  <span className="font-semibold">Financial Year:</span>{" "}
                  {item.quarter || "-"}
                </p>
                <p>
                  <span className="font-semibold">Rejection Msg:</span>{" "}
                  {item.rejectionMessage || "-"}
                </p>
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
