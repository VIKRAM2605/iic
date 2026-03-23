import React, { useEffect, useMemo, useState } from "react";
import { createEventDetails } from "../../../config/api";

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
    key: "previousAcademicYear",
    label: "Previous Academic Year",
    type: "select",
    required: true,
    options: academicYearOptions,
  },
  {
    key: "currentAcademicYear",
    label: "Current Academic Year",
    type: "select",
    required: true,
    options: academicYearOptions,
  },
  { key: "quarter", label: "Quarter", type: "text", required: true },
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
];

const bipPortalFields = [
  { key: "facultyApplied", label: "Faculty Applied", type: "text", required: false },
  { key: "taskId", label: "Task ID", type: "text", required: false },
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
  { key: "eventType", label: "Select Type of Event", type: "text", required: false },
  { key: "programActivityName", label: "Name of Event", type: "text", required: false },
  { key: "studentParticipants", label: "No. of Students Participated", type: "number", required: false },
  { key: "facultyParticipants", label: "No. of Faculty Members Participated", type: "number", required: false },
  { key: "externalParticipants", label: "No. of External Participants", type: "number", required: false },
  { key: "expenditureAmount", label: "Expenditure Amount (INR)", type: "number", required: false },
  { key: "modeOfSession", label: "Select Mode of Session", type: "select", required: false, options: ["Offline", "Online", "Hybrid"] },
  {
    key: "offlineEventProof1",
    label: "Upload OFFLINE Event Photo Proof 1",
    type: "file",
    required: false,
    accept: ".jpg,.jpeg,.png",
    maxSizeBytes: 2 * 1024 * 1024,
  },
  {
    key: "offlineEventProof2",
    label: "Upload OFFLINE Event Photo Proof 2",
    type: "file",
    required: false,
    accept: ".jpg,.jpeg,.png",
    maxSizeBytes: 2 * 1024 * 1024,
  },
  {
    key: "onlineEventProof1",
    label: "Upload ONLINE Event Photo Proof 1",
    type: "file",
    required: false,
    accept: ".jpg,.jpeg,.png",
    maxSizeBytes: 2 * 1024 * 1024,
  },
  {
    key: "onlineEventProof2",
    label: "Upload OFFLINE Event Photo Proof 2",
    type: "file",
    required: false,
    accept: ".jpg,.jpeg,.png",
  },
  { key: "outcomeObtained", label: "Outcome Obtained", type: "textarea", required: false },
  {
    key: "publishedSocialMediaUrl",
    label: "Published Video/Social Media URL",
    type: "url",
    required: false,
  },
  {
    key: "sessionScheduleWithHeader",
    label: "Upload Session Schedule with Header",
    type: "file",
    required: false,
    accept: ".pdf",
    maxSizeBytes: 2 * 1024 * 1024,
  },
  {
    key: "sessionSchedule",
    label: "Upload Session Schedule",
    type: "file",
    required: false,
    accept: ".pdf",
    maxSizeBytes: 2 * 1024 * 1024,
  },
  {
    key: "brochureWithLogo",
    label: "Upload Brochure with Institute Logo",
    type: "file",
    required: false,
    accept: ".pdf",
    maxSizeBytes: 2 * 1024 * 1024,
  },
  {
    key: "brochureProofName",
    label: "Upload Brochure Proof Name",
    type: "text",
    required: false,
  },
  {
    key: "attendanceSheetWithHeader",
    label: "Upload Attendance Sheet with Header",
    type: "file",
    required: false,
    accept: ".pdf",
    maxSizeBytes: 2 * 1024 * 1024,
  },
  {
    key: "attendanceSheetName",
    label: "Upload Attendance Sheet Name",
    type: "text",
    required: false,
  },
  {
    key: "uploadedReport",
    label: "Upload Report",
    type: "file",
    required: false,
    accept: ".pdf",
    maxSizeBytes: 2 * 1024 * 1024,
  },
  { key: "iqacVerification", label: "IQAC Verification", type: "text", required: false },
  { key: "remark", label: "Remarks", type: "textarea", required: false },
];

