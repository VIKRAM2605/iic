import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { BACKEND_BASE_URL, getIicAppliedById, reviewIicAppliedByAdmin } from "../../../config/api";
import Alert from "../../components/Alert";
import { iicAppliedDetailSteps, iicAppliedFieldLabels } from "../../constants/iicApplied";
import { getAuthToken, getAuthUser } from "../../utils/auth";

const statusBadgeClass = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const prettifyKey = (key) =>
  String(key || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());

const renderValue = (value) => {
  if (value === null || value === undefined) return "-";
  if (typeof value === "object") {
    const objectValue = JSON.stringify(value);
    return objectValue && objectValue !== "{}" ? objectValue : "-";
  }
  const textValue = String(value).trim();
  return textValue || "-";
};

const toAttachmentUrl = (value) => {
  const normalizedValue = String(value ?? "").trim().replace(/\\/g, "/");
  if (!normalizedValue) return "";
  return normalizedValue.startsWith("http")
    ? normalizedValue
    : `${BACKEND_BASE_URL}/${normalizedValue.replace(/^\/+/, "")}`;
};

const renderDetails = (details = {}) =>
  Object.entries(details).map(([key, value]) => (
    <div key={key} className="rounded-md border border-gray-200 p-3">
      <p className="text-xs font-semibold uppercase text-gray-500">
        {iicAppliedFieldLabels[key] || prettifyKey(key)}
      </p>
      {key === "brochureFile" && value ? (
        <a
          href={toAttachmentUrl(value)}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-block text-sm font-medium text-primary hover:underline"
        >
          View uploaded brochure
        </a>
      ) : (
        <p className="mt-1 wrap-break-word text-sm text-gray-800">{renderValue(value)}</p>
      )}
    </div>
  ));

