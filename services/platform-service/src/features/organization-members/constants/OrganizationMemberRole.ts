export const OrganizationMemberRole = {
  OWNER: "owners",
  ADMIN: "admins",
  MEMBER: "members",
} as const;

export type OrganizationMemberRole =
  (typeof OrganizationMemberRole)[keyof typeof OrganizationMemberRole];
