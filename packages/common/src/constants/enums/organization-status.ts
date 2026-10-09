export const ORGANIZATION_STATUS = {
  PENDING: "Pending",
  ACTIVE: "Active",
  DEFAULT: "Default",
  ARCHIVED: "Archived",
  TEMPLATE: "Template",
} as const;

export type OrganizationStatus = (typeof ORGANIZATION_STATUS)[keyof typeof ORGANIZATION_STATUS];
