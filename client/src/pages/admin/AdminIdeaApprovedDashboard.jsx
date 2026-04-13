import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CirclePlus } from "lucide-react";
import { getAdminApprovedIdeas, getAdminApprovedIdeaFilterOptions } from "../../../config/api";
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
  if (Number.isNaN(fromDateTime.getTime()) || Number.isNaN(toDateTime.getTime())) {
    return "-";
  }

  const hours = (toDateTime.getTime() - fromDateTime.getTime()) / (1000 * 60 * 60);
  if (!Number.isFinite(hours) || hours < 0) {
    return "-";
  }

  if (hours === 0) {
    return "0 hr";
  }

  return `${hours.toFixed(1)} hrs`;
};

export default function AdminIdeaApprovedDashboard() {
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
  const [alertState, setAlertState] = useState({ isOpen: false, message: "", severity: "info" });

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [eventsPayload, optionsPayload] = await Promise.all([
          getAdminApprovedIdeas({ token, includeRejected: true }),
          getAdminApprovedIdeaFilterOptions(token, { includeRejected: true }),
        ]);

        setEvents(eventsPayload.data || []);
        setOptions({
          quarters: optionsPayload.data?.quarters || [],
          faculties: optionsPayload.data?.faculties || [],
        });
      } catch (error) {
        setAlertState({
          isOpen: true,
          message: error.message || "Failed to fetch ideas.",
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

        if (!facultyFields.some((value) => value.includes(facultyName.toLowerCase()))) {
          return false;
        }
      }

      const eventFrom = normalizeDate(eventItem.fromDate);
      const eventTo = normalizeDate(eventItem.toDate) || eventFrom;

      if (useSingleDate && date) {
        const targetDate = normalizeDate(date);
        if (!targetDate || !eventFrom || !eventTo || targetDate < eventFrom || targetDate > eventTo) {
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
    <section className="-m-6 min-h-[calc(100vh-4rem)] bg-white">
      <div className="border-b border-gray-200 px-6 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-[28px]">Ideas Dashboard</h1>
            <p className="text-sm text-[#7a80a6] sm:text-base">Track and manage your ideas submissions</p>
          </div>

          <Link
            to="/ideadetails"
            className="inline-flex w-fit items-center gap-2 rounded-xl bg-primary px-5 py-3 text-base font-semibold text-white transition-all duration-200 hover:opacity-90"
            style={{ boxShadow: "0 10px 20px -10px rgba(125, 83, 246, 0.6)" }}
          >
            <CirclePlus size={18} strokeWidth={2.25} />
            <span>New Ideas</span>
          </Link>
        </div>
      </div>
      <div className="grid gap-4 border-b border-gray-200 px-6 py-5 md:grid-cols-2 xl:grid-cols-5">
        <SearchableSelect
          label="Quarter"
          value={quarter}
          onChange={setQuarter}
          options={options.quarters}
          emptyLabel="All Quarters"
        />

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Idea Date</label>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            disabled={!useSingleDate}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Idea From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            disabled={useSingleDate}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Idea To Date</label>
          <input
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            disabled={useSingleDate}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100"
          />
        </div>

        <SearchableSelect
          label="Faculty Name"
          value={facultyName}
          onChange={setFacultyName}
          options={options.faculties}
          emptyLabel="All Faculty"
        />

        <div className="flex items-end justify-between gap-2 md:col-span-2 xl:col-span-5">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={useSingleDate}
              onChange={(event) => setUseSingleDate(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            Use exact Idea date search (turns off From/To range)
          </label>
          <button
            type="button"
            onClick={handleResetFilters}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            disabled={loading}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="px-6 py-5">
        <div className="mb-4 flex items-center justify-end">
          <span className="rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary">
            {filteredEvents.length} ideas
          </span>
        </div>

        {!loading && filteredEvents.length === 0 && (
          <div className="rounded-md border border-gray-200 p-6 text-center text-sm text-gray-500">No ideas found.</div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredEvents.map((eventItem) => (
            <Link
              to={`/idea/${eventItem.id}`}
              state={{ from: fromPath }}
              key={eventItem.id}
              className="rounded-md border border-gray-200 bg-white p-4 transition-colors hover:border-primary"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="line-clamp-1 text-base font-semibold text-gray-900">{eventItem.eventName || `Idea #${eventItem.id}`}</h3>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                    eventItem.status === "rejected"
                      ? "bg-red-100 text-red-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {eventItem.status || "approved"}
                </span>
              </div>

              <p className="mt-3 line-clamp-3 text-sm text-gray-700">{eventItem.majorReason || "No major reason provided."}</p>

              <div className="mt-4 space-y-1 text-xs text-gray-600">
                <p><span className="font-semibold">Quarter:</span> {eventItem.quarter || "-"}</p>
                <p><span className="font-semibold">Date:</span> {getEventDateLabel(eventItem)}</p>
                <p><span className="font-semibold">Duration:</span> {getDurationLabel(eventItem)}</p>
                <p><span className="font-semibold">Owner:</span> {eventItem.ownerName || "-"}</p>
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


