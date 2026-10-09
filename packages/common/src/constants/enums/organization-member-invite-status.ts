export const ORGANIZATION_MEMBER_INVITE_STATUS = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  EXPIRED: "Expired",
  REVOKED: "Revoked",
  ERROR: "Error",
} as const;

export type OrganizationMemberInviteStatus =
  (typeof ORGANIZATION_MEMBER_INVITE_STATUS)[keyof typeof ORGANIZATION_MEMBER_INVITE_STATUS];
