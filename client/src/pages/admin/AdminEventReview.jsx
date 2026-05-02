import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Download } from "lucide-react";
import { jsPDF } from "jspdf";
import { getAdminReviewQueue, getEventById } from "../../../config/api";
import Alert from "../../components/Alert";
import SearchableSelect from "../../components/SearchableSelect";
import { getAuthToken } from "../../utils/auth";

const detailSteps = [
  {
    key: "programDetails",
    label: "Program",
    fields: [
      ["previousAcademicYear", "Previous Academic Year"],
      ["currentAcademicYear", "Current Academic Year"],
      ["quarter", "Quarter"],
      ["programDrivenBy", "Program Driven By"],
      ["programActivityName", "Program Activity Name"],
      ["programType", "Program Type"],
      ["activityLedBy", "Activity Led By"],
      ["programTheme", "Program Theme"],
      ["aboutEvent", "About Event"],
      ["studentParticipants", "Student Participants"],
      ["facultyParticipants", "Faculty Participants"],
      ["externalParticipants", "External Participants"],
      ["expenditureAmount", "Expenditure Amount"],
      ["modeOfSession", "Mode Of Session"],
      ["eventType", "Event Type"],
    ],
  },
  {
    key: "durationDetails",
    label: "Duration",
    fields: [
      ["durationManual", "Duration Entered Manually"],
      ["fromDate", "From Date & Time"],
      ["toDate", "To Date & Time"],
      ["durationHours", "Duration (Hours)"],
    ],
  },
  {
    key: "overview",
    label: "Overview",
    fields: [
      ["objective", "Objective"],
      ["benefitLearning", "Benefit Learning"],
      ["outcomeObtained", "Outcome Obtained"],
      ["remark", "Remark"],
    ],
  },
  {
    key: "speakerDetails",
    label: "Speaker",
    fields: [
      ["speakerName", "Speaker Name"],
      ["speakerDesignation", "Speaker Designation"],
      ["speakerOrganization", "Speaker Organization"],
      ["aboutSpeaker", "About Speaker"],
      ["sessionVideoUrl", "Session Video URL"],
      ["publishedSocialMediaUrl", "Published Social Media URL"],
    ],
  },
  {
    key: "bipPortal",
    label: "BIP Portal",
    fields: [
      ["facultyApplied", "Faculty Applied"],
      ["taskId", "Task ID"],
      ["departmentsInvolved", "Departments Involved"],
      ["department", "Department"],
      ["specialLabsInvolved", "Special Labs Involved"],
      ["specialLabs", "Special Labs"],
      ["clubInvolved", "Club Involved"],
      ["club", "Club"],
      ["firstFacultyInvolved", "First Faculty Involved"],
      ["secondFacultyInvolved", "Second Faculty Involved"],
      ["thirdFacultyInvolved", "Third Faculty Involved"],
      ["iqacVerification", "IQAC Verification"],
    ],
  },
  {
    key: "faculty",
    label: "Faculty",
    fields: [
      ["faculty1", "Faculty 1"],
      ["faculty2", "Faculty 2"],
      ["faculty3", "Faculty 3"],
    ],
  },
];

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

const toTitleCase = (value) => {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }

  return text
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
};

const getDisplayValue = (key, rawValue) => {
  if (key === "fromDate" || key === "toDate") {
    const normalized = normalizeDate(rawValue);
    if (!normalized) {
      return "-";
    }

    const parsed = new Date(rawValue);
    if (Number.isNaN(parsed.getTime())) {
      return normalized;
    }

    const hours = String(parsed.getHours()).padStart(2, "0");
    const minutes = String(parsed.getMinutes()).padStart(2, "0");
    return `${normalized} ${hours}:${minutes}`;
  }

  if (typeof rawValue === "boolean") {
    return rawValue ? "Yes" : "No";
  }

  if (rawValue === null || rawValue === undefined) {
    return "-";
  }

  if (typeof rawValue === "object") {
    const serialized = JSON.stringify(rawValue);
    return serialized && serialized !== "{}" ? serialized : "-";
  }

  const text = String(rawValue).trim();
  return text || "-";
};

