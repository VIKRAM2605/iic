export const RD_FACILITIES_SERVICES_STORAGE_KEY =
  "rd-facilities-services-form-values";

export const rdFacilitiesServicesFields = [
  {
    key: "serviceName",
    label: "Facility name",
    type: "text",
    required: true,
  },
  {
    key: "serviceRole",
    label: "Department",
    type: "text",
    required: true,
  },
  {
    key: "serviceFocusArea",
    label: "Research R&D Focus area",
    type: "text",
    required: true,
  },
  {
    key: "equipments",
    label: "Equipments",
    type: "text",
    required: true,
  },
  {
    key: "contactName",
    label: "Name",
    type: "text",
    required: true,
  },
  {
    key: "contactEmail",
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

export const rdFacilitiesServicesDisplayStructure = [
  {
    section: "Facilities and Services Details",
    fields: [
      "serviceName",
      "serviceRole",
      "serviceFocusArea",
      "equipments",
      "contactName",
      "contactEmail",
      "phoneNumber",
    ],
  },
];

export const rdFacilitiesServicesDetailSteps = [
  { key: "facilityDetails", label: "Facilities and Services Details" },
];

export const rdFacilitiesServicesFieldLabels = Object.fromEntries(
  rdFacilitiesServicesFields.map((field) => [field.key, field.label]),
);

export const rdFacilitiesServicesMaxWordsByKey = {
  serviceName: 20,
  serviceRole: 20,
  serviceFocusArea: 25,
  equipments: 25,
  contactName: 20,
};
