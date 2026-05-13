import { useEffect, useMemo, useState } from "react";
import { createRdEquipmentsService } from "../../../config/api";
import Alert from "../../components/Alert";
import SearchableSelect from "../../components/SearchableSelect";
import {
  RD_EQUIPMENTS_SERVICES_STORAGE_KEY,
  rdEquipmentsServicesAttachmentConditionalFields,
  rdEquipmentsServicesDisplayStructure,
  rdEquipmentsServicesFields,
  rdEquipmentsServicesMaxWordsByKey,
} from "../../constants/rdEquipmentsServices";
import { getAuthToken } from "../../utils/auth";

const countWords = (value) => {
  const normalizedValue = String(value ?? "").trim().replace(/\s+/g, " ");
  return normalizedValue ? normalizedValue.split(" ").length : 0;
};

function RdEquipmentsServicesForm() {
  const fields = useMemo(() => rdEquipmentsServicesFields, []);
  const fieldsByKey = useMemo(
    () => fields.reduce((accumulator, field) => ({ ...accumulator, [field.key]: field }), {}),
    [fields],
  );
  const initialValues = useMemo(
    () =>
      fields.reduce((accumulator, field) => {
        accumulator[field.key] = "";
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
        RD_EQUIPMENTS_SERVICES_STORAGE_KEY,
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
        if (field.key in parsedValues) {
          hydratedValues[field.key] = String(parsedValues[field.key] ?? "");
        }
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
      rdEquipmentsServicesDisplayStructure.map((group) => ({
        ...group,
        fields: group.fields.map((fieldKey) => fieldsByKey[fieldKey]).filter(Boolean),
      })),
    [fieldsByKey],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      RD_EQUIPMENTS_SERVICES_STORAGE_KEY,
      JSON.stringify(formValues),
    );
  }, [formValues]);

  const showAlert = (message, severity) => {
    setAlertState({ isOpen: true, message, severity });
  };

  const handleChange = (field, value) => {
    if (rdEquipmentsServicesMaxWordsByKey[field.key]) {
      const limit = rdEquipmentsServicesMaxWordsByKey[field.key];
      if (countWords(value) > limit) {
        const message = `${field.label} must be ${limit} words or less.`;
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
      if (field.required && !String(value ?? "").trim()) {
        nextErrors[field.key] = `${field.label} is mandatory`;
        return;
      }

      if (rdEquipmentsServicesMaxWordsByKey[field.key]) {
        const limit = rdEquipmentsServicesMaxWordsByKey[field.key];
        if (countWords(value) > limit) {
          nextErrors[field.key] = `${field.label} must be ${limit} words or less.`;
        }
      }
    });

    Object.entries(rdEquipmentsServicesAttachmentConditionalFields).forEach(
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
      showAlert(Object.values(validationErrors)[0], "error");
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
        formData.append(field.key, String(formValues[field.key] ?? ""));
      });

      await createRdEquipmentsService(formData, token);
      window.localStorage.removeItem(RD_EQUIPMENTS_SERVICES_STORAGE_KEY);
      setFormValues(initialValues);
      setErrors({});
      setCurrentStepIndex(0);
      showAlert("R&D Equipments Services entry submitted successfully.", "success");
    } catch (error) {
      showAlert(
        error.message || "Failed to submit R&D Equipments Services entry.",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFieldHint = (field) => {
    if (rdEquipmentsServicesMaxWordsByKey[field.key]) {
      return (
        <p className="text-xs text-gray-500">
          Max: {rdEquipmentsServicesMaxWordsByKey[field.key]} words
        </p>
      );
    }

    return null;
  };

  const renderField = (field) => (
    <div key={field.key} className="space-y-1">
      <label className="block text-sm font-medium text-gray-800" htmlFor={field.key}>
        {field.label} {field.required && <span className="text-red-600">*</span>}
      </label>

      {field.type === "select" ? (
        <SearchableSelect
          value={String(formValues[field.key] ?? "")}
          onChange={(nextValue) => handleChange(field, nextValue)}
          options={field.options || []}
          emptyLabel="Select"
          placeholder="Select"
        />
      ) : (
        <input
          id={field.key}
          name={field.key}
          type={field.type}
          value={formValues[field.key]}
          onChange={(event) => handleChange(field, event.target.value)}
          className="w-full rounded border border-gray-300 p-2 outline-none focus:border-gray-500"
        />
      )}

      {renderFieldHint(field)}
      {errors[field.key] && <p className="text-sm text-red-600">{errors[field.key]}</p>}
    </div>
  );

  const shouldShowField = (fieldKey) => {
    const dependencyKey = rdEquipmentsServicesAttachmentConditionalFields[fieldKey];
    if (!dependencyKey) {
      return true;
    }

    return String(formValues[dependencyKey] ?? "") === "Yes";
  };

  const isLastStep = currentStepIndex === stepSections.length - 1;
  const stepProgress =
    stepSections.length > 1 ? (currentStepIndex / (stepSections.length - 1)) * 100 : 0;

  return (
    <div className="mx-auto w-full max-w-7xl p-2">
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-r from-white via-[#f5fbff] to-white px-5 py-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
              Submit R & D Equipments Services
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[#7a80a6]">
              Submit your R & D equipments services details for faculty review and repository tracking.
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
                {stepSections.map((group, index) => (
                  <button
                    key={group.section}
                    type="button"
                    onClick={() => setCurrentStepIndex(index)}
                    className="flex w-28 flex-col items-center text-center"
                  >
                    <span
                      className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold ${
                        index <= currentStepIndex
                          ? "border-primary bg-primary text-white"
                          : "border-gray-300 bg-white text-gray-600"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span
                      className={`mt-2 text-xs ${
                        index === currentStepIndex
                          ? "font-semibold text-primary"
                          : "text-gray-600"
                      }`}
                    >
                      {group.section}
                    </span>
                  </button>
                ))}
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
              {step.fields.filter((field) => shouldShowField(field.key)).map((field) => renderField(field))}
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
                setCurrentStepIndex((previous) => Math.min(stepSections.length - 1, previous + 1))
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

export default RdEquipmentsServicesForm;
