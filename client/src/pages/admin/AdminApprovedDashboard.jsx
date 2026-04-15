import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CirclePlus } from "lucide-react";
import {
  getAdminApprovedEvents,
  getAdminApprovedFilterOptions,
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

const getEventDateLabel = (eventItem) => {
  const fromDate = normalizeDate(eventItem.fromDate);
  const toDate = normalizeDate(eventItem.toDate);

  if (fromDate && toDate) {
    return `${fromDate} to ${toDate}`;
  }

  if (fromDate) {
    return fromDate;
  }

  return "-";
};

const getDurationLabel = (eventItem) => {
  const fromDateRaw = String(eventItem.fromDate || "").trim();
  const toDateRaw = String(eventItem.toDate || "").trim();

  if (!fromDateRaw || !toDateRaw) {
    return "-";
  }

  const fromDateTime = new Date(fromDateRaw);
  const toDateTime = new Date(toDateRaw);
  if (
    Number.isNaN(fromDateTime.getTime()) ||
    Number.isNaN(toDateTime.getTime())
  ) {
    return "-";
  }

  const hours =
    (toDateTime.getTime() - fromDateTime.getTime()) / (1000 * 60 * 60);
  if (!Number.isFinite(hours) || hours < 0) {
    return "-";
  }

  if (hours === 0) {
    return "0 hr";
  }

  return `${hours.toFixed(1)} hrs`;
};

export default function AdminApprovedDashboard() {
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
  const [events, setEvents] = useState([]);
  const [alertState, setAlertState] = useState({
    isOpen: false,
    message: "",
    severity: "info",
  });

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [eventsPayload, optionsPayload] = await Promise.all([
          getAdminApprovedEvents({ token }),
          getAdminApprovedFilterOptions(token),
        ]);

        setEvents(eventsPayload.data || []);
        setOptions({
          quarters: optionsPayload.data?.quarters || [],
          faculties: optionsPayload.data?.faculties || [],
        });
      } catch (error) {
        setAlertState({
          isOpen: true,
          message: error.message || "Failed to fetch approved events.",
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

  const filteredEvents = useMemo(() => {
    return events.filter((eventItem) => {
      if (quarter && String(eventItem.quarter || "") !== quarter) {
        return false;
      }

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

      const eventFrom = normalizeDate(eventItem.fromDate);
      const eventTo = normalizeDate(eventItem.toDate) || eventFrom;

      if (useSingleDate && date) {
        const targetDate = normalizeDate(date);
        if (
          !targetDate ||
          !eventFrom ||
          !eventTo ||
          targetDate < eventFrom ||
          targetDate > eventTo
        ) {
          return false;
        }
      }

      if (!useSingleDate && fromDate) {
        const targetFromDate = normalizeDate(fromDate);
        if (!targetFromDate || !eventTo || eventTo < targetFromDate) {
          return false;
        }
      }

      if (!useSingleDate && toDate) {
        const targetToDate = normalizeDate(toDate);
        if (!targetToDate || !eventFrom || eventFrom > targetToDate) {
          return false;
        }
      }

      return true;
    });
  }, [events, quarter, useSingleDate, date, fromDate, toDate, facultyName]);

  const handleResetFilters = () => {
    setQuarter("");
    setUseSingleDate(false);
    setDate("");
    setFromDate("");
    setToDate("");
    setFacultyName("");
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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <SearchableSelect
            label="Quarter"
            value={quarter}
            onChange={setQuarter}
            options={options.quarters}
            emptyLabel="All Quarters"
          />

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-900">
              Event Date
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
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={useSingleDate}
              onChange={(event) => setUseSingleDate(event.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary-light cursor-pointer"
            />
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
              Use exact date search (turns off From/To range)
            </span>
          </label>
          <button
            type="button"
            onClick={handleResetFilters}
            className="btn-secondary-custom"
            disabled={loading}
          >
            Reset Filters
          </button>
        </div>
      </div>

      <div className="px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <span className="badge-primary text-base">
            {filteredEvents.length} event
            {filteredEvents.length !== 1 ? "s" : ""}
          </span>
        </div>

        {!loading && filteredEvents.length === 0 && (
          <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
            <p className="text-base text-gray-600 font-medium">
              No approved events found.
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Try adjusting your filters.
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
                <span className="badge-success flex-shrink-0">approved</span>
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
                <div className="flex justify-between">
                  <span className="font-semibold">Duration:</span>
                  <span className="text-gray-700">
                    {getDurationLabel(eventItem)}
                  </span>
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
