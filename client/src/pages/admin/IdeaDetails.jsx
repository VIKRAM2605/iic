import React, { useEffect, useMemo, useState } from "react";
import { createIdeaDetails } from "../../../config/api";
import { getAuthToken } from "../../utils/auth";
import Alert from "../../components/Alert";
import SearchableSelect from "../../components/SearchableSelect";

const IDEA_DETAILS_STORAGE_KEY = "idea-details-form-values";

const countWords = (value) => {
  const normalizedValue = String(value ?? "").trim().replace(/\s+/g, " ");
  return normalizedValue ? normalizedValue.split(" ").length : 0;
};

const getDurationFromDateTime = (startDateTime, endDateTime) => {
  if (!String(startDateTime ?? "").trim() || !String(endDateTime ?? "").trim()) {
    return { durationHours: "", error: "" };
  }

  const startDate = new Date(startDateTime);
  const endDate = new Date(endDateTime);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return { durationHours: "", error: "Invalid date/time input." };
  }

  const diffMs = endDate.getTime() - startDate.getTime();
  if (diffMs < 0) {
    return { durationHours: "", error: "End Date & Time must be after Start Date & Time" };
  }

  if (diffMs === 0) {
    return { durationHours: "0", error: "" };
  }

  const durationHours = diffMs / (1000 * 60 * 60);
  return { durationHours: durationHours.toFixed(1), error: "" };
};