const displayStructure = [
  {
    section: "Program Details",
    fields: [
      "previousAcademicYear",
      "currentAcademicYear",
      "quarter",
      "programDrivenBy",
      "programActivityName",
      "programType",
      "activityLedBy",
      "programTheme",
      "aboutEvent",
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
      "aboutSpeaker",
      "sessionVideoUrl",
      "publishedSocialMediaUrl",
    ],
  },
  {
    section: "Attachments",
    fields: [
      "attendanceSheet",
      "photograph1",
      "photograph2",
      "overallReport",
      "offlineEventProof1",
      "offlineEventProof2",
      "onlineEventProof1",
      "onlineEventProof2",
      "sessionScheduleWithHeader",
      "sessionSchedule",
      "brochureWithLogo",
      "brochureProofName",
      "attendanceSheetWithHeader",
      "attendanceSheetName",
      "uploadedReport",
    ],
  },
  {
    section: "Promotion in Social Media",
    fields: [
      "promoteTwitter",
      "twitterUrl",
      "promoteFacebook",
      "facebookUrl",
      "promoteInstagram",
      "instagramUrl",
      "promoteLinkedin",
      "linkedinUrl",
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

        hydratedValues[field.key] = String(parsedValues[field.key] ?? "");
      });

      return hydratedValues;
    } catch {
      return initialValues;
    }
  });
  const [errors, setErrors] = useState({});
  const [submitMessage, setSubmitMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const maxLengthByKey = { objective: 100, benefitLearning: 150, outcomeObtained: 150, remark: 150 };
  const maxWordsByKey = { aboutEvent: 150, aboutSpeaker: 150 };

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

    if (field.type === "textarea" && maxLengthByKey[field.key]) {
      const limit = maxLengthByKey[field.key];
      if (String(value ?? "").length > limit) {
        alert(`${field.label} must be ${limit} characters or less (including spaces).`);
        setErrors((previous) => ({ ...previous, [field.key]: `${field.label} exceeds ${limit} characters.` }));
        return;
      }
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

    setSubmitMessage("");
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

      if (field.type === "textarea" && maxWordsByKey[field.key]) {
        const limit = maxWordsByKey[field.key];
        if (countWords(value) > limit) {
          nextErrors[field.key] = `${field.label} must be ${limit} words or less.`;
        }
      }
    });

    if (String(formValues.previousAcademicYear ?? "").trim() && String(formValues.currentAcademicYear ?? "").trim()) {
      const previousStartYear = Number(String(formValues.previousAcademicYear).split("-")[0]);
      const currentStartYear = Number(String(formValues.currentAcademicYear).split("-")[0]);

      if (!Number.isNaN(previousStartYear) && !Number.isNaN(currentStartYear) && previousStartYear >= currentStartYear) {
        nextErrors.currentAcademicYear = "Current Academic Year must be after Previous Academic Year";
      }
    }

    if (formValues.durationManual) {
      const durationValue = String(formValues.durationHours ?? "").trim();
      if (!durationValue) {
        nextErrors.durationHours = "Duration of Activity (Hrs) is mandatory";
      } else if (Number(durationValue) < 0) {
        nextErrors.durationHours = "Duration of Activity (Hrs) cannot be negative";
      }
    } else {
      const startDateTime = String(formValues.fromDate ?? "").trim();
      const endDateTime = String(formValues.toDate ?? "").trim();

      if (!startDateTime) {
        nextErrors.fromDate = "Start Date & Time is mandatory";
      }

      if (!endDateTime) {
        nextErrors.toDate = "End Date & Time is mandatory";
      }

      if (startDateTime && endDateTime) {
        const calculatedDuration = getDurationFromDateTime(startDateTime, endDateTime);
        if (calculatedDuration.error) {
          nextErrors.toDate = calculatedDuration.error;
        }
      }
    }

    const socialPairs = [
      ["promoteTwitter", "twitterUrl", "Twitter URL is required when Twitter is selected"],
      ["promoteFacebook", "facebookUrl", "Facebook URL is required when Facebook is selected"],
      ["promoteInstagram", "instagramUrl", "Instagram URL is required when Instagram is selected"],
      ["promoteLinkedin", "linkedinUrl", "LinkedIn URL is required when LinkedIn is selected"],
    ];

    socialPairs.forEach(([toggleKey, urlKey, message]) => {
      if (formValues[toggleKey] && !String(formValues[urlKey] ?? "").trim()) {
        nextErrors[urlKey] = message;
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      setSubmitMessage("Please fill all mandatory fields.");
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage("");

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

      await createEventDetails(formData);
      window.localStorage.removeItem(EVENT_DETAILS_STORAGE_KEY);
      setFormValues(initialValues);
      setErrors({});
      setSubmitMessage("Event details uploaded successfully.");
    } catch (error) {
      setSubmitMessage(error.message || "Failed to upload event details.");
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
      return <p className="text-xs text-gray-500">Max {maxMb}MB</p>;
    }

    if (["photograph2", "offlineEventProof2", "onlineEventProof2"].includes(field.key)) {
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

    if (field.type === "textarea" && maxLengthByKey[field.key]) {
      const limit = maxLengthByKey[field.key];
      return <p className="text-xs text-gray-500">Max {limit} characters (including spaces)</p>;
    }

    if (field.type === "textarea" && maxWordsByKey[field.key]) {
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
        <input
          id={field.key}
          name={field.key}
          type="file"
          accept={field.accept}
          onChange={(event) => handleChange(field, event.target.files?.[0] ?? null)}
          className="w-full rounded border border-gray-300 p-2 outline-none focus:border-gray-500"
        />
      )}

      {field.type === "select" && (
        <select
          id={field.key}
          name={field.key}
          value={formValues[field.key]}
          onChange={(event) => handleChange(field, event.target.value)}
          className="w-full rounded border border-gray-300 bg-white p-2 outline-none focus:border-gray-500"
        >
          <option value="">Select</option>
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
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
          readOnly={field.key === "durationHours" && !formValues.durationManual}
          className={`w-full rounded border border-gray-300 p-2 outline-none focus:border-gray-500 ${
            field.key === "fromDate" || field.key === "toDate" ? "whitespace-nowrap" : ""
          }`}
        />
      )}

      {renderFieldHint(field)}

      {errors[field.key] && <p className="text-sm text-red-600">{errors[field.key]}</p>}
    </div>
  );

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

  const activeStep = stepSections[currentStepIndex];
  const isLastStep = currentStepIndex === stepSections.length - 1;

  return (
    <div className="mx-auto w-full p-6">
      <h1 className="text-2xl font-semibold">IIC / BIP Portal Document Details</h1>
      <p className="mt-2 text-sm text-gray-600">
        First 3 attachments (IIC) and remaining attachments (BIP) are merged and displayed.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium text-gray-700">
              Step {currentStepIndex + 1} of {stepSections.length}
            </p>

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
                className="rounded bg-black px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <div className="relative min-w-[760px] px-2 pb-1">
              <div className="absolute left-8 right-8 top-4 h-0.5 bg-gray-300" />
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
                            ? "border-black bg-black text-white"
                            : "border-gray-300 bg-white text-gray-600"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span
                        className={`mt-2 text-xs ${
                          isActiveStep ? "font-semibold text-black" : "text-gray-600"
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

        {activeStep && (
          <section className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="text-lg font-medium text-gray-900">{activeStep.section}</h2>

            {activeStep.section === "Program Details" && <div className="mt-4">{renderDurationGroup()}</div>}

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {activeStep.fields.map((field) => renderField(field))}
            </div>
          </section>
        )}

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-gray-500">{!isLastStep ? "Go to the last step to save." : "Review and save."}</p>
          <button
            type="submit"
            disabled={!isLastStep || Object.values(errors).some(Boolean) || isSubmitting}
            className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save Details"}
          </button>
        </div>

        {submitMessage && <p className="text-sm font-medium text-gray-700">{submitMessage}</p>}
      </form>
    </div>
  );
}

export default EventDetails;
