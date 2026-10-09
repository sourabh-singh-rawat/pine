export const ORGANIZATION_MEMBER_STATUS = {
  ACTIVE: "Active",
  PENDING: "Pending",
  INVITED: "Invited",
  REMOVED: "Removed",
  SUSPENED: "Suspended",
  BLOCKED: "Blocked",
  DELETED: "Deleted",
} as const;

export type OrganizationMemberStatus =
  (typeof ORGANIZATION_MEMBER_STATUS)[keyof typeof ORGANIZATION_MEMBER_STATUS];
