export const ATTACHMENT_SCOPE_TYPE = {
  IDENTITY: "IDENTITY",
  ORGANIZATION: "ORGANIZATION",
} as const;

export type AttachmentScopeType =
  (typeof ATTACHMENT_SCOPE_TYPE)[keyof typeof ATTACHMENT_SCOPE_TYPE];