const iicPortalDocFields = [
  { key: "instituteName", label: "Institute Name", type: "text", required: true },
  { key: "innovationTitle", label: "Title of the Innovation", type: "text", required: true },
  { key: "teamLeadName", label: "Team Lead Name", type: "text", required: true },
  { key: "teamLeadEmail", label: "Team Lead Email", type: "email", required: true },
  {
    key: "teamLeadGender",
    label: "Team Lead Gender",
    type: "select",
    required: true,
    options: ["Female", "Male"],
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
    label: "Sector /Domain",
    type: "select",
    required: true,
    options: [
      "Healthcare & Biomedical devices.",
      "Agriculture & Rural Development.",
      "Smart Vehicles/ Electric vehicle/ Electric vehicle motor and battery technology.",
      "Food Processing/Nutrition/Biotech",
      "Robotics and Drones.",
      "Waste Management/Waste to Wealth Creation",
      "Clean & Potable water.",
      "Renewable and affordable Energy.",
      "IoT based technologies (e.g. Security & Surveillance systems etc.)",
      "ICT, cyber-physical systems, Blockchain, Cognitive computing, Cloud computing, AI & ML.",
      "Other Emerging Areas Innovation for Start-up",
      "Software - Mobile App Development",
      "Software - Web App Development",
      "Travel & Tourism",
      "Finance Life Sciences",
      "Smart Education",
      "Smart Cities",
      "Sports & Fitness",
      "Smart Textiles",
      "Sustainable Environment",
      "Infrastructure",
      "Manufacturing",
      "Defence & Security",
      "Mining, Metals, Materials",
      "Consumer Goods and Retail",
      "Fashion and Textiles",
      "Education",
    ],
  },
  {
    key: "developedAsPartOf",
    label: "Developed as part of",
    type: "select",
    required: true,
    options: [
      "Academic Requirement/Study Project",
      "Academic Research Assignment/Industry Sponsored Project",
      "Independent Assignment/Non-academic Study Project",
    ],
  },
  {
    key: "innovationType",
    label: "Innovation type",
    type: "select",
    required: true,
    options: [
      "Product",
      "Process",
      "Service",
      "Market Place",
      "Business/Management Innovation",
    ],
  },
  {
    key: "developmentStage",
    label: "Development stage",
    type: "select",
    required: true,
    options: [
      "TRL 1: Basic research. Principles postulated observed but no experimental proof available",
      "TRL 2: Technology formulation. Concept and application have been formulated",
      "TRL 3: Applied research. First laboratory tests completed; proof of concept",
    ],
  },
  {
    key: "problemRelevance",
    label: "Define the problem and its relevance to today's market / society / industry need",
    type: "textarea",
    required: true,
  },
  {
    key: "solutionDescription",
    label: "Describe the solution / proposed / developed",
    type: "textarea",
    required: true,
  },
  {
    key: "uniquenessFeatures",
    label: "Explain the uniqueness and distinctive features of the (product / process / service) solution",
    type: "textarea",
    required: true,
  },
  {
    key: "competitorDifference",
    label:
      "How your proposed / developed (product / process / service) solution is different from similar kind of product by the competitors if any",
    type: "textarea",
    required: true,
  },
  {
    key: "ipPatentAssociated",
    label: "Is there any IP or Patentable Component associated with the Solution?",
    type: "select",
    required: true,
    options: ["Yes", "No"],
  },
  {
    key: "ipPatentDocument",
    label: "Upload the Copy of IP/Patent Applied or Obtained",
    type: "file",
    required: false,
    accept: ".jpg,.jpeg,.png",
    maxSizeBytes: 2 * 1024 * 1024,
  },
  {
    key: "innovationGrantSupport",
    label: "Has the Solution Received any Innovation Grant/Seedfund Support",
    type: "select",
    required: true,
    options: ["Yes", "No"],
  },
  {
    key: "innovationGrantDocument",
    label: "Upload the Copy of IP/Patent Applied or Obtained",
    type: "file",
    required: false,
    accept: ".jpg,.jpeg,.png",
    maxSizeBytes: 2 * 1024 * 1024,
  },
  {
    key: "recognitionsObtained",
    label: "Are there any Recognitions (National/International) Obtained by the Solution?",
    type: "select",
    required: true,
    options: ["Yes", "No"],
  },
  {
    key: "latestAchievementDocument",
    label: "Upload the Copy of Latest Achievement",
    type: "file",
    required: false,
    accept: ".jpg,.jpeg,.png",
    maxSizeBytes: 2 * 1024 * 1024,
  },
  {
    key: "commercializedSolution",
    label: "Is the Solution Commercialized either through Technology Transfer or Enterprise Development/Startup?",
    type: "select",
    required: true,
    options: ["Yes", "No"],
  },
  {
    key: "startupRegistrationDocument",
    label: "Upload the Registration Copy of Start-up / Enterprise",
    type: "file",
    required: false,
    accept: ".jpg,.jpeg,.png",
    maxSizeBytes: 2 * 1024 * 1024,
  },
  {
    key: "incubationSupportReceived",
    label: "Had the Solution Received any Pre-Incubation/Incubation Support?",
    type: "select",
    required: true,
    options: ["Yes", "No"],
  },
  {
    key: "incubationUnitName",
    label: "Mention the Pre-Incubation / Incubation Unit Name",
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
    section: "Idea Details",
    fields: [
      "innovationTitle",
      "instituteName",
      "teamLeadName",
      "teamLeadEmail",
      "teamLeadGender",
      "fyOfDevelopment",
      "sectorDomain",
      "developedAsPartOf",
      "innovationType",
      "developmentStage",
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
      "recognitionsObtained",
      "latestAchievementDocument",
      "commercializedSolution",
      "startupRegistrationDocument",
      "incubationSupportReceived",
      "incubationUnitName",
      "innovationPhotograph",
      "innovationVideoUrl",
    ],
  },
];

function buildUnifiedFields() {
  const fieldMap = new Map();

  const upsertField = (field, source) => {
    if (!fieldMap.has(field.key)) {
      fieldMap.set(field.key, {
        ...field,
        required: !!field.required,
        sources: [source],
      });
      return;
    }

    const existing = fieldMap.get(field.key);
    fieldMap.set(field.key, {
      ...existing,
      required: existing.required || !!field.required,
      sources: [...new Set([...existing.sources, source])],
    });
  };

  iicPortalDocFields.forEach((field) => upsertField(field, "IIC"));
  return Array.from(fieldMap.values());
}

const attachmentConditionalFields = {
  ipPatentDocument: "ipPatentAssociated",
  innovationGrantDocument: "innovationGrantSupport",
  latestAchievementDocument: "recognitionsObtained",
  startupRegistrationDocument: "commercializedSolution",
  incubationUnitName: "incubationSupportReceived",
};

