import React, { useEffect, useMemo, useState } from "react";
import { createEventDetails } from "../../../config/api";
import { getAuthToken, getAuthUser } from "../../utils/auth";
import Alert from "../../components/Alert";
import SearchableSelect from "../../components/SearchableSelect";

const EVENT_DETAILS_STORAGE_KEY = "event-details-form-values";

const buildAcademicYearOptions = () => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 8 }, (_, index) => {
    const startYear = currentYear - 4 + index;
    return `${startYear}-${startYear + 1}`;
  });
};

const academicYearOptions = buildAcademicYearOptions();

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
  {
    key: "currentAcademicYear",
    label: "Current Academic Year",
    type: "select",
    required: true,
    options: academicYearOptions,
  },
  {
    key: "quarter",
    label: "Quarter",
    type: "select",
    required: true,
    options: ["Q-I", "Q-II", "Q-III", "Q-IV"],
  },
  {
    key: "programDrivenBy",
    label: "Program Driven By",
    type: "select",
    required: true,
    options: [
      "IIC Calendar Activity",
      "IIC MIC Activity",
      "IIC Celebration Activity",
      "IIC Self Driven Activity",
    ],
  },
  { key: "programActivityName", label: "Program/Activity Name", type: "text", required: true },
  {
    key: "programType",
    label: "Program Type",
    type: "select",
    required: true,
    options: [
      "Level 1 - Expert Talk",
      "Level 1 - Exposure Visit",
      "Level 1 - Mentoring Session",
      "Level 2 - Conference",
      "Level 2 - Exposure Visit",
      "Level 2 - Seminar",
      "Level 2 - Workshop",
      "Level 3 - Bootcamp",
      "Level 3 - Competition/Hackathon",
      "Level 3 - Demo Day",
      "Level 3 - Exhibition",
      "Level 4 - Workshop",
      "Level 4 - Challenges",
      "Level 4 - Competition/Hackathon",
      "Level 4 - Tech Fest",
    ],
  },
  {
    key: "activityLedBy",
    label: "Activity Led By",
    type: "select",
    required: true,
    options: ["Institute Council", "Student Council"],
  },
  {
    key: "programTheme",
    label: "Program Theme",
    type: "select",
    required: true,
    options: [
      "IPR & Technology Transfer",
      "Innovation & Design Thinking",
      "Entrepreneurship & Startup",
      "Pre-Incubation & Incubation Management",
      "Safe and Trusted AI",
      "Human Capital",
      "Science",
      "Resilience, Innovation & Efficiency",
      "Inclusion for Social Empowerment",
      "Democratizing AI Resources",
      "Economic Growth & Social Good",
    ],
  },
  {
    key: "durationManual",
    label: "Enter Duration Manually (Hours)",
    type: "checkbox",
    required: false,
  },
  { key: "fromDate", label: "Start Date & Time", type: "datetime-local", required: false },
  { key: "toDate", label: "End Date & Time", type: "datetime-local", required: false },
  { key: "durationHours", label: "Duration of Activity (Hrs)", type: "number", required: false },
  { key: "studentParticipants", label: "No. of Student Participants", type: "number", required: true },
  { key: "facultyParticipants", label: "No. of Faculty Participants", type: "number", required: true },
  {
    key: "externalParticipants",
    label: "No. of External Participants (if any)",
    type: "number",
    required: true,
  },
  { key: "expenditureAmount", label: "Expenditure Amount (INR)", type: "number", required: true },
  {
    key: "modeOfSession",
    label: "Mode of Session Delivery",
    type: "select",
    required: true,
    options: ["Offline", "Online", "Hybrid"],
  },
  { key: "remark", label: "Remark", type: "textarea", required: true },
  { key: "objective", label: "Objective", type: "textarea", required: true },
  {
    key: "benefitLearning",
    label: "Benefit in terms of Learning/Skill/Knowledge",
    type: "textarea",
    required: true,
  },
  {
    key: "aboutEvent",
    label: "About the Event",
    type: "textarea",
    required: true,
  },
  { key: "speakerName", label: "Speaker Name", type: "text", required: true },
  { key: "speakerDesignation", label: "Speaker Designation", type: "text", required: true },
  { key: "speakerOrganization", label: "Speaker Organization", type: "text", required: true },
  {
    key: "aboutSpeaker",
    label: "About the Speaker",
    type: "textarea",
    required: true,
  },
  { key: "sessionVideoUrl", label: "Video URL of Session", type: "url", required: true },
  {
    key: "feedbackDescription",
    label: "Upload Feedback",
    type: "file",
    required: false,
    accept: ".pdf",
    maxSizeBytes: 2 * 1024 * 1024,
  },
  {
    key: "attendanceSheet",
    label: "Upload Attendance Sheet",
    type: "file",
    required: true,
    accept: ".pdf,.jpg,.jpeg,.png",
    maxSizeBytes: 2 * 1024 * 1024,
  },
  {
    key: "photograph1",
    label: "Photograph 1",
    type: "file",
    required: true,
    accept: ".jpg,.jpeg,.png",
    maxSizeBytes: 2 * 1024 * 1024,
  },
  {
    key: "photograph2",
    label: "Photograph 2",
    type: "file",
    required: true,
    accept: ".jpg,.jpeg,.png",
    maxSizeBytes: 2 * 1024 * 1024,
  },
  {
    key: "overallReport",
    label: "Overall Report of the Activity",
    type: "file",
    required: true,
    accept: ".pdf",
    maxSizeBytes: 2 * 1024 * 1024,
  },
  { key: "promoteTwitter", label: "Twitter", type: "checkbox", required: false },
  { key: "twitterUrl", label: "Twitter URL", type: "url", required: false },
  { key: "promoteFacebook", label: "Facebook", type: "checkbox", required: false },
  { key: "facebookUrl", label: "Facebook URL", type: "url", required: false },
  { key: "promoteInstagram", label: "Instagram", type: "checkbox", required: false },
  { key: "instagramUrl", label: "Instagram URL", type: "url", required: false },
  { key: "promoteLinkedin", label: "LinkedIn", type: "checkbox", required: false },
  { key: "linkedinUrl", label: "LinkedIn URL", type: "url", required: false },
  { key: "promoteYoutube", label: "YouTube", type: "checkbox", required: false },
  { key: "youtubeUrl", label: "YouTube URL", type: "url", required: false },
  {
    key: "feedbackDescription",
    label: "Feedback Description",
    type: "file",
    required: false,
    accept: ".pdf",
    maxSizeBytes: 2 * 1024 * 1024,
  },
];

