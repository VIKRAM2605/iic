import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  CirclePlus,
  Search,
  RotateCcw,
  Eye,
  Check,
  X,
  Download,
} from "lucide-react";
import { jsPDF } from "jspdf";
import {
  getAdminApprovedEvents,
  getAdminApprovedFilterOptions,
  getEventById,
  reviewEventByAdmin,
} from "../../../config/api";
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

const drawSectionGrid = ({ doc, title, generatedOn, sectionTitle, entries, cursor }) => {
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

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    const labelLines = doc.splitTextToSize(entry.label, colWidth - innerPadding * 2);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const valueLines = doc.splitTextToSize(
      String(entry.value || "-"),
      colWidth - innerPadding * 2,
    );

    const lineHeight = 4;
    const cellHeight =
      innerPadding * 2 +
      labelLines.length * lineHeight +
      1 +
      valueLines.length * lineHeight;

    doc.setDrawColor(221, 214, 254);
    doc.setFillColor(250, 250, 255);
    doc.roundedRect(x, topY, colWidth, cellHeight, 1.5, 1.5, "FD");

    let textY = topY + innerPadding + 3;
    doc.setTextColor(91, 33, 182);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(labelLines, x + innerPadding, textY);

    textY += labelLines.length * lineHeight + 1;
    doc.setTextColor(31, 41, 55);
    doc.setFont("helvetica", "normal");
    doc.text(valueLines, x + innerPadding, textY);

    return cellHeight;
  };

  for (let index = 0; index < entries.length; index += 2) {
    const leftEntry = entries[index];
    const rightEntry = entries[index + 1];

    const leftPreviewHeight = leftEntry
      ? 8 +
        doc.splitTextToSize(leftEntry.label, colWidth - innerPadding * 2).length * 4 +
        doc.splitTextToSize(String(leftEntry.value || "-"), colWidth - innerPadding * 2)
          .length *
          4
      : 0;
    const rightPreviewHeight = rightEntry
      ? 8 +
        doc.splitTextToSize(rightEntry.label, colWidth - innerPadding * 2).length * 4 +
        doc.splitTextToSize(String(rightEntry.value || "-"), colWidth - innerPadding * 2)
          .length *
          4
      : 0;

    const estimatedRowHeight = Math.max(leftPreviewHeight, rightPreviewHeight, 14);
    if (cursor.y + estimatedRowHeight > maxY) {
      addPageAndResetCursor();

      if (cursor.y + 14 > maxY) {
        addPageAndResetCursor();
      }

      drawSectionTitle({ doc, sectionTitle, y: cursor.y });
      cursor.y += 14;
    }

    const leftHeight = renderCell(leftEntry, marginX, cursor.y);
    const rightHeight = renderCell(
      rightEntry,
      marginX + colWidth + columnGap,
      cursor.y,
    );
    cursor.y += Math.max(leftHeight, rightHeight, 14) + rowGap;
  }

  cursor.y += 2;
};

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

