import { useEffect, useMemo, useState } from "react";
import { createIicApplied } from "../../../config/api";
import Alert from "../../components/Alert";
import {
  IIC_APPLIED_STORAGE_KEY,
  iicAppliedMaxCharactersByKey,
  iicAppliedDisplayStructure,
  iicAppliedFields,
  iicAppliedMaxWordsByKey,
} from "../../constants/iicApplied";
import { getAuthToken } from "../../utils/auth";

const countWords = (value) => {
  const normalizedValue = String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
  return normalizedValue ? normalizedValue.split(" ").length : 0;
};

const countCharacters = (value) => String(value ?? "").trim().length;

function IicAppliedForm() {
  const fields = useMemo(() => iicAppliedFields, []);
  const fieldsByKey = useMemo(
    () =>
      fields.reduce(
        (accumulator, field) => ({ ...accumulator, [field.key]: field }),
        {},
      ),
    [fields],
  );

  const initialValues = useMemo(
    () =>
      fields.reduce((accumulator, field) => {
        accumulator[field.key] = field.key === "iicVerification" ? "Initiated" : "";
        return accumulator;
      }, {}),
    [fields],
  );

  const [formValues, setFormValues] = useState(() => {
    if (typeof window === "undefined") {
      return initialValues;
    }

    try {
      const rawStoredValues = window.localStorage.getItem(IIC_APPLIED_STORAGE_KEY);
      if (!rawStoredValues) {
        return initialValues;
      }

      const parsedValues = JSON.parse(rawStoredValues);
      if (!parsedValues || typeof parsedValues !== "object") {
        return initialValues;
      }

      const hydratedValues = { ...initialValues };
      fields.forEach((field) => {
        if (!(field.key in parsedValues)) {
          return;
        }

        if (field.type === "file") {
          return;
        }

        hydratedValues[field.key] = String(parsedValues[field.key] ?? "");
      });

      return hydratedValues;
    } catch {
      return initialValues;
    }
  });
  const [errors, setErrors] = useState({});
  const [alertState, setAlertState] = useState({
    isOpen: false,
    message: "",
    severity: "info",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const stepSections = useMemo(
    () =>
      iicAppliedDisplayStructure.map((group) => ({
        ...group,
        fields: group.fields
          .map((fieldKey) => fieldsByKey[fieldKey])
          .filter(Boolean),
      })),
    [fieldsByKey],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storableValues = fields.reduce((accumulator, field) => {
      if (field.type !== "file") {
        accumulator[field.key] = formValues[field.key];
      }
      return accumulator;
    }, {});

    window.localStorage.setItem(IIC_APPLIED_STORAGE_KEY, JSON.stringify(storableValues));
  }, [fields, formValues]);

  const showAlert = (message, severity) => {
    setAlertState({
      isOpen: true,
      message,
      severity,
    });
  };

  const handleChange = (field, value) => {
    if (iicAppliedMaxWordsByKey[field.key]) {
      const limit = iicAppliedMaxWordsByKey[field.key];
      if (countWords(value) > limit) {
        const message = `${field.label} must be ${limit} words or less.`;
        setErrors((previous) => ({ ...previous, [field.key]: message }));
        showAlert(message, "error");
        return;
      }
    }

    if (iicAppliedMaxCharactersByKey[field.key]) {
      const limit = iicAppliedMaxCharactersByKey[field.key];
      if (countCharacters(value) > limit) {
        const message = `${field.label} must be ${limit} characters or less.`;
        setErrors((previous) => ({ ...previous, [field.key]: message }));
        showAlert(message, "error");
        return;
      }
    }

    setFormValues((previous) => ({ ...previous, [field.key]: value }));
    setErrors((previous) => ({ ...previous, [field.key]: "" }));
  };

  const validate = () => {
    const nextErrors = {};

    fields.forEach((field) => {
      const value = formValues[field.key];
      const hasValue =
        field.type === "file"
          ? value instanceof File
          : Boolean(String(value ?? "").trim());

      if (!hasValue) {
        nextErrors[field.key] = `${field.label} is mandatory`;
        return;
      }

      if (iicAppliedMaxWordsByKey[field.key]) {
        const limit = iicAppliedMaxWordsByKey[field.key];
        if (countWords(value) > limit) {
          nextErrors[field.key] = `${field.label} must be ${limit} words or less.`;
        }
      }

      if (iicAppliedMaxCharactersByKey[field.key]) {
        const limit = iicAppliedMaxCharactersByKey[field.key];
        if (countCharacters(value) > limit) {
          nextErrors[field.key] = `${field.label} must be ${limit} characters or less.`;
        }
      }
    });

    const fromDate = formValues.fromDate;
    const toDate = formValues.toDate;
    if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
      nextErrors.toDate = "To Date must be after or equal to From Date.";
    }

    setErrors(nextErrors);
    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      showAlert(
        Object.values(validationErrors)[0] || "Please fill all mandatory fields.",
        "error",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Please login again to continue.");
      }

      const formData = new FormData();
      fields.forEach((field) => {
        const value = formValues[field.key];
        if (field.type === "file") {
          if (value instanceof File) {
            formData.append(field.key, value);
          }
          return;
        }

        formData.append(field.key, String(value ?? ""));
      });

      await createIicApplied(formData, token);
      window.localStorage.removeItem(IIC_APPLIED_STORAGE_KEY);
      setFormValues(initialValues);
      setErrors({});
      setCurrentStepIndex(0);
      showAlert("IIC Applied entry submitted successfully.", "success");
    } catch (error) {
      showAlert(error.message || "Failed to submit IIC Applied entry.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field) => (
    <div key={field.key} className="space-y-1">
      <label className="block text-sm font-medium text-gray-800" htmlFor={field.key}>
        {field.label} <span className="text-red-600">*</span>
      </label>
      {field.type === "select" ? (
        <select
          id={field.key}
          name={field.key}
          value={formValues[field.key]}
          onChange={(event) => handleChange(field, event.target.value)}
          className="w-full rounded border border-gray-300 bg-white p-2 outline-none focus:border-gray-500"
        >
          <option value="">Select an option</option>
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : field.type === "textarea" ? (
        <textarea
          id={field.key}
          name={field.key}
          rows={field.rows || 4}
          value={formValues[field.key]}
          onChange={(event) => handleChange(field, event.target.value)}
          className="w-full rounded border border-gray-300 p-2 outline-none focus:border-gray-500"
        />
      ) : field.type === "file" ? (
        <input
          id={field.key}
          name={field.key}
          type="file"
          accept={field.accept}
          onChange={(event) => handleChange(field, event.target.files?.[0] || "")}
          className="w-full rounded border border-gray-300 bg-white p-2 outline-none focus:border-gray-500"
        />
      ) : (
        <input
          id={field.key}
          name={field.key}
          type={field.type}
          value={formValues[field.key]}
          readOnly={field.readOnly}
          onChange={(event) => handleChange(field, event.target.value)}
          className="w-full rounded border border-gray-300 p-2 outline-none focus:border-gray-500 read-only:bg-gray-100"
        />
      )}
      {iicAppliedMaxWordsByKey[field.key] && (
        <p
          className={`text-xs ${
            countWords(formValues[field.key]) / iicAppliedMaxWordsByKey[field.key] >= 0.8
              ? "text-red-600"
              : "text-gray-500"
          }`}
        >
          {countWords(formValues[field.key])}/{iicAppliedMaxWordsByKey[field.key]}
        </p>
      )}
      {iicAppliedMaxCharactersByKey[field.key] && (
        <p
          className={`text-xs ${
            countCharacters(formValues[field.key]) / iicAppliedMaxCharactersByKey[field.key] >=
            0.8
              ? "text-red-600"
              : "text-gray-500"
          }`}
        >
          {countCharacters(formValues[field.key])}/{iicAppliedMaxCharactersByKey[field.key]}
        </p>
      )}
      {field.type === "file" && formValues[field.key] instanceof File && (
        <p className="text-xs text-gray-500">{formValues[field.key].name}</p>
      )}
      {errors[field.key] && <p className="text-sm text-red-600">{errors[field.key]}</p>}
    </div>
  );

  const isLastStep = currentStepIndex === stepSections.length - 1;
  const stepProgress =
    stepSections.length > 1
      ? (currentStepIndex / (stepSections.length - 1)) * 100
      : 0;

  return (
    <div className="mx-auto w-full max-w-7xl p-2">
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-r from-white via-[#f4fff7] to-white px-5 py-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
              Submit IIC Applied
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[#7a80a6]">
              Submit IIC Applied event details, dates, outcomes, and brochure proof.
            </p>
          </div>
          <div className="rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary">
            {stepSections.length} steps
          </div>
        </div>
      </div>

      <form className="mt-4 space-y-4" onSubmit={handleSubmit} noValidate>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="mt-4 overflow-x-auto">
            <div className="relative min-w-190 px-2 pb-1">
              <div className="absolute left-8 right-8 top-4 h-0.5 bg-gray-300" />
              <div
                className="absolute left-8 top-4 h-0.5 bg-primary transition-all duration-200"
                style={{ width: `calc((100% - 4rem) * ${stepProgress / 100})` }}
              />
              <div className="relative flex items-start justify-between gap-2">
                {stepSections.map((group, index) => {
                  const isActiveStep = index === currentStepIndex;
                  const isCompletedStep = index < currentStepIndex;

                  return (
                    <button
                      key={group.section}
                      type="button"
                      onClick={() => setCurrentStepIndex(index)}
                      className="flex w-28 flex-col items-center text-center"
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
                        {group.section}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {stepSections.map((step, index) => (
          <section
            key={step.section}
            className={`rounded-lg border border-gray-200 bg-white p-4 ${
              index === currentStepIndex ? "block" : "hidden"
            }`}
          >
            <h2 className="text-lg font-medium text-gray-900">{step.section}</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {step.fields.map((field) => renderField(field))}
            </div>
          </section>
        ))}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentStepIndex((previous) => Math.max(0, previous - 1))}
              disabled={currentStepIndex === 0}
              className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() =>
                setCurrentStepIndex((previous) =>
                  Math.min(stepSections.length - 1, previous + 1),
                )
              }
              disabled={isLastStep}
              className="rounded bg-primary px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <button
            type="submit"
            disabled={!isLastStep || isSubmitting}
            className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Submit"}
          </button>
        </div>
      </form>

      <Alert
        isOpen={alertState.isOpen}
        onClose={() => setAlertState((previous) => ({ ...previous, isOpen: false }))}
        severity={alertState.severity}
        message={alertState.message}
        duration={4000}
        position="bottom"
      />
    </div>
  );
}

export default IicAppliedForm;
