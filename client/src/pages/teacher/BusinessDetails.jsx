import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createBusinessDetails } from "../../../config/api";
import { getAuthToken, getAuthUser } from "../../utils/auth";
import Alert from "../../components/Alert";
import SearchableSelect from "../../components/SearchableSelect";

const BUSINESS_DETAILS_STORAGE_KEY = "business-details-form-values";

const countWords = (value) => {
  const normalizedValue = String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
  return normalizedValue ? normalizedValue.split(" ").length : 0;
};

const businessFields = [
  {
    key: "innovationTitle",
    label: "Start-up / Venture Name",
    type: "text",
    required: true,
  },
  {
    key: "instituteName",
    label: "Website of Startup",
    type: "url",
    required: false,
  },
  {
    key: "registrationType",
    label: "Startup / Venture Registered As",
    type: "select",
    required: true,
    options: [
      "Not Yet Registered as an Entity",
      "SME Registered Unit (Valid GST No.)",
      "Registered Partnership Firm",
      "Limited Liability Partnership (LLP)",
      "Private Limited Firm",
      "One Person Company (OPC)",
    ],
  },
  {
    key: "fyOfDevelopment",
    label: "Financial Year of Development",
    type: "select",
    required: true,
    options: [
      "2019-20",
      "2020-21",
      "2021-22",
      "2022-23",
      "2023-24",
      "2024-25",
      "2025-26",
      "2026-27",
    ],
  },
  {
    key: "sectorDomain",
    label: "Sector / Domain",
    type: "select",
    required: true,
    options: [
      "Healthcare & Biomedical devices.",
      "Agriculture & Rural Development.",
      "Smart Vehicles / Electric Vehicle Technology.",
      "Food Processing / Nutrition / Biotech",
      "Robotics and Drones.",
      "Waste Management / Waste to Wealth Creation",
      "Clean & Potable Water.",
      "Renewable and Affordable Energy.",
      "IoT based technologies",
      "ICT / Blockchain / Cloud / AI / ML",
      "Software - Mobile App Development",
      "Software - Web App Development",
      "Smart Education",
      "Smart Cities",
      "Sports & Fitness",
      "Sustainable Environment",
      "Manufacturing",
      "Defence & Security",
      "Consumer Goods and Retail",
      "Education",
    ],
  },
  {
    key: "developedAsPartOf",
    label: "Developed As Part Of",
    type: "select",
    required: true,
    options: [
      "Academic Requirement / Study Project",
      "Academic Research Assignment / Industry Sponsored Project",
      "Independent Assignment / Non-academic Study Project",
    ],
  },
  {
    key: "innovationType",
    label: "Innovation Type",
    type: "select",
    required: true,
    options: [
      "Product",
      "Process",
      "Service",
      "Market Place",
      "Business / Management Innovation",
    ],
  },
  {
    key: "developmentStage",
    label: "Development Stage - TRL",
    type: "select",
    required: true,
    options: [
      "TRL 4: Small scale prototype built in a laboratory environment",
      "TRL 5: Large scale prototype tested in intended environment",
      "TRL 6: Prototype system tested close to expected performance",
      "TRL 7: Demonstration system at pre-commercial scale",
      "TRL 8: First commercial system",
      "TRL 9: Full commercial application",
    ],
  },
  {
    key: "developmentStageMrl",
    label: "Development Stage - MRL",
    type: "select",
    required: true,
    options: [
      "MRL 1: Basic manufacturing implications identified",
      "MRL 2: Manufacturing concepts identified",
      "MRL 3: Manufacturing proof of concept developed",
      "MRL 4: Capability to produce in a laboratory environment",
      "MRL 5: Capability to produce prototype components",
      "MRL 6: Capability to produce a prototype system",
      "MRL 7: Production representative environment",
      "MRL 8: Pilot line capability demonstrated",
      "MRL 9: Low rate production demonstrated",
      "MRL 10: Full rate production demonstrated",
    ],
  },
  {
    key: "developmentStageIrl",
    label: "Development Stage - IRL",
    type: "select",
    required: true,
    options: [
      "IRL 1: Basic Research",
      "IRL 2: Applied Research",
      "IRL 3: Problem - Solution Fit Validated",
      "IRL 4: Low-fidelity MVP",
      "IRL 5: Product-Market Fit Validation",
      "IRL 6: Business / Revenue Model Validation",
      "IRL 7: High Fidelity MVP",
      "IRL 8: Pre-Commercial Demonstration",
      "IRL 9: Full Commercial Development",
    ],
  },
  {
    key: "problemRelevance",
    label: "Problem - Solution Fit",
    type: "textarea",
    required: true,
  },
  {
    key: "solutionDescription",
    label: "Product - Market Fit",
    type: "textarea",
    required: true,
  },
  {
    key: "uniquenessFeatures",
    label: "Market Size and Target Segment",
    type: "textarea",
    required: true,
  },
  {
    key: "competitorDifference",
    label: "Business Fit and Traction",
    type: "textarea",
    required: true,
  },
  {
    key: "ipPatentAssociated",
    label: "Is any IP / Patent associated with the Startup?",
    type: "select",
    required: true,
    options: ["Yes", "No"],
  },
  {
    key: "ipPatentDocument",
    label: "Upload IP / Patent Document",
    type: "file",
    required: false,
    accept: ".jpg,.jpeg,.png",
    maxSizeBytes: 2 * 1024 * 1024,
  },
  {
    key: "innovationGrantSupport",
    label: "Any recognitions / awards received?",
    type: "select",
    required: true,
    options: ["Yes", "No"],
  },
  {
    key: "innovationGrantDocument",
    label: "Upload Recognition / Award Document",
    type: "file",
    required: false,
    accept: ".jpg,.jpeg,.png",
    maxSizeBytes: 2 * 1024 * 1024,
  },
  {
    key: "incubationSupportReceived",
    label: "Received innovation grant from external sources?",
    type: "select",
    required: true,
    options: ["Yes", "No"],
  },
  {
    key: "incubationUnitName",
    label: "Pre-Incubation / Incubation Unit Name",
    type: "text",
    required: false,
  },
  {
    key: "instituteGrantAmount",
    label: "Total Grant Amount Received",
    type: "text",
    required: false,
  },
  {
    key: "angelInvestment",
    label: "Raised Angel / Venture Capital Investment?",
    type: "select",
    required: true,
    options: ["Yes", "No"],
  },
  {
    key: "investmentAmount",
    label: "Total Investment Amount Received",
    type: "text",
    required: false,
  },
  {
    key: "innovationVideoUrl",
    label: "Video URL",
    type: "url",
    required: false,
  },
  {
    key: "innovationPhotograph",
    label: "Upload Photograph",
    type: "file",
    required: false,
    accept: ".jpg,.jpeg,.png",
    maxSizeBytes: 2 * 1024 * 1024,
  },
];

