import { useEffect, useMemo, useState } from "react";
import { createRdCellNomination } from "../../../config/api";
import Alert from "../../components/Alert";
import SearchableSelect from "../../components/SearchableSelect";
import {
  RD_CELL_NOMINATION_STORAGE_KEY,
  rdCellAttachmentConditionalFields,
  rdCellDisplayStructure,
  rdCellMaxWordsByKey,
  rdCellNominationFields,
} from "../../constants/rdCellNomination";
import { getAuthToken } from "../../utils/auth";

const countWords = (value) => {
  const normalizedValue = String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
  return normalizedValue ? normalizedValue.split(" ").length : 0;
};

function RdCellNominationForm() {
  const fields = useMemo(() => rdCellNominationFields, []);
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
        accumulator[field.key] = field.type === "file" ? null : "";
        return accumulator;
      }, {}),
    [fields],
  );

  const [formValues, setFormValues] = useState(() => {
    if (typeof window === "undefined") {
      return initialValues;
    }

    try {
      const rawStoredValues = window.localStorage.getItem(
        RD_CELL_NOMINATION_STORAGE_KEY,
      );
      if (!rawStoredValues) {
        return initialValues;
      }

      const parsedValues = JSON.parse(rawStoredValues);
      if (!parsedValues || typeof parsedValues !== "object") {
        return initialValues;
      }

      const hydratedValues = { ...initialValues };
      fields.forEach((field) => {
        if (!(field.key in parsedValues) || field.type === "file") {
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
      rdCellDisplayStructure.map((group) => ({
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

    const serializableValues = {};
    fields.forEach((field) => {
      if (field.type === "file") {
        return;
      }

      serializableValues[field.key] = formValues[field.key];
    });

    window.localStorage.setItem(
      RD_CELL_NOMINATION_STORAGE_KEY,
      JSON.stringify(serializableValues),
    );
  }, [fields, formValues]);

  const showAlert = (message, severity) => {
    setAlertState({
      isOpen: true,
      message,
      severity,
    });
  };

  const validateFile = (field, value) => {
    if (!value) {
      return "";
    }

    if (field.accept) {
      const acceptList = field.accept
        .split(",")
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean);
      const fileName = String(value.name ?? "").toLowerCase();
      const isAllowed = acceptList.some((acceptEntry) =>
        acceptEntry.startsWith(".") ? fileName.endsWith(acceptEntry) : false,
      );

      if (!isAllowed) {
        return `Invalid file type. Allowed: ${field.accept}`;
      }
    }

    if (field.maxSizeBytes && value.size > field.maxSizeBytes) {
      const maxMb = Math.round(field.maxSizeBytes / (1024 * 1024));
      return `${field.label} must be ${maxMb}MB or less.`;
    }

    return "";
  };

  const handleChange = (field, value) => {
    if (field.type === "file") {
      const fileError = validateFile(field, value);
      if (fileError) {
        setErrors((previous) => ({ ...previous, [field.key]: fileError }));
        showAlert(fileError, "error");
        return;
      }
    }

    if (rdCellMaxWordsByKey[field.key]) {
      const limit = rdCellMaxWordsByKey[field.key];
      if (countWords(value) > limit) {
        const message = `${field.label} must be ${limit} words or less.`;
        setErrors((previous) => ({ ...previous, [field.key]: message }));
        showAlert(message, "error");
        return;
      }
    }

    setFormValues((previous) => {
      return { ...previous, [field.key]: value };
    });

    setErrors((previous) => ({ ...previous, [field.key]: "" }));
  };

  const validate = () => {
    const nextErrors = {};

    fields.forEach((field) => {
      const value = formValues[field.key];

      if (field.required) {
        const isMissing =
          field.type === "file" ? !value : !String(value ?? "").trim();
        if (isMissing) {
          nextErrors[field.key] = `${field.label} is mandatory`;
          return;
        }
      }

      if (field.type === "number" && String(value ?? "").trim() && Number(value) < 0) {
        nextErrors[field.key] = `${field.label} cannot be negative`;
        return;
      }

      if (field.type === "file" && value) {
        const fileError = validateFile(field, value);
        if (fileError) {
          nextErrors[field.key] = fileError;
          return;
        }
      }

      if (rdCellMaxWordsByKey[field.key]) {
        const limit = rdCellMaxWordsByKey[field.key];
        if (countWords(value) > limit) {
          nextErrors[field.key] = `${field.label} must be ${limit} words or less.`;
        }
      }
    });

    Object.entries(rdCellAttachmentConditionalFields).forEach(
      ([fieldKey, dependencyKey]) => {
        if (String(formValues[dependencyKey] ?? "") !== "Yes") {
          return;
        }

        if (!String(formValues[fieldKey] ?? "").trim()) {
          nextErrors[fieldKey] = `${fieldsByKey[fieldKey]?.label || fieldKey} is mandatory`;
        }
      },
    );

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
          if (value) {
            formData.append(field.key, value);
          }
          return;
        }

        formData.append(field.key, String(value ?? ""));
      });

      await createRdCellNomination(formData, token);
      window.localStorage.removeItem(RD_CELL_NOMINATION_STORAGE_KEY);
      setFormValues(initialValues);
      setErrors({});
      setCurrentStepIndex(0);
      showAlert("R&D Cell nomination submitted successfully.", "success");
    } catch (error) {
      showAlert(
        error.message || "Failed to submit R&D Cell nomination.",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFieldHint = (field) => {
    if (field.type === "file" && field.maxSizeBytes) {
      const maxMb = Math.round(field.maxSizeBytes / (1024 * 1024));
      return (
        <p className="text-xs text-gray-500">
          Allowed: {field.accept} up to {maxMb}MB
        </p>
      );
    }

    if (rdCellMaxWordsByKey[field.key]) {
      return (
        <p className="text-xs text-gray-500">
          Max: {rdCellMaxWordsByKey[field.key]} words
        </p>
      );
    }

    return null;
  };

  const renderField = (field) => (
    <div key={field.key} className="space-y-1">
      <label
        className="block text-sm font-medium text-gray-800"
        htmlFor={field.key}
      >
        {field.label} {field.required && <span className="text-red-600">*</span>}
      </label>

      {field.type === "textarea" && (
        <div className="space-y-1">
          <textarea
            id={field.key}
            name={field.key}
            value={formValues[field.key]}
            onChange={(event) => handleChange(field, event.target.value)}
            className="w-full rounded border border-gray-300 p-2 outline-none focus:border-gray-500"
            rows={4}
          />
          {rdCellMaxWordsByKey[field.key] && (
            <p
              className={`text-xs ${
                countWords(formValues[field.key]) / rdCellMaxWordsByKey[field.key] >= 0.8
                  ? "text-red-600"
                  : "text-gray-500"
              }`}
            >
              {countWords(formValues[field.key])}/{rdCellMaxWordsByKey[field.key]}
            </p>
          )}
        </div>
      )}

      {field.type === "file" && (
        <div className="space-y-1">
          <input
            id={field.key}
            name={field.key}
            type="file"
            accept={field.accept}
            onChange={(event) =>
              handleChange(field, event.target.files?.[0] ?? null)
            }
            className="w-full rounded border border-gray-300 p-2 outline-none focus:border-gray-500"
          />
          {formValues[field.key] instanceof File && (
            <p className="text-xs text-gray-600">
              Selected: {formValues[field.key].name}
            </p>
          )}
        </div>
      )}

      {field.type === "select" && (
        <SearchableSelect
          value={String(formValues[field.key] ?? "")}
          onChange={(nextValue) => handleChange(field, nextValue)}
          options={field.options || []}
          emptyLabel="Select"
          placeholder="Select"
        />
      )}

      {field.type !== "textarea" &&
        field.type !== "file" &&
        field.type !== "select" && (
          <input
            id={field.key}
            name={field.key}
            type={field.type}
            min={field.type === "number" ? "0" : undefined}
            value={formValues[field.key]}
            onChange={(event) => handleChange(field, event.target.value)}
            className="w-full rounded border border-gray-300 p-2 outline-none focus:border-gray-500"
          />
        )}

      {renderFieldHint(field)}
      {errors[field.key] && (
        <p className="text-sm text-red-600">{errors[field.key]}</p>
      )}
    </div>
  );

  const shouldShowField = (fieldKey) => {
    const dependencyKey = rdCellAttachmentConditionalFields[fieldKey];
    if (!dependencyKey) {
      return true;
    }

    return String(formValues[dependencyKey] ?? "") === "Yes";
  };

  const isLastStep = currentStepIndex === stepSections.length - 1;
  const stepProgress =
    stepSections.length > 1
      ? (currentStepIndex / (stepSections.length - 1)) * 100
      : 0;

  return (
    <div className="mx-auto w-full max-w-7xl p-2">
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-r from-white via-[#f5fbff] to-white px-5 py-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
              Submit R & D Cell Nomination
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[#7a80a6]">
              Submit your nomination with proposal details, expected impact, and
              supporting documents.
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
              {step.fields
                .filter((field) => shouldShowField(field.key))
                .map((field) => renderField(field))}
            </div>
          </section>
        ))}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setCurrentStepIndex((previous) => Math.max(0, previous - 1))
              }
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
        onClose={() =>
          setAlertState((previous) => ({ ...previous, isOpen: false }))
        }
        severity={alertState.severity}
        message={alertState.message}
        duration={4000}
        position="bottom"
      />
    </div>
  );
}

export default RdCellNominationForm;