export default function IicAppliedDetails() {
  const { appliedId } = useParams();
  const location = useLocation();
  const token = useMemo(() => getAuthToken(), []);
  const user = useMemo(() => getAuthUser(), []);
  const isAdmin = user?.roleName === "admin";
  const backTo =
    typeof location.state?.from === "string" && location.state.from.startsWith("/")
      ? location.state.from
      : isAdmin
        ? "/admin/iic-applied-review"
        : "/teacher/iic-applied";

  const [appliedData, setAppliedData] = useState(null);
  const [activeDetailStep, setActiveDetailStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [rejectMessage, setRejectMessage] = useState("");
  const [processingReview, setProcessingReview] = useState(false);
  const [alertState, setAlertState] = useState({
    isOpen: false,
    message: "",
    severity: "info",
  });

  const detailStepProgress =
    iicAppliedDetailSteps.length > 1
      ? (activeDetailStep / (iicAppliedDetailSteps.length - 1)) * 100
      : 0;

  useEffect(() => {
    const loadEntry = async () => {
      if (!appliedId) return;
      setLoading(true);
      try {
        const payload = await getIicAppliedById({ token, appliedId });
        setAppliedData(payload.data || null);
        setRejectMessage(payload.data?.rejectionMessage || "");
        setActiveDetailStep(0);
      } catch (error) {
        setAlertState({
          isOpen: true,
          message: error.message || "Failed to fetch details.",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    loadEntry();
  }, [appliedId, token]);

  const handleReview = async (action) => {
    if (!isAdmin || !appliedId) return;
    setProcessingReview(true);
    try {
      const payload = await reviewIicAppliedByAdmin({
        token,
        appliedId,
        action,
        rejectionMessage: rejectMessage,
      });

      const reviewData = payload?.data || {};
      setAppliedData((previous) =>
        previous
          ? {
              ...previous,
              status: reviewData.status || previous.status,
              rejectionMessage:
                reviewData.rejection_message !== undefined
                  ? reviewData.rejection_message
                  : previous.rejectionMessage,
              reviewedAt: reviewData.reviewed_at || previous.reviewedAt,
              approvedAt: reviewData.approved_at || previous.approvedAt,
              rejectedAt: reviewData.rejected_at || previous.rejectedAt,
            }
          : previous,
      );

      if (action === "approve") setRejectMessage("");

      setAlertState({
        isOpen: true,
        message: payload.message || "Entry updated.",
        severity: "success",
      });
    } catch (error) {
      setAlertState({
        isOpen: true,
        message: error.message || "Failed to update review.",
        severity: "error",
      });
    } finally {
      setProcessingReview(false);
    }
  };

  return (
    <section className="-m-6 min-h-full bg-white px-6 py-5">
      <div className="mb-4 flex items-center justify-between">
        <Link to={backTo} className="text-sm font-medium text-primary hover:underline">
          Back
        </Link>
        {appliedData?.status && (
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
              statusBadgeClass[appliedData.status] || "bg-gray-100 text-gray-700"
            }`}
          >
            {appliedData.status}
          </span>
        )}
      </div>

      {loading && <div className="text-sm text-gray-500">Loading...</div>}

      {!loading && appliedData && (
        <div className="space-y-6">
          <div className="rounded-md border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900">
              {appliedData.eventName || `Entry #${appliedData.id}`}
            </h2>
            <div className="mt-4 grid gap-3 text-xs text-gray-700 md:grid-cols-2 xl:grid-cols-4">
              <p><span className="font-semibold">Name of the event:</span> {appliedData.eventName || "-"}</p>
              <p><span className="font-semibold">Team Involved:</span> {appliedData.appliedDetails?.serviceRole || "-"}</p>
              <p><span className="font-semibold">Type of event:</span> {appliedData.appliedDetails?.serviceFocusArea || "-"}</p>
              <p><span className="font-semibold">Equipments:</span> {appliedData.appliedDetails?.equipments || "-"}</p>
              <p><span className="font-semibold">From Date:</span> {appliedData.appliedDetails?.fromDate || "-"}</p>
              <p><span className="font-semibold">To Date:</span> {appliedData.appliedDetails?.toDate || "-"}</p>
              <p><span className="font-semibold">IIC verification:</span> {appliedData.appliedDetails?.iicVerification || "-"}</p>
              <p><span className="font-semibold">Owner:</span> {appliedData.ownerName || "-"}</p>
              <p><span className="font-semibold">Owner Email:</span> {appliedData.ownerEmail || "-"}</p>
              <p><span className="font-semibold">Submitted:</span> {appliedData.createdAt ? new Date(appliedData.createdAt).toLocaleDateString() : "-"}</p>
              <p><span className="font-semibold">Rejection Msg:</span> {appliedData.rejectionMessage || "-"}</p>
            </div>
          </div>

          {isAdmin && (
            <div className="rounded-md border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900">Review Action</h3>
              <textarea
                value={rejectMessage}
                onChange={(event) => setRejectMessage(event.target.value)}
                rows={4}
                className="mt-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                placeholder="Optional rejection message"
              />
              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleReview("approve")}
                  disabled={processingReview}
                  className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-70"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => handleReview("reject")}
                  disabled={processingReview}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-70"
                >
                  Reject
                </button>
              </div>
            </div>
          )}

          <div className="rounded-md border border-gray-200 p-5">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Detailed Information</h3>

            <div className="mb-4 overflow-x-auto">
              <div className="relative min-w-190 px-2 pb-1">
                <div className="absolute left-8 right-8 top-4 h-0.5 bg-gray-300" />
                <div
                  className="absolute left-8 top-4 h-0.5 bg-primary transition-all duration-200"
                  style={{ width: `calc((100% - 4rem) * ${detailStepProgress / 100})` }}
                />
                <div className="relative flex items-start justify-between gap-2">
                  {iicAppliedDetailSteps.map((step, index) => {
                    const isActiveStep = index === activeDetailStep;
                    const isCompletedStep = index < activeDetailStep;

                    return (
                      <button
                        key={step.key}
                        type="button"
                        onClick={() => setActiveDetailStep(index)}
                        className="flex w-24 flex-col items-center text-center"
                      >
                        <span
                          className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold ${
                            isActiveStep || isCompletedStep
                              ? "border-primary bg-primary text-white"
                              : "border-gray-300 bg-white text-gray-600"
                          }`}
                        >
                          {index + 1}
                        </span>
                        <span
                          className={`mt-2 text-xs ${
                            isActiveStep ? "font-semibold text-primary" : "text-gray-600"
                          }`}
                        >
                          {step.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {renderDetails(appliedData[iicAppliedDetailSteps[activeDetailStep]?.key] || {})}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveDetailStep((previous) => Math.max(0, previous - 1))}
                disabled={activeDetailStep === 0}
                className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-xs text-gray-500">
                Step {activeDetailStep + 1} of {iicAppliedDetailSteps.length}
              </span>
              <button
                type="button"
                onClick={() =>
                  setActiveDetailStep((previous) =>
                    Math.min(iicAppliedDetailSteps.length - 1, previous + 1),
                  )
                }
                disabled={activeDetailStep === iicAppliedDetailSteps.length - 1}
                className="rounded bg-primary px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      <Alert
        isOpen={alertState.isOpen}
        onClose={() => setAlertState((previous) => ({ ...previous, isOpen: false }))}
        severity={alertState.severity}
        message={alertState.message}
      />
    </section>
  );
}