function IdeaDetails() {
  const fields = useMemo(() => buildUnifiedFields(), []);
  const fieldsByKey = useMemo(
    () => fields.reduce((accumulator, field) => ({ ...accumulator, [field.key]: field }), {}),
    [fields]
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
        if (field.type === "checkbox") {
          accumulator[field.key] = false;
        } else {
          accumulator[field.key] = field.type === "file" ? null : "";
        }

        return accumulator;
      }, {}),
    [fields]
  );

  const [formValues, setFormValues] = useState(() => {
    if (typeof window === "undefined") {
      return initialValues;
    }

    try {
      const rawStoredValues = window.localStorage.getItem(IDEA_DETAILS_STORAGE_KEY);
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

        if (field.type === "checkbox") {
          hydratedValues[field.key] = Boolean(parsedValues[field.key]);
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
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertSeverity, setAlertSeverity] = useState("success");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const maxLengthByKey = {
    problemRelevance: 100,
    solutionDescription: 100,
    uniquenessFeatures: 100,
    competitorDifference: 100,
  };
  const maxWordsByKey = { innovationTitle: 20, aboutEvent: 150 };

  const stepSections = useMemo(
    () =>
      structuredSections.map((group) => ({
        ...group,
        fields: group.fields.filter((field) => !["durationManual", "fromDate", "toDate", "durationHours"].includes(field.key)),
      })),
    [structuredSections]
  );

  useEffect(() => {
    if (currentStepIndex > stepSections.length - 1) {
      setCurrentStepIndex(Math.max(0, stepSections.length - 1));
    }
  }, [currentStepIndex, stepSections.length]);

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

    window.localStorage.setItem(IDEA_DETAILS_STORAGE_KEY, JSON.stringify(serializableValues));
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
        alert(`Invalid file type. Allowed: ${field.accept}`);
        setErrors((previous) => ({
          ...previous,
          [field.key]: `Invalid file type. Allowed: ${field.accept}`,
        }));
        return;
      }
    }

    if (field.type === "file" && value && field.maxSizeBytes && value.size > field.maxSizeBytes) {
      const maxMb = Math.round(field.maxSizeBytes / (1024 * 1024));
      alert(`${field.label} must be ${maxMb}MB or less.`);
      setErrors((previous) => ({ ...previous, [field.key]: `${field.label} exceeds ${maxMb}MB.` }));
      return;
    }

    if (field.type === "textarea" && maxLengthByKey[field.key]) {
      const limit = maxLengthByKey[field.key];
      if (String(value ?? "").length > limit) {
        alert(`${field.label} must be ${limit} characters or less (including spaces).`);
        setErrors((previous) => ({ ...previous, [field.key]: `${field.label} exceeds ${limit} characters.` }));
        return;
      }
    }

    if (maxWordsByKey[field.key]) {
      const limit = maxWordsByKey[field.key];
      if (countWords(value) > limit) {
        alert(`${field.label} must be ${limit} words or less.`);
        setErrors((previous) => ({ ...previous, [field.key]: `${field.label} exceeds ${limit} words.` }));
        return;
      }
    }

    setFormValues((previous) => {
      const nextValues = { ...previous, [field.key]: value };

      if (field.key === "durationManual") {
        if (value) {
          nextValues.fromDate = "";
          nextValues.toDate = "";
        } else {
          const calculatedDuration = getDurationFromDateTime(nextValues.fromDate, nextValues.toDate);
          nextValues.durationHours = calculatedDuration.error ? "" : calculatedDuration.durationHours;
        }
      }

      if ((field.key === "fromDate" || field.key === "toDate") && !nextValues.durationManual) {
        const calculatedDuration = getDurationFromDateTime(nextValues.fromDate, nextValues.toDate);
        nextValues.durationHours = calculatedDuration.error ? "" : calculatedDuration.durationHours;
      }

      if (field.key === "ipPatentAssociated" && value !== "Yes") {
        nextValues.ipPatentDocument = null;
      }

      if (field.key === "innovationGrantSupport" && value !== "Yes") {
        nextValues.innovationGrantDocument = null;
      }

      if (field.key === "recognitionsObtained" && value !== "Yes") {
        nextValues.latestAchievementDocument = null;
      }

      if (field.key === "commercializedSolution" && value !== "Yes") {
        nextValues.startupRegistrationDocument = null;
      }

      if (field.key === "incubationSupportReceived" && value !== "Yes") {
        nextValues.incubationUnitName = "";
      }

      return nextValues;
    });

    setErrors((previous) => {
      const nextErrors = { ...previous, [field.key]: "" };

      if (field.key === "durationManual") {
        nextErrors.fromDate = "";
        nextErrors.toDate = "";
        nextErrors.durationHours = "";
      }

      if (field.key === "fromDate" || field.key === "toDate") {
        nextErrors.fromDate = "";
        nextErrors.toDate = "";
        nextErrors.durationHours = "";
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
      const isFileMissing = field.type === "file" && !value;
      const isCheckboxMissing = field.type === "checkbox" && !value;
      const isTextMissing =
        field.type !== "file" && field.type !== "checkbox" && !String(value ?? "").trim();

      if (isFileMissing || isCheckboxMissing || isTextMissing) {
        nextErrors[field.key] = `${field.label} is mandatory`;
        return;
      }

      if (field.type === "number" && String(value ?? "").trim()) {
        if (Number(value) < 0) {
          nextErrors[field.key] = `${field.label} cannot be negative`;
          return;
        }
      }

      if (field.type === "file" && field.maxSizeBytes && value?.size > field.maxSizeBytes) {
        const maxMb = Math.round(field.maxSizeBytes / (1024 * 1024));
        nextErrors[field.key] = `${field.label} must be ${maxMb}MB or less.`;
        return;
      }

      if (field.type === "file" && field.accept && value) {
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
          nextErrors[field.key] = `Invalid file type. Allowed: ${field.accept}`;
          return;
        }
      }

      if (field.type === "textarea" && maxLengthByKey[field.key]) {
        const limit = maxLengthByKey[field.key];
        if (String(value ?? "").length > limit) {
          nextErrors[field.key] = `${field.label} must be ${limit} characters or less.`;
        }
      }

      if (maxWordsByKey[field.key]) {
        const limit = maxWordsByKey[field.key];
        if (countWords(value) > limit) {
          nextErrors[field.key] = `${field.label} must be ${limit} words or less.`;
        }
      }
    });

    Object.entries(attachmentConditionalFields).forEach(([fieldKey, dependencyKey]) => {
      if (String(formValues[dependencyKey] ?? "") !== "Yes") {
        return;
      }

      const field = fieldsByKey[fieldKey];
      if (!field) {
        return;
      }

      const value = formValues[fieldKey];
      const isMissing = field.type === "file" ? !value : !String(value ?? "").trim();
      if (isMissing) {
        nextErrors[fieldKey] = `${field.label} is mandatory when ${fieldsByKey[dependencyKey]?.label || dependencyKey} is Yes`;
      }
    });

    setErrors(nextErrors);
    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      const firstErrorMessage = Object.values(validationErrors)[0] || "Please fill all mandatory fields.";
      setAlertMessage(firstErrorMessage);
      setAlertSeverity("error");
      setAlertOpen(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();

      fields.forEach((field) => {
        const value = formValues[field.key];

        if (field.type === "file") {
          if (value) {
            formData.append(field.key, value);
          }
          return;
        }

        if (field.type === "checkbox") {
          formData.append(field.key, value ? "true" : "false");
          return;
        }

        formData.append(field.key, String(value ?? ""));
      });

      const token = getAuthToken();
      if (!token) {
        throw new Error("Please login again to continue.");
      }

      await createIdeaDetails(formData, token);
      window.localStorage.removeItem(IDEA_DETAILS_STORAGE_KEY);
      setFormValues(initialValues);
      setErrors({});
      setAlertMessage("Idea details uploaded successfully.");
      setAlertSeverity("success");
      setAlertOpen(true);
    } catch (error) {
      setAlertMessage(error.message || "Failed to upload idea details.");
      setAlertSeverity("error");
      setAlertOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFieldHint = (field) => {
    if (field.key === "offlineEventProof1" && field.maxSizeBytes) {
      const maxMb = Math.round(field.maxSizeBytes / (1024 * 1024));
      return (
        <p className="text-xs text-gray-500">
          Max {maxMb}MB, photo should cover speaker, participants, stage
        </p>
      );
    }

    if (field.key === "onlineEventProof1" && field.maxSizeBytes) {
      const maxMb = Math.round(field.maxSizeBytes / (1024 * 1024));
      return (
        <p className="text-xs text-gray-500">
          Max {maxMb}MB, photo should cover speaker, participants, stage
        </p>
      );
    }

    if (field.key === "offlineEventProof2" && field.maxSizeBytes) {
      const maxMb = Math.round(field.maxSizeBytes / (1024 * 1024));
      return <p className="text-xs text-gray-500">Max {maxMb}MB, photo 2 must be different from photo 1</p>;
    }

    if (field.type === "file" && field.maxSizeBytes) {
      const maxMb = Math.round(field.maxSizeBytes / (1024 * 1024));
      return <p className="text-xs text-gray-500">(JPG, PNG max {maxMb}MB) Provide link</p>;
    }

    if (field.key === "innovationVideoUrl") {
      return (
        <p className="text-xs text-gray-500">
          Specify the Video URL of your innovation. Give necessary permission to view the file to the following email id: iic.mhrd@aicte-india.org
        </p>
      );
    }

    if (field.key === "innovationPhotograph") {
      return (
        <p className="text-xs text-gray-500">
          Upload the photograph of your innovation if any. (JPG / PNG : max 2 MB)
        </p>
      );
    }

    if (field.key === "durationManual") {
      return <p className="text-xs text-gray-500">Uncheck to auto-calculate using Start and End Date & Time</p>;
    }

    if (field.key === "durationHours" && !formValues.durationManual) {
      return <p className="text-xs text-gray-500">Auto-calculated from Start and End Date & Time</p>;
    }

    if ((field.key === "fromDate" || field.key === "toDate") && formValues.durationManual) {
      return <p className="text-xs text-gray-500">Disabled while manual duration mode is enabled</p>;
    }

    if (field.type === "textarea" && maxLengthByKey[field.key]) {
      const limit = maxLengthByKey[field.key];
      return <p className="text-xs text-gray-500">Max {limit} characters (including spaces)</p>;
    }

    if (maxWordsByKey[field.key]) {
      const limit = maxWordsByKey[field.key];
      return <p className="text-xs text-gray-500">Max {limit} words</p>;
    }

    return null;
  };

  const renderField = (field) => (
    <div
      key={field.key}
      className={`space-y-1 ${field.key === "fromDate" || field.key === "toDate" ? "md:col-span-2" : ""}`}
    >
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
          {maxLengthByKey[field.key] && (
            <p
              className={`text-xs ${
                String(formValues[field.key] ?? "").length / maxLengthByKey[field.key] >= 0.8
                  ? "text-red-600"
                  : "text-gray-500"
              }`}
            >
              {String(formValues[field.key] ?? "").length} / {maxLengthByKey[field.key]}
            </p>
          )}
          {maxWordsByKey[field.key] && (
            <p
              className={`text-xs ${
                countWords(formValues[field.key]) / maxWordsByKey[field.key] >= 0.8
                  ? "text-red-600"
                  : "text-gray-500"
              }`}
            >
              {countWords(formValues[field.key])} / {maxWordsByKey[field.key]} words
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

      {field.type === "checkbox" && (
        <div className="flex items-center gap-2">
          <input
            id={field.key}
            name={field.key}
            type="checkbox"
            checked={!!formValues[field.key]}
            onChange={(event) => handleChange(field, event.target.checked)}
            className="h-4 w-4"
          />
          <span className="text-sm text-gray-700">Select</span>
        </div>
      )}

      {field.type !== "textarea" && field.type !== "file" && field.type !== "select" && field.type !== "checkbox" && (
        <div className="space-y-1">
          <input
            id={field.key}
            name={field.key}
            type={field.type}
            step={
              field.key === "fromDate" || field.key === "toDate"
                ? "60"
                : field.key === "durationHours"
                  ? "0.1"
                  : undefined
            }
            min={
              field.type === "number"
                ? "0"
                : field.key === "toDate"
                  ? formValues.fromDate || undefined
                  : undefined
            }
            value={formValues[field.key]}
            onChange={(event) => handleChange(field, event.target.value)}
            disabled={(field.key === "fromDate" || field.key === "toDate") && !!formValues.durationManual}
            readOnly={field.key === "durationHours" && !formValues.durationManual}
            className={`w-full rounded border border-gray-300 p-2 outline-none focus:border-gray-500 ${
              field.key === "fromDate" || field.key === "toDate" ? "whitespace-nowrap" : ""
            }`}
          />
          {maxWordsByKey[field.key] && (
            <p
              className={`text-xs ${
                countWords(formValues[field.key]) / maxWordsByKey[field.key] >= 0.8
                  ? "text-red-600"
                  : "text-gray-500"
              }`}
            >
              {countWords(formValues[field.key])} / {maxWordsByKey[field.key]} words
            </p>
          )}
        </div>
      )}

      {renderFieldHint(field)}

      {errors[field.key] && <p className="text-sm text-red-600">{errors[field.key]}</p>}
    </div>
  );

  const shouldShowField = (fieldKey) => {
    const dependencyKey = attachmentConditionalFields[fieldKey];
    if (!dependencyKey) {
      return true;
    }

    return String(formValues[dependencyKey] ?? "") === "Yes";
  };

  const renderDurationGroup = () => {
    const durationManualField = fieldsByKey.durationManual;
    const fromDateField = fieldsByKey.fromDate;
    const toDateField = fieldsByKey.toDate;
    const durationHoursField = fieldsByKey.durationHours;

    if (!fromDateField || !toDateField || !durationHoursField) {
      return null;
    }

    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-base font-medium text-gray-900">Duration of Idea in Hrs</h3>
          {durationManualField && (
            <label className="flex items-center gap-2 text-sm text-gray-700" htmlFor={durationManualField.key}>
              <input
                id={durationManualField.key}
                name={durationManualField.key}
                type="checkbox"
                checked={!!formValues[durationManualField.key]}
                onChange={(event) => handleChange(durationManualField, event.target.checked)}
                className="h-4 w-4"
              />
              Enter manually
            </label>
          )}
        </div>

        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-800" htmlFor={fromDateField.key}>
              {fromDateField.label}
            </label>
            <input
              id={fromDateField.key}
              name={fromDateField.key}
              type={fromDateField.type}
              step="60"
              value={formValues[fromDateField.key]}
              onChange={(event) => handleChange(fromDateField, event.target.value)}
              disabled={!!formValues.durationManual}
              className="w-full rounded border border-gray-300 p-2 outline-none focus:border-gray-500"
            />
            {renderFieldHint(fromDateField)}
            {errors[fromDateField.key] && <p className="text-sm text-red-600">{errors[fromDateField.key]}</p>}
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-800" htmlFor={toDateField.key}>
              {toDateField.label}
            </label>
            <input
              id={toDateField.key}
              name={toDateField.key}
              type={toDateField.type}
              step="60"
              min={formValues.fromDate || undefined}
              value={formValues[toDateField.key]}
              onChange={(event) => handleChange(toDateField, event.target.value)}
              disabled={!!formValues.durationManual}
              className="w-full rounded border border-gray-300 p-2 outline-none focus:border-gray-500"
            />
            {renderFieldHint(toDateField)}
            {errors[toDateField.key] && <p className="text-sm text-red-600">{errors[toDateField.key]}</p>}
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-800" htmlFor={durationHoursField.key}>
              {durationHoursField.label}
            </label>
            <input
              id={durationHoursField.key}
              name={durationHoursField.key}
              type={durationHoursField.type}
              step="0.1"
              min="0"
              value={formValues[durationHoursField.key]}
              onChange={(event) => handleChange(durationHoursField, event.target.value)}
              readOnly={!formValues.durationManual}
              className="w-full rounded border border-gray-300 p-2 outline-none focus:border-gray-500"
            />
            {renderFieldHint(durationHoursField)}
            {errors[durationHoursField.key] && <p className="text-sm text-red-600">{errors[durationHoursField.key]}</p>}
          </div>
        </div>
      </div>
    );
  };

  const isLastStep = currentStepIndex === stepSections.length - 1;
  const stepProgress = stepSections.length > 1 ? (currentStepIndex / (stepSections.length - 1)) * 100 : 0;

  return (
    <div className="mx-auto w-full p-2">
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

        {stepSections.map((step, index) => {
          const isActiveStep = index === currentStepIndex;

          return (
            <section
              key={step.section}
              className={`rounded-lg border border-gray-200 bg-white p-4 ${isActiveStep ? "block" : "hidden"}`}
            >
              <h2 className="text-lg font-medium text-gray-900">{step.section}</h2>

              {step.section === "Idea Details" && <div className="mt-4">{renderDurationGroup()}</div>}

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                {step.fields.filter((field) => shouldShowField(field.key)).map((field) => renderField(field))}
              </div>
            </section>
          );
        })}

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
              onClick={() => setCurrentStepIndex((previous) => Math.min(stepSections.length - 1, previous + 1))}
              disabled={isLastStep}
              className="rounded bg-primary px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <button
            type="submit"
            disabled={!isLastStep || Object.values(errors).some(Boolean) || isSubmitting}
            className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save Details"}
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

export default IdeaDetails;
