export const ITEM_ATTACHMENT_STATUS = {
  PENDING: "PENDING",
  SCANNING: "SCANNING",
  READY: "READY",
  FAILED: "FAILED",
} as const;

export type ItemAttachmentStatus =
  (typeof ITEM_ATTACHMENT_STATUS)[keyof typeof ITEM_ATTACHMENT_STATUS];
