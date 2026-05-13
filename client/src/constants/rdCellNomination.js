export const RD_CELL_NOMINATION_STORAGE_KEY = "rd-cell-nomination-form-values";

export const rdCellNominationFields = [
  {
    key: "nominationTitle",
    label: "Name",
    type: "text",
    required: true,
  },
  {
    key: "nomineeName",
    label: "Role",
    type: "text",
    required: true,
  },
  {
    key: "nomineeEmail",
    label: "Email",
    type: "email",
    required: true,
  },
  {
    key: "phoneNumber",
    label: "Phone Number",
    type: "tel",
    required: true,
  },
];

export const rdCellDisplayStructure = [
  {
    section: "Nomination Details",
    fields: [
      "nominationTitle",
      "nomineeName",
      "nomineeEmail",
      "phoneNumber",
    ],
  },
];

export const rdCellDetailSteps = [
  { key: "nominationDetails", label: "Nomination Details" },
];

export const rdCellFieldLabels = Object.fromEntries(
  rdCellNominationFields.map((field) => [field.key, field.label]),
);

export const rdCellAttachmentConditionalFields = {};

export const rdCellMaxWordsByKey = {
  nominationTitle: 20,
  nomineeName: 20,
};
