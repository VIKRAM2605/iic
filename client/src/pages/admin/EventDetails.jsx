import React, { useMemo, useState } from "react";

const iicPortalDocFields = [
  { key: "academicYear", label: "Academic Year", type: "text", required: true },
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
  { key: "durationHours", label: "Duration of Activity (Hrs)", type: "number", required: true },
  { key: "fromDate", label: "Start Date", type: "date", required: true },
  { key: "toDate", label: "End Date", type: "date", required: true },
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
  { key: "speakerName", label: "Speaker Name", type: "text", required: true },
  { key: "speakerDesignation", label: "Speaker Designation", type: "text", required: true },
  { key: "speakerOrganization", label: "Speaker Organization", type: "text", required: true },
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
  { key: "recordId", label: "ID", type: "text", required: false },
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
  { key: "coreTheme", label: "Select Core Theme", type: "text", required: false },
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
      "academicYear",
      "quarter",
      "programDrivenBy",
      "programActivityName",
      "programType",
      "activityLedBy",
      "programTheme",
      "durationHours",
      "fromDate",
      "toDate",
      "studentParticipants",
      "facultyParticipants",
      "externalParticipants",
      "expenditureAmount",
      "modeOfSession",
      "eventType",
      "coreTheme",
    ],
  },
  {
    section: "Overview",
    fields: ["objective", "benefitLearning", "outcomeObtained", "remark"],
  },
  {
    section: "Speaker",
    fields: ["speakerName", "speakerDesignation", "speakerOrganization", "sessionVideoUrl", "publishedSocialMediaUrl"],
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
      "recordId",
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

  const [formValues, setFormValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [submitMessage, setSubmitMessage] = useState("");
  const maxLengthByKey = { objective: 100, benefitLearning: 150, outcomeObtained: 150, remark: 150 };

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

    setFormValues((previous) => ({ ...previous, [field.key]: value }));
    setErrors((previous) => ({ ...previous, [field.key]: "" }));
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
    });

    if (String(formValues.fromDate ?? "").trim() && String(formValues.toDate ?? "").trim()) {
      if (new Date(formValues.toDate) < new Date(formValues.fromDate)) {
        nextErrors.toDate = "End Date cannot be before Start Date";
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

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validate()) {
      setSubmitMessage("Please fill all mandatory fields.");
      return;
    }

    setSubmitMessage("All IIC mandatory fields and BIP portal fields are captured without repetition.");
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

    if (field.type === "textarea" && maxLengthByKey[field.key]) {
      const limit = maxLengthByKey[field.key];
      return <p className="text-xs text-gray-500">Max {limit} characters (including spaces)</p>;
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
          min={
            field.type === "number"
              ? "0"
              : field.key === "toDate"
                ? formValues.fromDate || undefined
                : undefined
          }
          value={formValues[field.key]}
          onChange={(event) => handleChange(field, event.target.value)}
          className="w-full rounded border border-gray-300 p-2 outline-none focus:border-gray-500"
        />
      )}

      {renderFieldHint(field)}

      {errors[field.key] && <p className="text-sm text-red-600">{errors[field.key]}</p>}
    </div>
  );

  return (
    <div className="mx-auto w-full p-6">
      <h1 className="text-2xl font-semibold">IIC / BIP Portal Document Details</h1>
      <p className="mt-2 text-sm text-gray-600">
        First 3 attachments (IIC) and remaining attachments (BIP) are merged and displayed once without repetition.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        {structuredSections.map((group) => (
          <section key={group.section} className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="text-lg font-medium text-gray-900">{group.section}</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {group.fields.map((field) => renderField(field))}
            </div>
          </section>
        ))}

        <button
          type="submit"
          disabled={Object.keys(errors).length > 0}
          className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          Save Details
        </button>

        {submitMessage && <p className="text-sm font-medium text-gray-700">{submitMessage}</p>}
      </form>
    </div>
  );
}

export default EventDetails;
