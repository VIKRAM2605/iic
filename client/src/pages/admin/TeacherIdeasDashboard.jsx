import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CirclePlus, RotateCcw, Download } from "lucide-react";
import { jsPDF } from "jspdf";
import { getFacultyMyIdeas, getIdeaById } from "../../../config/api";
import Alert from "../../components/Alert";
import SearchableSelect from "../../components/SearchableSelect";
import { getAuthToken } from "../../utils/auth";

const detailSteps = [
  { key: "ideaDetails", label: "Idea Details" },
  { key: "overview", label: "Overview" },
  { key: "attachments", label: "Attachments" },
];

const toLabel = (key) =>
  String(key || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());

const toDisplayValue = (value) => {
  if (value === null || value === undefined) {
    return "-";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "object") {
    const serialized = JSON.stringify(value);
    return serialized && serialized !== "{}" ? serialized : "-";
  }

  const text = String(value).trim();
  return text || "-";
};

const sanitizeFileName = (value, fallback) => {
  const text = String(value || fallback).trim() || fallback;
  return text.replace(/[\\/:*?"<>|]+/g, "_");
};

const buildEntries = (sectionData) =>
  Object.entries(sectionData && typeof sectionData === "object" ? sectionData : {}).map(
    ([key, value]) => ({
      label: toLabel(key),
      value: toDisplayValue(value),
    }),
  );

const downloadPdfReport = ({ title, sections, fallbackName }) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;
  let y = 18;

  const ensureSpace = (requiredHeight = 10) => {
    if (y + requiredHeight <= pageHeight - 14) {
      return;
    }

    doc.addPage();
    y = 18;
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, marginX, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, marginX, y);
  y += 8;

  sections.forEach((section) => {
    const entries = buildEntries(section.data);
    if (entries.length === 0) {
      return;
    }

    ensureSpace(12);
    doc.setFillColor(243, 240, 255);
    doc.rect(marginX, y - 4, pageWidth - marginX * 2, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(section.label, marginX + 2, y + 1.5);
    y += 10;

    entries.forEach((entry) => {
      const lines = doc.splitTextToSize(
        `${entry.label}: ${entry.value}`,
        pageWidth - marginX * 2,
      );
      ensureSpace(lines.length * 5 + 2);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(lines, marginX, y);
      y += lines.length * 5 + 2;
    });

    y += 2;
  });

  doc.save(`${sanitizeFileName(title, fallbackName)}_Report.pdf`);
};

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

export default function TeacherIdeasDashboard() {
  const token = useMemo(() => getAuthToken(), []);
  const location = useLocation();
  const [events, setEvents] = useState([]);
  const [quarterFilter, setQuarterFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [alertState, setAlertState] = useState({
    isOpen: false,
    message: "",
    severity: "info",
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const payload = await getFacultyMyIdeas(token);
        setEvents(payload.data || []);
      } catch (error) {
        setAlertState({
          isOpen: true,
          message: error.message || "Failed to fetch your ideas.",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token]);

  const quarterOptions = useMemo(() => {
    return Array.from(
      new Set(events.map((eventItem) => eventItem.quarter).filter(Boolean)),
    ).sort((left, right) => String(left).localeCompare(String(right)));
  }, [events]);

  const statusOptions = useMemo(() => {
    return Array.from(
      new Set(events.map((eventItem) => eventItem.status).filter(Boolean)),
    );
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((eventItem) => {
      if (quarterFilter && eventItem.quarter !== quarterFilter) {
        return false;
      }

      if (statusFilter && eventItem.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [events, quarterFilter, statusFilter]);

  const handleReset = () => {
    setQuarterFilter("");
    setStatusFilter("");
  };

  const handleDownloadReport = async (eventItem) => {
    if (!token) {
      return;
    }

    setDownloadingId(eventItem.id);
    try {
      const payload = await getIdeaById({ token, ideaId: eventItem.id });
      const ideaData = payload?.data || {};
      const title =
        ideaData?.ideaDetails?.innovationTitle ||
        eventItem.innovationTitle ||
        eventItem.eventName ||
        `Idea #${eventItem.id}`;

      downloadPdfReport({
        title,
        fallbackName: `Idea_${eventItem.id}`,
        sections: detailSteps.map((step) => ({
          label: step.label,
          data: ideaData?.[step.key],
        })),
      });

      setAlertState({
        isOpen: true,
        message: "Idea report downloaded successfully.",
        severity: "success",
      });
    } catch (error) {
      setAlertState({
        isOpen: true,
        message: error.message || "Failed to download report.",
        severity: "error",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const fromPath = `${location.pathname}${location.search}`;

  return (
    <section className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="border-b border-gray-200 bg-white px-8 py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h1 className="heading-xl">My Ideas & PoCs</h1>
            <p className="text-muted">
              View and manage your filed ideas & PoC entries
            </p>
          </div>

          <Link
            to="/ideadetails"
            className="btn-primary-custom inline-flex items-center gap-2 whitespace-nowrap"
          >
            <CirclePlus size={18} strokeWidth={2.25} />
            <span>New Ideas</span>
          </Link>
        </div>
      </div>

      <div className="border-b border-gray-200 bg-white px-8 py-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <SearchableSelect
            label="Quarter"
            value={quarterFilter}
            onChange={setQuarterFilter}
            options={quarterOptions}
            emptyLabel="All Quarters"
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
            onClick={handleReset}
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
            {filteredEvents.length} idea{filteredEvents.length !== 1 ? "s" : ""}
          </span>
        </div>

        {!loading && filteredEvents.length === 0 && (
          <div className="empty-state">
            <p className="empty-state-title">No Ideas Found</p>
            <p className="empty-state-description">
              Try adjusting your filters.
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
                    Download Report
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
                        <button
                          type="button"
                          onClick={() => handleDownloadReport(eventItem)}
                          disabled={downloadingId === eventItem.id}
                          className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-70"
                          style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}
                        >
                          <Download size={14} />
                          <span>
                            {downloadingId === eventItem.id
                              ? "Downloading..."
                              : "Download Report"}
                          </span>
                        </button>
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
