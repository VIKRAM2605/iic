import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CirclePlus, RotateCcw } from "lucide-react";
import { getFacultyMyBusinesses } from "../../../config/api";
import Alert from "../../components/Alert";
import SearchableSelect from "../../components/SearchableSelect";
import { getAuthToken } from "../../utils/auth";

const statusBadgeClass = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default function TeacherBusinessDashboard() {
  const token = useMemo(() => getAuthToken(), []);
  const location = useLocation();
  const [businesses, setBusinesses] = useState([]);
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
        const payload = await getFacultyMyBusinesses(token);
        setBusinesses(payload.data || []);
      } catch (error) {
        setAlertState({
          isOpen: true,
          message: error.message || "Failed to fetch your businesses.",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token]);

  const quarterOptions = useMemo(
    () =>
      Array.from(
        new Set(businesses.map((item) => item.quarter).filter(Boolean)),
      ).sort((left, right) => String(left).localeCompare(String(right))),
    [businesses],
  );

  const statusOptions = useMemo(
    () =>
      Array.from(
        new Set(businesses.map((item) => item.status).filter(Boolean)),
      ),
    [businesses],
  );

  const filteredBusinesses = useMemo(
    () =>
      businesses.filter((item) => {
        if (quarterFilter && item.quarter !== quarterFilter) {
          return false;
        }

        if (statusFilter && item.status !== statusFilter) {
          return false;
        }

        return true;
      }),
    [businesses, quarterFilter, statusFilter],
  );

  const fromPath = `${location.pathname}${location.search}`;

  return (
    <section className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="border-b border-gray-200 bg-white px-8 py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h1 className="heading-xl">My Businesses</h1>
            <p className="text-muted">
              View and manage your filed business entries
            </p>
          </div>

          <Link
            to="/businessdetails"
            className="btn-primary-custom inline-flex items-center gap-2 whitespace-nowrap"
          >
            <CirclePlus size={18} strokeWidth={2.25} />
            <span>New Business</span>
          </Link>
        </div>
      </div>

      <div className="border-b border-gray-200 bg-white px-8 py-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <SearchableSelect
            label="Financial Year"
            value={quarterFilter}
            onChange={setQuarterFilter}
            options={quarterOptions}
            emptyLabel="All Financial Years"
          />

          <SearchableSelect
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
            emptyLabel="All Statuses"
          />

          <button
            type="button"
            onClick={() => {
              setQuarterFilter("");
              setStatusFilter("");
            }}
            className="btn-reset-custom self-end"
            title="Reset filters"
          >
            <RotateCcw size={14} strokeWidth={2} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      <div className="px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <span className="badge-primary text-base">
            {filteredBusinesses.length} business
            {filteredBusinesses.length !== 1 ? "es" : ""}
          </span>
        </div>

        {!loading && filteredBusinesses.length === 0 && (
          <div className="empty-state">
            <p className="empty-state-title">No Businesses Found</p>
            <p className="empty-state-description">
              Try adjusting your filters.
            </p>
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredBusinesses.map((item) => (
            <Link
              to={`/business/${item.id}`}
              state={{ from: fromPath }}
              key={item.id}
              className="card-custom group"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="line-clamp-1 text-base font-semibold text-slate-900 transition-colors group-hover:text-primary">
                  {item.eventName || `Business #${item.id}`}
                </h3>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize flex-shrink-0 ${
                    statusBadgeClass[item.status] || "bg-gray-100 text-gray-700"
                  }`}
                >
                  {item.status || "pending"}
                </span>
              </div>

              <p className="mt-3 line-clamp-2 text-sm text-gray-700">
                {item.majorReason || "No major reason provided."}
              </p>

              <div className="mt-5 space-y-2 border-t border-gray-100 pt-4 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span className="font-semibold">Financial Year:</span>
                  <span className="text-gray-700">{item.quarter || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Submitted:</span>
                  <span className="text-gray-700">
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleDateString()
                      : "-"}
                  </span>
                </div>
                {item.rejectionMessage && (
                  <div className="flex justify-between gap-3">
                    <span className="font-semibold">Rejection:</span>
                    <span className="text-right text-gray-700">
                      {item.rejectionMessage}
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