const sanitizeFileName = (value) => {
  const rawName = String(value || "Event").trim();
  if (!rawName) {
    return "Event";
  }

  return rawName.replace(/[\\/:*?"<>|]+/g, "_");
};

const getSectionEntries = (sectionData, configuredFields) => {
  const data = sectionData && typeof sectionData === "object" ? sectionData : {};
  const usedKeys = new Set();
  const orderedEntries = configuredFields.map(([key, label]) => {
    usedKeys.add(key);
    return {
      label,
      value: getDisplayValue(key, data[key]),
    };
  });

  const additionalEntries = Object.keys(data)
    .filter((key) => !usedKeys.has(key))
    .sort((left, right) => left.localeCompare(right))
    .map((key) => ({
      label: toTitleCase(key),
      value: getDisplayValue(key, data[key]),
    }));

  return [...orderedEntries, ...additionalEntries];
};

const drawPdfHeader = ({ doc, title, generatedOn }) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(107, 33, 168);
  doc.rect(0, 0, pageWidth, 34, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  const titleLines = doc.splitTextToSize(
    `${title || "Event"} - Detailed Report`,
    pageWidth - 28,
  );
  doc.text(titleLines, 14, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Generated on: ${generatedOn}`, 14, 26);
};

const drawSectionTitle = ({ doc, sectionTitle, y }) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(237, 233, 254);
  doc.roundedRect(14, y, pageWidth - 28, 10, 2, 2, "F");
  doc.setTextColor(107, 33, 168);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(sectionTitle, 18, y + 7);
};

const drawSectionGrid = ({
  doc,
  title,
  generatedOn,
  sectionTitle,
  entries,
  cursor,
}) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  const rowGap = 4;
  const columnGap = 6;
  const colWidth = (pageWidth - marginX * 2 - columnGap) / 2;
  const innerPadding = 3;
  const maxY = pageHeight - 14;

  const addPageAndResetCursor = () => {
    doc.addPage();
    drawPdfHeader({ doc, title, generatedOn });
    cursor.y = 40;
  };

  if (cursor.y + 14 > maxY) {
    addPageAndResetCursor();
  }

  drawSectionTitle({ doc, sectionTitle, y: cursor.y });
  cursor.y += 14;

  const renderCell = (entry, x, topY) => {
    if (!entry) {
      return 0;
    }

    const labelLines = doc.splitTextToSize(entry.label, colWidth - innerPadding * 2);
    const valueLines = doc.splitTextToSize(entry.value, colWidth - innerPadding * 2);
    const contentHeight = (labelLines.length + valueLines.length) * 4.7 + innerPadding * 2;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(221, 214, 254);
    doc.roundedRect(x, topY, colWidth, contentHeight, 2, 2, "FD");

    doc.setTextColor(107, 33, 168);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(labelLines, x + innerPadding, topY + 5);

    doc.setTextColor(55, 65, 81);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(valueLines, x + innerPadding, topY + 5 + labelLines.length * 4.7);

    return contentHeight;
  };

  for (let index = 0; index < entries.length; index += 2) {
    const leftEntry = entries[index];
    const rightEntry = entries[index + 1];

    const leftHeight = leftEntry
      ? (() => {
          const labelLines = doc.splitTextToSize(leftEntry.label, colWidth - innerPadding * 2);
          const valueLines = doc.splitTextToSize(leftEntry.value, colWidth - innerPadding * 2);
          return (labelLines.length + valueLines.length) * 4.7 + innerPadding * 2;
        })()
      : 0;
    const rightHeight = rightEntry
      ? (() => {
          const labelLines = doc.splitTextToSize(rightEntry.label, colWidth - innerPadding * 2);
          const valueLines = doc.splitTextToSize(rightEntry.value, colWidth - innerPadding * 2);
          return (labelLines.length + valueLines.length) * 4.7 + innerPadding * 2;
        })()
      : 0;
    const rowHeight = Math.max(leftHeight, rightHeight, 18);

    if (cursor.y + rowHeight > maxY) {
      addPageAndResetCursor();
    }

    renderCell(leftEntry, marginX, cursor.y);
    renderCell(rightEntry, marginX + colWidth + columnGap, cursor.y);
    cursor.y += rowHeight + rowGap;
  }
};

export default function AdminEventReview() {
  const token = useMemo(() => getAuthToken(), []);
  const location = useLocation();
  const [events, setEvents] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [facultyFilter, setFacultyFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloadingEventId, setDownloadingEventId] = useState(null);
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

  const handleDownloadReport = async (eventItem) => {
    if (!eventItem?.id || downloadingEventId) {
      return;
    }

    setDownloadingEventId(eventItem.id);

    try {
      const payload = await getEventById({ token, eventId: eventItem.id });
      const eventData = payload?.data || {};

      const reportTitle =
        String(eventData.eventName || eventItem.eventName || "Event").trim() ||
        `Event #${eventItem.id}`;
      const generatedOn = new Date().toLocaleString();
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      drawPdfHeader({ doc, title: reportTitle, generatedOn });
      const cursor = { y: 40 };

      detailSteps.forEach((step, index) => {
        const sectionEntries = getSectionEntries(eventData[step.key], step.fields);
        drawSectionGrid({
          doc,
          title: reportTitle,
          generatedOn,
          sectionTitle: `SECTION ${index + 1}: ${step.label.toUpperCase()}`,
          entries: sectionEntries,
          cursor,
        });
      });

      doc.save(`${sanitizeFileName(reportTitle)}_Detailed_Report.pdf`);

      setAlertState({
        isOpen: true,
        message: "Detailed report downloaded successfully.",
        severity: "success",
      });
    } catch (error) {
      setAlertState({
        isOpen: true,
        message: error.message || "Failed to download report.",
        severity: "error",
      });
    } finally {
      setDownloadingEventId(null);
    }
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
                    Title of Activity
                  </th>
                  <th className="px-4 py-3.5 text-center text-sm font-bold text-purple-700">
                    Quarter
                  </th>
                  <th className="px-4 py-3.5 text-center text-sm font-bold text-purple-700">
                    View Details
                  </th>
                  <th className="px-4 py-3.5 text-center text-sm font-bold text-purple-700">
                    Current Status of Report
                  </th>
                  <th className="px-4 py-3.5 text-center text-sm font-bold text-purple-700">
                    Download Report
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
                      <td className="px-4 py-3.5 text-xs">
                        <p className="font-semibold text-gray-900">
                          {eventItem.eventName || `Event #${eventItem.id}`}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-center text-xs font-medium text-gray-700">
                        {eventItem.quarter || "-"}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <Link
                          to={`/event/${eventItem.id}`}
                          state={{ from: fromPath }}
                          className="inline-block rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-purple-700"
                          style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}
                        >
                          View Details
                        </Link>
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
                      <td className="px-4 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleDownloadReport(eventItem)}
                          disabled={downloadingEventId === eventItem.id}
                          className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-70"
                          style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}
                        >
                          <Download size={14} />
                          <span>
                            {downloadingEventId === eventItem.id
                              ? "Downloading..."
                              : "Download Report"}
                          </span>
                        </button>
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
