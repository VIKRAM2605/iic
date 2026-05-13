import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CirclePlus, Download } from "lucide-react";
import { jsPDF } from "jspdf";
import {
  getAdminApprovedIicApplied,
  getAdminApprovedIicAppliedFilterOptions,
  getIicAppliedById,
} from "../../../config/api";
import Alert from "../../components/Alert";
import SearchableSelect from "../../components/SearchableSelect";
import { iicAppliedDetailSteps } from "../../constants/iicApplied";
import { getAuthToken } from "../../utils/auth";

const toLabel = (key) =>
  String(key || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());

const toDisplayValue = (value) => {
  if (value === null || value === undefined) return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
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
    if (y + requiredHeight <= pageHeight - 14) return;
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
    if (entries.length === 0) return;

    ensureSpace(12);
    doc.setFillColor(236, 255, 245);
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

export default function AdminIicAppliedApprovedDashboard() {
  const token = useMemo(() => getAuthToken(), []);
  const location = useLocation();
  const [facultyName, setFacultyName] = useState("");
  const [options, setOptions] = useState({ faculties: [] });
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState([]);
  const [downloadingId, setDownloadingId] = useState(null);
  const [alertState, setAlertState] = useState({
    isOpen: false,
    message: "",
    severity: "info",
  });

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [entriesPayload, optionsPayload] = await Promise.all([
          getAdminApprovedIicApplied({ token, includeRejected: true }),
          getAdminApprovedIicAppliedFilterOptions(token, { includeRejected: true }),
        ]);

        setEntries(entriesPayload.data || []);
        setOptions({ faculties: optionsPayload.data?.faculties || [] });
      } catch (error) {
        setAlertState({
          isOpen: true,
          message: error.message || "Failed to fetch IIC Applied entries.",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [token]);

  const filteredEntries = useMemo(
    () =>
      entries.filter((item) => {
        if (!facultyName) return true;
        const searchableFields = [
          item.ownerName,
          item.ownerEmail,
          item.eventName,
          item.serviceRole,
          item.serviceFocusArea,
          item.equipments,
          item.eventObjective,
          item.outcomeSkill,
          item.iicVerification,
        ]
          .filter(Boolean)
          .map((value) => String(value).toLowerCase());

        return searchableFields.some((value) =>
          value.includes(facultyName.toLowerCase()),
        );
      }),
    [entries, facultyName],
  );

  const handleDownloadReport = async (item) => {
    if (!token) return;
    setDownloadingId(item.id);
    try {
      const payload = await getIicAppliedById({
        token,
        appliedId: item.id,
      });
      const appliedData = payload?.data || {};
      const title =
        appliedData?.appliedDetails?.serviceName ||
        item.eventName ||
        `IIC_Applied_${item.id}`;

      downloadPdfReport({
        title,
        fallbackName: `IIC_Applied_${item.id}`,
        sections: iicAppliedDetailSteps.map((step) => ({
          label: step.label,
          data: appliedData?.[step.key],
        })),
      });

      setAlertState({
        isOpen: true,
        message: "IIC Applied report downloaded successfully.",
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
            <h1 className="heading-xl">IIC Applied</h1>
            <p className="text-muted">
              Review approved and rejected IIC Applied entries
            </p>
          </div>

          <Link
            to="/iicapplied"
            className="btn-primary-custom inline-flex items-center gap-2 whitespace-nowrap"
          >
            <CirclePlus size={18} strokeWidth={2.25} />
            <span>New Entry</span>
          </Link>
        </div>
      </div>

      <div className="border-b border-gray-200 bg-white px-8 py-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <SearchableSelect
            label="Faculty Name"
            value={facultyName}
            onChange={setFacultyName}
            options={options.faculties}
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
            {filteredEntries.length} entr{filteredEntries.length !== 1 ? "ies" : "y"}
          </span>
        </div>

        {!loading && filteredEntries.length === 0 && (
          <div className="empty-state">
            <p className="empty-state-title">No Entries Found</p>
            <p className="empty-state-description">Try adjusting your filters.</p>
          </div>
        )}

        {filteredEntries.length > 0 && (
          <div
            className="overflow-x-auto rounded-xl bg-white"
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}
          >
            <table className="w-full border-collapse">
              <thead>
                <tr
                  className="border-b border-emerald-100"
                  style={{ backgroundColor: "#ecfff5" }}
                >
                  <th className="px-4 py-3.5 text-left text-sm font-bold text-emerald-700">S.No.</th>
                  <th className="px-4 py-3.5 text-left text-sm font-bold text-emerald-700">Name of the event</th>
                  <th className="px-4 py-3.5 text-left text-sm font-bold text-emerald-700">Team Involved</th>
                  <th className="px-4 py-3.5 text-left text-sm font-bold text-emerald-700">Type of event</th>
                  <th className="px-4 py-3.5 text-left text-sm font-bold text-emerald-700">Equipments</th>
                  <th className="px-4 py-3.5 text-left text-sm font-bold text-emerald-700">Event Dates</th>
                  <th className="px-4 py-3.5 text-center text-sm font-bold text-emerald-700">Status</th>
                  <th className="px-4 py-3.5 text-left text-sm font-bold text-emerald-700">IIC Verification</th>
                  <th className="px-4 py-3.5 text-left text-sm font-bold text-emerald-700">Review Comments</th>
                  <th className="px-4 py-3.5 text-center text-sm font-bold text-emerald-700">Download Report</th>
                  <th className="px-4 py-3.5 text-center text-sm font-bold text-emerald-700">View Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((item, index) => (
                  <tr
                    key={item.id}
                    className={`border-b border-emerald-100 transition-colors ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-emerald-50`}
                  >
                    <td className="px-4 py-3.5 text-xs font-medium text-gray-600">{index + 1}</td>
                    <td className="px-4 py-3.5 text-xs font-semibold text-gray-900">
                      {item.eventName || `Entry #${item.id}`}
                    </td>
                    <td className="px-4 py-3.5 text-xs font-medium text-gray-700">{item.serviceRole || "-"}</td>
                    <td className="px-4 py-3.5 text-xs text-gray-700">{item.serviceFocusArea || "-"}</td>
                    <td className="px-4 py-3.5 text-xs text-gray-700">{item.equipments || "-"}</td>
                    <td className="px-4 py-3.5 text-xs text-gray-700">
                      <div className="mt-1 text-[11px] text-gray-500">From: {item.fromDate || "-"}</div>
                      <div className="mt-1 text-[11px] text-gray-500">To: {item.toDate || "-"}</div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                          item.status === "rejected"
                            ? "bg-red-50 text-red-700"
                            : "bg-green-50 text-green-700"
                        }`}
                      >
                        {item.status || "approved"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-700">{item.iicVerification || "-"}</td>
                    <td className="px-4 py-3.5 text-xs text-gray-700">{item.rejectionMessage || "-"}</td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleDownloadReport(item)}
                        disabled={downloadingId === item.id}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        <Download size={14} />
                        <span>{downloadingId === item.id ? "Downloading..." : "Download Report"}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <Link
                        to={`/iic-applied/${item.id}`}
                        state={{ from: fromPath }}
                        className="inline-block rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
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
        onClose={() => setAlertState((previous) => ({ ...previous, isOpen: false }))}
        severity={alertState.severity}
        message={alertState.message}
      />
    </section>
  );
}