export default function AdminApprovedDashboard() {
  const token = useMemo(() => getAuthToken(), []);
  const location = useLocation();

  const [quarter, setQuarter] = useState("");
  const [activityName, setActivityName] = useState("");
  const [searchTitle, setSearchTitle] = useState("");
  const [options, setOptions] = useState({ quarters: [], faculties: [] });
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [reviewingEventId, setReviewingEventId] = useState(null);
  const [rejectionMessage, setRejectionMessage] = useState("");
  const [processingReview, setProcessingReview] = useState(false);
  const [downloadingEventId, setDownloadingEventId] = useState(null);
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

  const activityOptions = useMemo(() => {
    return Array.from(
      new Set(events.map((item) => item.programActivityName).filter(Boolean)),
    ).sort();
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((eventItem) => {
      if (quarter && String(eventItem.quarter || "") !== quarter) {
        return false;
      }

      if (activityName && eventItem.programActivityName !== activityName) {
        return false;
      }

      if (searchTitle) {
        const searchLower = searchTitle.toLowerCase();
        const eventName = String(eventItem.eventName || "").toLowerCase();
        const programName = String(
          eventItem.programActivityName || "",
        ).toLowerCase();
        if (
          !eventName.includes(searchLower) &&
          !programName.includes(searchLower)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [events, quarter, activityName, searchTitle]);

  const handleResetFilters = () => {
    setQuarter("");
    setActivityName("");
    setSearchTitle("");
  };

  const handleReview = async (eventId, action) => {
    if (!eventId) return;

    setProcessingReview(true);
    try {
      const payload = await reviewEventByAdmin({
        token,
        eventId,
        action,
        rejectionMessage: action === "reject" ? rejectionMessage : "",
      });

      setAlertState({
        isOpen: true,
        message: payload.message || `Event ${action}d successfully.`,
        severity: "success",
      });

      setEvents((previous) =>
        previous.map((event) =>
          event.id === eventId
            ? {
                ...event,
                status: action === "approve" ? "approved" : "rejected",
                rejectionMessage:
                  action === "reject"
                    ? rejectionMessage
                    : event.rejectionMessage,
              }
            : event,
        ),
      );

      setReviewingEventId(null);
      setRejectionMessage("");
    } catch (error) {
      setAlertState({
        isOpen: true,
        message: error.message || "Failed to review event.",
        severity: "error",
      });
    } finally {
      setProcessingReview(false);
    }
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
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
          <SearchableSelect
            label=""
            value={quarter}
            onChange={setQuarter}
            options={options.quarters}
            emptyLabel="All Quarters"
          />

          <SearchableSelect
            label=""
            value={activityName}
            onChange={setActivityName}
            options={activityOptions}
            emptyLabel="All Activities"
          />

          <div className="col-span-full md:col-span-2 flex items-end gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
                placeholder="Search by title..."
                className="input-custom w-full"
              />
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-2 px-4 py-2 border border-purple-300 bg-white hover:bg-purple-50 text-purple-600 rounded-lg transition-all duration-200 font-medium text-sm"
              disabled={loading}
              title="Reset filters"
              style={{
                borderColor: "#e9d5ff",
                color: "#7c3aed",
              }}
            >
              <RotateCcw size={18} />
              <span>Reset</span>
            </button>
          </div>
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
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <p className="empty-state-title">No Approved Events Found</p>
            <p className="empty-state-description">
              Try adjusting your filters or create a new event.
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
                    Program Driven By
                  </th>
                  <th className="px-4 py-3.5 text-center text-sm font-bold text-purple-700">
                    View Activity Details
                  </th>
                  <th className="px-4 py-3.5 text-center text-sm font-bold text-purple-700">
                    Current Status of Report Submission
                  </th>
                  <th className="px-4 py-3.5 text-center text-sm font-bold text-purple-700">
                    Reviewer's Comment
                  </th>
                  <th className="px-4 py-3.5 text-center text-sm font-bold text-purple-700">
                    Download Report
                  </th>
                  <th className="px-4 py-3.5 text-center text-sm font-bold text-purple-700">
                    Action
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
                      <td className="px-4 py-3.5 text-center text-xs font-medium text-gray-700">
                        {eventItem.programDrivenBy || "-"}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <Link
                          to={`/event/${eventItem.id}`}
                          state={{ from: fromPath }}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold text-xs transition-colors inline-block"
                          style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}
                        >
                          View Details
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor:
                              eventItem.status === "approved"
                                ? "#ecfdf5"
                                : eventItem.status === "rejected"
                                  ? "#fff1f1"
                                  : "#eff6ff",
                            color:
                              eventItem.status === "approved"
                                ? "#16a34a"
                                : eventItem.status === "rejected"
                                  ? "#dc2626"
                                  : "#2563eb",
                          }}
                        >
                          {eventItem.status === "approved"
                            ? "Approved"
                            : eventItem.status === "rejected"
                              ? "Rejected"
                              : "Under Review"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center text-xs text-gray-700">
                        {eventItem.rejectionMessage || "NA"}
                      </td>
                      <td className="px-4 py-3.5 text-center text-xs text-gray-700">
                        <button
                          type="button"
                          onClick={() => handleDownloadReport(eventItem)}
                          disabled={Boolean(downloadingEventId)}
                          className="inline-flex items-center justify-center w-9 h-9 rounded-full text-purple-600 transition-colors hover:bg-purple-100"
                          title={
                            downloadingEventId === eventItem.id
                              ? "Preparing detailed report..."
                              : "Download report"
                          }
                        >
                          <Download size={18} />
                        </button>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {eventItem.status === "approved" ||
                        eventItem.status === "rejected" ? (
                          <span className="text-xs text-gray-600 font-semibold">
                            NA
                          </span>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleReview(eventItem.id, "approve")
                              }
                              disabled={processingReview}
                              className="inline-flex items-center gap-1.5 font-semibold text-xs transition-all duration-200"
                              style={{
                                border: processingReview
                                  ? "1.5px solid #16a34a"
                                  : "1.5px solid #16a34a",
                                color: processingReview ? "white" : "#16a34a",
                                background: processingReview
                                  ? "#16a34a"
                                  : "transparent",
                                borderRadius: "999px",
                                padding: "6px 18px",
                                fontSize: "13px",
                                ...(processingReview
                                  ? {
                                      boxShadow:
                                        "0 2px 8px rgba(22,163,74,0.25)",
                                    }
                                  : {}),
                                cursor: processingReview
                                  ? "default"
                                  : "pointer",
                                opacity: processingReview ? 1 : 1,
                              }}
                              onMouseEnter={(e) => {
                                if (!processingReview) {
                                  e.target.style.backgroundColor = "#f0fdf4";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!processingReview) {
                                  e.target.style.backgroundColor =
                                    "transparent";
                                }
                              }}
                            >
                              <Check size={14} />
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => setReviewingEventId(eventItem.id)}
                              disabled={processingReview}
                              className="inline-flex items-center gap-1.5 font-semibold text-xs transition-all duration-200"
                              style={{
                                border: processingReview
                                  ? "1.5px solid #dc2626"
                                  : "1.5px solid #dc2626",
                                color: processingReview ? "white" : "#dc2626",
                                background: processingReview
                                  ? "#dc2626"
                                  : "transparent",
                                borderRadius: "999px",
                                padding: "6px 18px",
                                fontSize: "13px",
                                ...(processingReview
                                  ? {
                                      boxShadow:
                                        "0 2px 8px rgba(220,38,38,0.25)",
                                    }
                                  : {}),
                                cursor: processingReview
                                  ? "default"
                                  : "pointer",
                                opacity: processingReview ? 1 : 1,
                              }}
                              onMouseEnter={(e) => {
                                if (!processingReview) {
                                  e.target.style.backgroundColor = "#fff1f1";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!processingReview) {
                                  e.target.style.backgroundColor =
                                    "transparent";
                                }
                              }}
                            >
                              <X size={14} />
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {reviewingEventId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold mb-4">Review Action</h2>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a rejection message (optional):
            </p>
            <textarea
              value={rejectionMessage}
              onChange={(e) => setRejectionMessage(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-primary focus:outline-none mb-4"
              placeholder="Optional rejection reason..."
            />
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setReviewingEventId(null);
                  setRejectionMessage("");
                }}
                disabled={processingReview}
                className="px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-70"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleReview(reviewingEventId, "reject")}
                disabled={processingReview}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded disabled:opacity-70"
              >
                {processingReview ? "Processing..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

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