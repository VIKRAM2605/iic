export const RD_CELL_ACTIVITY_STORAGE_KEY = "rd-cell-activity-form-values";

export const rdCellActivityFields = [
  {
    key: "subTheme",
    label: "Sub Theme",
    type: "text",
    required: true,
  },
  {
    key: "title",
    label: "Title",
    type: "text",
    required: true,
  },
  {
    key: "levelDuration",
    label: "Level Duration",
    type: "text",
    required: true,
  },
  {
    key: "description",
    label: "Description",
    type: "textarea",
    required: true,
  },
];

export const rdCellActivityDisplayStructure = [
  {
    section: "Activity Details",
    fields: [
      "subTheme",
      "title",
      "levelDuration",
      "description",
    ],
  },
];

export const rdCellActivityDetailSteps = [
  { key: "activityDetails", label: "Activity Details" },
];

export const rdCellActivityFieldLabels = Object.fromEntries(
  rdCellActivityFields.map((field) => [field.key, field.label]),
);

export const rdCellActivityAttachmentConditionalFields = {};

export const rdCellActivityMaxWordsByKey = {
  subTheme: 20,
  title: 20,
  levelDuration: 20,
  description: 120,
};
