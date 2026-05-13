export const RD_PROJECTS_OUTPUTS_STORAGE_KEY = "rd-projects-outputs-form-values";

export const rdProjectsOutputsFields = [
  {
    key: "projectName",
    label: "R&D Project Title",
    type: "text",
    required: true,
  },
  {
    key: "principalInvestigation",
    label: "Principal Invertigation",
    type: "text",
    required: true,
  },
  {
    key: "department",
    label: "Department",
    type: "text",
    required: true,
  },
  {
    key: "trlLevel",
    label: "TRL level of Project",
    type: "text",
    required: true,
  },
  {
    key: "ipStatus",
    label: "IP status of project",
    type: "select",
    options: ["Patent", "No Patent"],
    required: true,
  },
  {
    key: "projectStatus",
    label: "Project Status",
    type: "select",
    options: ["Completed", "Ongoing"],
    required: true,
  },
];

export const rdProjectsOutputsDisplayStructure = [
  {
    section: "Project Details",
    fields: [
      "projectName",
      "principalInvestigation",
      "department",
      "trlLevel",
      "ipStatus",
      "projectStatus",
    ],
  },
];

export const rdProjectsOutputsDetailSteps = [
  { key: "projectDetails", label: "Project Details" },
];

export const rdProjectsOutputsFieldLabels = Object.fromEntries(
  rdProjectsOutputsFields.map((field) => [field.key, field.label]),
);

export const rdProjectsOutputsAttachmentConditionalFields = {};

export const rdProjectsOutputsMaxWordsByKey = {
  projectName: 20,
  principalInvestigation: 20,
  department: 20,
  trlLevel: 20,
};