const bipPortalFields = [
  { key: "facultyApplied", label: "Faculty Applied", type: "text", required: true },
  { key: "taskId", label: "Task ID", type: "text", required: true },
  {
    key: "departmentsInvolved",
    label: "Departments Involved",
    type: "select",
    required: false,
    options: ["Yes", "No"],
  },
  { key: "department", label: "Department", type: "text", required: false },
  {
    key: "specialLabsInvolved",
    label: "Special Labs Involved",
    type: "select",
    required: false,
    options: ["Yes", "No"],
  },
  { key: "specialLabs", label: "Special Labs", type: "text", required: false },
  { key: "clubInvolved", label: "Club Involved", type: "select", required: false, options: ["Yes", "No"] },
  { key: "club", label: "Club", type: "text", required: false },
  {
    key: "firstFacultyInvolved",
    label: "First Faculty Member Involved",
    type: "select",
    required: false,
    options: ["Yes", "No"],
  },
  { key: "faculty1", label: "Faculty 1", type: "text", required: false },
  {
    key: "secondFacultyInvolved",
    label: "Second Faculty Member Involved",
    type: "select",
    required: false,
    options: ["Yes", "No"],
  },
  { key: "faculty2", label: "Faculty 2", type: "text", required: false },
  {
    key: "thirdFacultyInvolved",
    label: "Third Faculty Member Involved",
    type: "select",
    required: false,
    options: ["Yes", "No", "NA"],
  },
  { key: "faculty3", label: "Faculty 3", type: "text", required: false },
  {
    key: "eventType",
    label: "Select Type of Event",
    type: "select",
    required: true,
    options: ["External", "Internal"],
  },
  { key: "programActivityName", label: "Name of Event", type: "text", required: false },
  { key: "studentParticipants", label: "No. of Students Participated", type: "number", required: false },
  { key: "facultyParticipants", label: "No. of Faculty Members Participated", type: "number", required: false },
  { key: "externalParticipants", label: "No. of External Participants", type: "number", required: false },
  { key: "expenditureAmount", label: "Expenditure Amount (INR)", type: "number", required: false },
  {
    key: "modeOfSession",
    label: "Select Mode of Session",
    type: "select",
    required: false,
    options: ["Offline", "Online", "Hybrid"],
  },
  { key: "outcomeObtained", label: "Outcome Obtained", type: "textarea", required: false },
  {
    key: "publishedSocialMediaUrl",
    label: "Published Video/Social Media URL",
    type: "url",
    required: false,
  },
  {
    key: "sessionSchedule",
    label: "Upload Session Schedule",
    type: "file",
    required: true,
    accept: ".pdf",
    maxSizeBytes: 2 * 1024 * 1024,
  },
  {
    key: "brochureProofName",
    label: "Upload Brochure",
    type: "file",
    required: true,
    accept: ".pdf",
    maxSizeBytes: 2 * 1024 * 1024,
  },
  {
    key: "iqacVerification",
    label: "IQAC Verification",
    type: "text",
    required: false,
  },
  { key: "remark", label: "Remarks", type: "textarea", required: false },
];

