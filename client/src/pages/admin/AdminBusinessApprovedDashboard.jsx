import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CirclePlus } from "lucide-react";
import {
  getAdminApprovedBusinesses,
  getAdminApprovedBusinessFilterOptions,
} from "../../../config/api";
import Alert from "../../components/Alert";
import SearchableSelect from "../../components/SearchableSelect";
import { getAuthToken } from "../../utils/auth";

const normalizeDate = (rawValue) => {
  const value = String(rawValue || "").trim();
  if (!value) {
    return "";
  }

  const maybeDate = value.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(maybeDate)) {
    return maybeDate;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function AdminBusinessApprovedDashboard() {
  const token = useMemo(() => getAuthToken(), []);
  const location = useLocation();

  const [quarter, setQuarter] = useState("");
  const [useSingleDate, setUseSingleDate] = useState(false);
  const [date, setDate] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [facultyName, setFacultyName] = useState("");
  const [options, setOptions] = useState({ quarters: [], faculties: [] });
  const [loading, setLoading] = useState(false);
  const [businesses, setBusinesses] = useState([]);
  const [alertState, setAlertState] = useState({
    isOpen: false,
    message: "",
    severity: "info",
  });

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [businessesPayload, optionsPayload] = await Promise.all([
          getAdminApprovedBusinesses({ token, includeRejected: true }),
          getAdminApprovedBusinessFilterOptions(token, {
            includeRejected: true,
          }),
        ]);

        setBusinesses(businessesPayload.data || []);
        setOptions({
          quarters: optionsPayload.data?.quarters || [],
          faculties: optionsPayload.data?.faculties || [],
        });
      } catch (error) {
        setAlertState({
          isOpen: true,
          message: error.message || "Failed to fetch businesses.",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [token]);

  useEffect(() => {
    if (useSingleDate) {
      setFromDate("");
      setToDate("");
      return;
    }

    setDate("");
  }, [useSingleDate]);

  const filteredBusinesses = useMemo(
    () =>
      businesses.filter((item) => {
        if (quarter && String(item.quarter || "") !== quarter) {
          return false;
        }

        if (
          facultyName &&
          !String(item.ownerName || "")
            .toLowerCase()
            .includes(facultyName.toLowerCase())
        ) {
          return false;
        }

        const submittedDate = normalizeDate(item.createdAt);

        if (useSingleDate && date) {
          return submittedDate === normalizeDate(date);
        }

        if (
          !useSingleDate &&
          fromDate &&
          submittedDate < normalizeDate(fromDate)
        ) {
          return false;
        }

        if (!useSingleDate && toDate && submittedDate > normalizeDate(toDate)) {
          return false;
        }

        return true;
      }),
    [businesses, quarter, useSingleDate, date, fromDate, toDate, facultyName],
  );

  const fromPath = `${location.pathname}${location.search}`;

  return (
    <section className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="border-b border-gray-200 bg-white px-8 py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h1 className="heading-xl">My Startups</h1>
            <p className="text-muted">
              All your registered ventures and their status in both users
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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <SearchableSelect
            label="Financial Year"
            value={quarter}
            onChange={setQuarter}
            options={options.quarters}
            emptyLabel="All Financial Years"
          />

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-900">
              Submitted Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              disabled={!useSingleDate}
              className="input-custom"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-900">
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              disabled={useSingleDate}
              className="input-custom"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-900">
              To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              disabled={useSingleDate}
              className="input-custom"
            />
          </div>

          <SearchableSelect
            label="Faculty Name"
            value={facultyName}
            onChange={setFacultyName}
            options={options.faculties}
            emptyLabel="All Faculty"
          />
        </div>

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <label className="flex cursor-pointer items-center gap-3 group">
            <input
              type="checkbox"
              checked={useSingleDate}
              onChange={(event) => setUseSingleDate(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary-light"
            />
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
              Use exact date search (turns off From/To range)
            </span>
          </label>
          <button
            type="button"
            onClick={() => {
              setQuarter("");
              setUseSingleDate(false);
              setDate("");
              setFromDate("");
              setToDate("");
              setFacultyName("");
            }}
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
            {filteredBusinesses.length} business
            {filteredBusinesses.length !== 1 ? "es" : ""}
          </span>
        </div>

        {!loading && filteredBusinesses.length === 0 && (
          <div className="empty-state">
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
                  className={`${
                    item.status === "rejected"
                      ? "bg-red-50 text-red-700 border-red-200"
                      : "bg-green-50 text-green-700 border-green-200"
                  } rounded-lg px-3 py-1.5 text-xs font-semibold capitalize flex-shrink-0 border inline-flex items-center justify-center transition-all duration-200`}
                >
                  {item.status || "approved"}
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
                <div className="flex justify-between">
                  <span className="font-semibold">Owner:</span>
                  <span className="text-gray-700">{item.ownerName || "-"}</span>
                </div>
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
