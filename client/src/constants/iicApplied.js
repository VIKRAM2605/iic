export const IIC_APPLIED_STORAGE_KEY = "iic-applied-form-values";

export const iicAppliedFields = [
  {
    key: "serviceName",
    label: "Name of the event",
    type: "text",
    required: true,
  },
  {
    key: "serviceRole",
    label: "Team Involved",
    type: "select",
    options: ["Department", "Special", "Club"],
    required: true,
  },
  {
    key: "serviceFocusArea",
    label: "Select the type of event",
    type: "select",
    options: [
      "Expert interaction",
      "HACK-A-THON",
      "Hands on training",
      "Idea presentation",
      "Industrial visit to start up companies",
    ],
    required: true,
  },
  {
    key: "equipments",
    label: "Equipments",
    type: "select",
    options: [
      "Innovation and design thinking",
      "IPR & Technology Transfer",
      "Entrepreneurship & start up",
      "Preincubation & Incubatiation Management",
    ],
    required: true,
  },
  {
    key: "fromDate",
    label: "From Date",
    type: "date",
    required: true,
  },
  {
    key: "toDate",
    label: "To Date",
    type: "date",
    required: true,
  },
  {
    key: "eventObjective",
    label: "Objective of the event",
    type: "textarea",
    rows: 4,
    required: true,
  },
  {
    key: "outcomeSkill",
    label: "Outcome obtained in terms of skill",
    type: "textarea",
    rows: 5,
    required: true,
  },
  {
    key: "brochureFile",
    label: "Upload Brouchure (should contain IIC logo & the terms BIT-IIC Organisers)",
    type: "file",
    accept: ".pdf,application/pdf",
    required: true,
  },
  {
    key: "iicVerification",
    label: "IIC verification",
    type: "text",
    readOnly: true,
    required: true,
  },
];

export const iicAppliedDisplayStructure = [
  {
    section: "IIC Applied Details",
    fields: [
      "serviceName",
      "serviceRole",
      "serviceFocusArea",
      "equipments",
      "fromDate",
      "toDate",
      "eventObjective",
      "outcomeSkill",
      "brochureFile",
      "iicVerification",
    ],
  },
];

export const iicAppliedDetailSteps = [
  { key: "appliedDetails", label: "IIC Applied Details" },
  { key: "attachments", label: "Attachments" },
];

export const iicAppliedFieldLabels = Object.fromEntries(
  iicAppliedFields.map((field) => [field.key, field.label]),
);

export const iicAppliedMaxWordsByKey = {
  serviceName: 20,
  serviceRole: 20,
};

export const iicAppliedMaxCharactersByKey = {
  eventObjective: 100,
  outcomeSkill: 150,
};