const displayStructure = [
  {
    section: "Program Details",
    fields: [
      "currentAcademicYear",
      "quarter",
      "programDrivenBy",
      "programActivityName",
      "programType",
      "activityLedBy",
      "programTheme",
      "durationManual",
      "fromDate",
      "toDate",
      "durationHours",
      "studentParticipants",
      "facultyParticipants",
      "externalParticipants",
      "expenditureAmount",
      "modeOfSession",
      "eventType",
      "aboutEvent",
    ],
  },
  {
    section: "Overview",
    fields: ["objective", "benefitLearning", "outcomeObtained", "remark"],
  },
  {
    section: "Speaker",
    fields: [
      "speakerName",
      "speakerDesignation",
      "speakerOrganization",
      "sessionVideoUrl",
      "publishedSocialMediaUrl",
      "aboutSpeaker",
    ],
  },
  {
    section: "Attachments",
    fields: [
      "attendanceSheet",
      "photograph1",
      "photograph2",
      "sessionSchedule",
      "brochureProofName",
      "overallReport",
      "feedbackDescription",
    ],
  },
  {
    section: "Promotion",
    fields: [
      "promoteTwitter",
      "twitterUrl",
      "promoteFacebook",
      "facebookUrl",
      "promoteInstagram",
      "instagramUrl",
      "promoteLinkedin",
      "linkedinUrl",
      "promoteYoutube",
      "youtubeUrl",
    ],
  },
  {
    section: "BIP Portal Details",
    fields: [
      "facultyApplied",
      "taskId",
      "departmentsInvolved",
      "department",
      "specialLabsInvolved",
      "specialLabs",
      "clubInvolved",
      "club",
      "firstFacultyInvolved",
      "faculty1",
      "secondFacultyInvolved",
      "faculty2",
      "thirdFacultyInvolved",
      "faculty3",
      "iqacVerification",
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
  bipPortalFields.forEach((field) => upsertField(field, "BIP"));

  return Array.from(fieldMap.values());
}

function EventDetails() {
  const fields = useMemo(() => buildUnifiedFields(), []);
  const user = useMemo(() => getAuthUser(), []);
  const isFaculty = user?.roleName === "faculty";
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
        } else if (field.key === "iqacVerification") {
          accumulator[field.key] = "Initiated";
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
      const rawStoredValues = window.localStorage.getItem(EVENT_DETAILS_STORAGE_KEY);
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

        if (field.key === "iqacVerification") {
          const storedValue = String(parsedValues[field.key] ?? "").trim();
          hydratedValues[field.key] = storedValue || "Initiated";
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
  const maxWordsByKey = {
    objective: 100,
    benefitLearning: 150,
    outcomeObtained: 150,
    remark: 150,
    aboutEvent: 150,
    aboutSpeaker: 150,
  };

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

    window.localStorage.setItem(EVENT_DETAILS_STORAGE_KEY, JSON.stringify(serializableValues));
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

    if (field.type === "textarea" && maxWordsByKey[field.key]) {
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
      }if (field.type === "textarea" && maxWordsByKey[field.key]) {
        const limit = maxWordsByKey[field.key];
        if (countWords(value) > limit) {
          nextErrors[field.key] = `${field.label} must be ${limit} words or less.`;
        }
      }
    });

    const socialPairs = [
      ["promoteTwitter", "twitterUrl", "Twitter URL is required when Twitter is selected"],
      ["promoteFacebook", "facebookUrl", "Facebook URL is required when Facebook is selected"],
      ["promoteInstagram", "instagramUrl", "Instagram URL is required when Instagram is selected"],
      ["promoteLinkedin", "linkedinUrl", "LinkedIn URL is required when LinkedIn is selected"],
      ["promoteYoutube", "youtubeUrl", "YouTube URL is required when YouTube is selected"],
    ];

    socialPairs.forEach(([toggleKey, urlKey, message]) => {
      if (formValues[toggleKey] && !String(formValues[urlKey] ?? "").trim()) {
        nextErrors[urlKey] = message;
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

      await createEventDetails(formData, token);
      window.localStorage.removeItem(EVENT_DETAILS_STORAGE_KEY);
      setFormValues(initialValues);
      setErrors({});
      setAlertMessage("Event details uploaded successfully.");
      setAlertSeverity("success");
      setAlertOpen(true);
    } catch (error) {
      setAlertMessage(error.message || "Failed to upload event details.");
      setAlertSeverity("error");
      setAlertOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFieldHint = (field) => {
    if (field.key === "onlineEventProof1" && field.maxSizeBytes) {
      const maxMb = Math.round(field.maxSizeBytes / (1024 * 1024));
      return (
        <p className="text-xs text-gray-500">
          Max {maxMb}MB, photo should cover speaker, participants, stage
        </p>
      );
    }

    if (field.type === "file" && field.maxSizeBytes) {
      const maxMb = Math.round(field.maxSizeBytes / (1024 * 1024));
      return <p className="text-xs text-gray-500">Max {maxMb}MB</p>;
    }

    if (["photograph2"].includes(field.key)) {
      return <p className="text-xs text-gray-500">(Photo 2 must be different from Photo 1)</p>;
    }

    if (field.key === "publishedSocialMediaUrl") {
      return <p className="text-xs text-gray-500">(Upload the video with minimum duration of 2 mins)</p>;
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
    if (field.type === "textarea" && maxWordsByKey[field.key]) {
      const limit = maxWordsByKey[field.key];
      return <p className="text-xs text-gray-500">Max: {limit} words</p>;
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
          disabled={field.key === "iqacVerification" && isFaculty}
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
          readOnly={
            field.key === "iqacVerification" || (field.key === "durationHours" && !formValues.durationManual)
          }
          className={`w-full rounded border border-gray-300 p-2 outline-none focus:border-gray-500 ${
            field.key === "fromDate" || field.key === "toDate" ? "whitespace-nowrap" : ""
          }`}
        />
      )}

      {renderFieldHint(field)}

      {errors[field.key] && <p className="text-sm text-red-600">{errors[field.key]}</p>}
    </div>
  );

  const shouldShowField = (fieldKey) => {
    if (fieldKey === "department") {
      return String(formValues.departmentsInvolved ?? "").trim().toLowerCase() === "yes";
    }

    if (fieldKey === "specialLabs") {
      return String(formValues.specialLabsInvolved ?? "").trim().toLowerCase() === "yes";
    }

    if (fieldKey === "club") {
      return String(formValues.clubInvolved ?? "").trim().toLowerCase() === "yes";
    }

    if (fieldKey === "faculty1") {
      return String(formValues.firstFacultyInvolved ?? "").trim().toLowerCase() === "yes";
    }

    if (fieldKey === "faculty2") {
      return String(formValues.secondFacultyInvolved ?? "").trim().toLowerCase() === "yes";
    }

    if (fieldKey === "faculty3") {
      return String(formValues.thirdFacultyInvolved ?? "").trim().toLowerCase() === "yes";
    }

    return true;
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
          <h3 className="text-base font-medium text-gray-900">Duration of Event in Hrs</h3>
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
    <div className="mx-auto w-full max-w-7xl p-2">
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-r from-white via-[#faf8ff] to-white px-5 py-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Event Submission</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[#7a80a6]">
              Fill in the event details carefully and submit all required documents in one responsive workflow.
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

        {stepSections.map((step, index) => {
          const isActiveStep = index === currentStepIndex;

          return (
            <section
              key={step.section}
              className={`rounded-lg border border-gray-200 bg-white p-4 ${isActiveStep ? "block" : "hidden"}`}
            >
              <h2 className="text-lg font-medium text-gray-900">{step.section}</h2>

              {step.section === "Program Details" && <div className="mt-4">{renderDurationGroup()}</div>}

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                {step.fields
                  .filter((field) => shouldShowField(field.key))
                  .map((field) => renderField(field))}
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

export default EventDetails;