const displayStructure = [
  {
    section: "Business Details",
    fields: [
      "innovationTitle",
      "instituteName",
      "registrationType",
      "fyOfDevelopment",
      "sectorDomain",
      "developedAsPartOf",
      "innovationType",
      "developmentStage",
      "developmentStageMrl",
      "developmentStageIrl",
    ],
  },
  {
    section: "Overview",
    fields: [
      "problemRelevance",
      "solutionDescription",
      "uniquenessFeatures",
      "competitorDifference",
    ],
  },
  {
    section: "Attachments",
    fields: [
      "ipPatentAssociated",
      "ipPatentDocument",
      "innovationGrantSupport",
      "innovationGrantDocument",
      "incubationSupportReceived",
      "incubationUnitName",
      "instituteGrantAmount",
      "angelInvestment",
      "investmentAmount",
      "innovationPhotograph",
      "innovationVideoUrl",
    ],
  },
];

const attachmentConditionalFields = {
  ipPatentDocument: "ipPatentAssociated",
  innovationGrantDocument: "innovationGrantSupport",
  incubationUnitName: "incubationSupportReceived",
  instituteGrantAmount: "incubationSupportReceived",
  investmentAmount: "angelInvestment",
};

function BusinessDetails() {
  const navigate = useNavigate();
  const fields = useMemo(() => businessFields, []);
  const fieldsByKey = useMemo(
    () =>
      fields.reduce(
        (accumulator, field) => ({ ...accumulator, [field.key]: field }),
        {},
      ),
    [fields],
  );
  const structuredSections = useMemo(() => {
    const renderedKeys = new Set();

    return displayStructure
      .map((section) => {
        const sectionFields = section.fields
          .map((fieldKey) => fieldsByKey[fieldKey])
          .filter(Boolean)
          .filter((field) => {
            if (renderedKeys.has(field.key)) {
              return false;
            }

            renderedKeys.add(field.key);
            return true;
          });

        return {
          section: section.section,
          fields: sectionFields,
        };
      })
      .filter((section) => section.fields.length > 0);
  }, [fieldsByKey]);

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
        BUSINESS_DETAILS_STORAGE_KEY,
      );
      if (!rawStoredValues) {
        return initialValues;
      }

      const parsedValues = JSON.parse(rawStoredValues);
      if (!parsedValues || typeof parsedValues !== "object") {
        return initialValues;
      }

      return fields.reduce((accumulator, field) => {
        if (field.type === "file") {
          accumulator[field.key] = null;
        } else {
          accumulator[field.key] = String(parsedValues[field.key] ?? "");
        }
        return accumulator;
      }, {});
    } catch {
      return initialValues;
    }
  });
  const [errors, setErrors] = useState({});
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertSeverity, setAlertSeverity] = useState("success");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const maxWordsByKey = {
    innovationTitle: 20,
    problemRelevance: 100,
    solutionDescription: 100,
    uniquenessFeatures: 100,
    competitorDifference: 100,
  };

  useEffect(() => {
    if (currentStepIndex > structuredSections.length - 1) {
      setCurrentStepIndex(Math.max(0, structuredSections.length - 1));
    }
  }, [currentStepIndex, structuredSections.length]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const serializableValues = {};
    fields.forEach((field) => {
      if (field.type !== "file") {
        serializableValues[field.key] = formValues[field.key];
      }
    });

    window.localStorage.setItem(
      BUSINESS_DETAILS_STORAGE_KEY,
      JSON.stringify(serializableValues),
    );
  }, [fields, formValues]);

  const handleChange = (field, value) => {
    if (field.type === "file" && value && field.accept) {
      const acceptList = field.accept
        .split(",")
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean);
      const fileName = String(value.name ?? "").toLowerCase();
      const fileType = String(value.type ?? "").toLowerCase();
      const isAllowed = acceptList.some((acceptEntry) => {
        if (acceptEntry.startsWith(".")) {
          return fileName.endsWith(acceptEntry);
        }
        return acceptEntry === fileType;
      });

      if (!isAllowed) {
        setErrors((previous) => ({
          ...previous,
          [field.key]: `Invalid file type. Allowed: ${field.accept}`,
        }));
        return;
      }
    }

    if (
      field.type === "file" &&
      value &&
      field.maxSizeBytes &&
      value.size > field.maxSizeBytes
    ) {
      const maxMb = Math.round(field.maxSizeBytes / (1024 * 1024));
      setErrors((previous) => ({
        ...previous,
        [field.key]: `${field.label} must be ${maxMb}MB or less.`,
      }));
      return;
    }

    if (maxWordsByKey[field.key] && countWords(value) > maxWordsByKey[field.key]) {
      setErrors((previous) => ({
        ...previous,
        [field.key]: `${field.label} must be ${maxWordsByKey[field.key]} words or less.`,
      }));
      return;
    }

    setFormValues((previous) => {
      const nextValues = { ...previous, [field.key]: value };

      if (field.key === "ipPatentAssociated" && value !== "Yes") {
        nextValues.ipPatentDocument = null;
      }

      if (field.key === "innovationGrantSupport" && value !== "Yes") {
        nextValues.innovationGrantDocument = null;
      }

      if (field.key === "incubationSupportReceived" && value !== "Yes") {
        nextValues.incubationUnitName = "";
        nextValues.instituteGrantAmount = "";
      }

      if (field.key === "angelInvestment" && value !== "Yes") {
        nextValues.investmentAmount = "";
      }

      return nextValues;
    });

    setErrors((previous) => {
      const nextErrors = { ...previous, [field.key]: "" };

      if (field.key === "ipPatentAssociated" && value !== "Yes") {
        nextErrors.ipPatentDocument = "";
      }

      if (field.key === "innovationGrantSupport" && value !== "Yes") {
        nextErrors.innovationGrantDocument = "";
      }

      if (field.key === "incubationSupportReceived" && value !== "Yes") {
        nextErrors.incubationUnitName = "";
        nextErrors.instituteGrantAmount = "";
      }

      if (field.key === "angelInvestment" && value !== "Yes") {
        nextErrors.investmentAmount = "";
      }

      return nextErrors;
    });
  };

  const validate = () => {
    const nextErrors = {};

    fields.forEach((field) => {
      if (!field.required) {
        return;
      }

      const value = formValues[field.key];
      const isMissing =
        field.type === "file" ? !value : !String(value ?? "").trim();

      if (isMissing) {
        nextErrors[field.key] = `${field.label} is mandatory`;
        return;
      }

      if (maxWordsByKey[field.key] && countWords(value) > maxWordsByKey[field.key]) {
        nextErrors[field.key] =
          `${field.label} must be ${maxWordsByKey[field.key]} words or less.`;
      }
    });

    Object.entries(attachmentConditionalFields).forEach(
      ([fieldKey, dependencyKey]) => {
        if (String(formValues[dependencyKey] ?? "") !== "Yes") {
          return;
        }

        const field = fieldsByKey[fieldKey];
        if (!field) {
          return;
        }

        const value = formValues[fieldKey];
        const isMissing =
          field.type === "file" ? !value : !String(value ?? "").trim();

        if (isMissing) {
          nextErrors[fieldKey] =
            `${field.label} is mandatory when ${fieldsByKey[dependencyKey]?.label || dependencyKey} is Yes`;
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
      setAlertMessage(
        Object.values(validationErrors)[0] || "Please complete all required fields.",
      );
      setAlertSeverity("error");
      setAlertOpen(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const token = getAuthToken();
      const user = getAuthUser();

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

      await createBusinessDetails(formData, token);
      window.localStorage.removeItem(BUSINESS_DETAILS_STORAGE_KEY);
      setFormValues(initialValues);
      setErrors({});
      setAlertMessage("Business details uploaded successfully.");
      setAlertSeverity("success");
      setAlertOpen(true);

      window.setTimeout(() => {
        navigate(
          user?.roleName === "admin" ? "/admin/businesses" : "/teacher/businesses",
          { replace: true },
        );
      }, 700);
    } catch (error) {
      setAlertMessage(error.message || "Failed to upload business details.");
      setAlertSeverity("error");
      setAlertOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFieldHint = (field) => {
    if (field.type === "file" && field.maxSizeBytes) {
      const maxMb = Math.round(field.maxSizeBytes / (1024 * 1024));
      return (
        <p className="text-xs text-gray-500">
          JPG / PNG only, max {maxMb}MB
        </p>
      );
    }

    if (field.type === "textarea" && maxWordsByKey[field.key]) {
      return (
        <p className="text-xs text-gray-500">
          Max {maxWordsByKey[field.key]} words
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
          {maxWordsByKey[field.key] && (
            <p
              className={`text-xs ${
                countWords(formValues[field.key]) / maxWordsByKey[field.key] >= 0.8
                  ? "text-red-600"
                  : "text-gray-500"
              }`}
            >
              {countWords(formValues[field.key])}/{maxWordsByKey[field.key]}
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
            onChange={(event) => handleChange(field, event.target.files?.[0] ?? null)}
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

      {!["textarea", "file", "select"].includes(field.type) && (
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

      {errors[field.key] && (
        <p className="text-sm text-red-600">{errors[field.key]}</p>
      )}
    </div>
  );

  const shouldShowField = (fieldKey) => {
    const dependencyKey = attachmentConditionalFields[fieldKey];
    if (!dependencyKey) {
      return true;
    }

    return String(formValues[dependencyKey] ?? "") === "Yes";
  };

  const isLastStep = currentStepIndex === structuredSections.length - 1;
  const stepProgress =
    structuredSections.length > 1
      ? (currentStepIndex / (structuredSections.length - 1)) * 100
      : 0;

  return (
    <div className="mx-auto w-full max-w-7xl p-2">
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-r from-white via-[#faf8ff] to-white px-5 py-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
              Submit a Business
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[#7a80a6]">
              Fill in the business details carefully and submit all required
              documents in one responsive workflow.
            </p>
          </div>
          <div className="rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary">
            {structuredSections.length} steps
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
                {structuredSections.map((group, index) => {
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

        {structuredSections.map((step, index) => (
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
                  Math.min(structuredSections.length - 1, previous + 1),
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

        <Alert
          isOpen={alertOpen}
          onClose={() => setAlertOpen(false)}
          severity={alertSeverity}
          message={alertMessage}
          duration={4000}
          position="bottom"
        />
      </form>
    </div>
  );
}

export default BusinessDetails;
