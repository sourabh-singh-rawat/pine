export const ITEM_ATTACHMENT_STATUS = {
  PENDING: "PENDING",
  SCANNING: "SCANNING",
  READY: "READY",
  FAILED: "FAILED",
} as const;

export type ItemAttachmentStatus =
  (typeof ITEM_ATTACHMENT_STATUS)[keyof typeof ITEM_ATTACHMENT_STATUS];

export const isProcessingAttachmentStatus = (status: string): boolean =>
  status === ITEM_ATTACHMENT_STATUS.PENDING || status === ITEM_ATTACHMENT_STATUS.SCANNING;
