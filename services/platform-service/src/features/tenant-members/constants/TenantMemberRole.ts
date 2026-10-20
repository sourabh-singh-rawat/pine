export const TenantMemberRole = {
  OWNER: "owners",
  ADMIN: "admins",
  MEMBER: "members",
} as const;

export type TenantMemberRole = (typeof TenantMemberRole)[keyof typeof TenantMemberRole];
