export const RD_EQUIPMENTS_SERVICES_STORAGE_KEY = "rd-equipments-services-form-values";

export const rdEquipmentsServicesFields = [
  {
    key: "equipmentName",
    label: "Equipment",
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
    key: "utilizationRate",
    label: "Utilization rate",
    type: "text",
    required: true,
  },
  {
    key: "suitableDays",
    label: "Suitable days",
    type: "text",
    required: true,
  },
];

export const rdEquipmentsServicesDisplayStructure = [
  {
    section: "Equipment Details",
    fields: ["equipmentName", "department", "utilizationRate", "suitableDays"],
  },
];

export const rdEquipmentsServicesDetailSteps = [
  { key: "equipmentDetails", label: "Equipment Details" },
];

export const rdEquipmentsServicesFieldLabels = Object.fromEntries(
  rdEquipmentsServicesFields.map((field) => [field.key, field.label]),
);

export const rdEquipmentsServicesAttachmentConditionalFields = {};

export const rdEquipmentsServicesMaxWordsByKey = {
  equipmentName: 20,
  department: 20,
  suitableDays: 20,
};
