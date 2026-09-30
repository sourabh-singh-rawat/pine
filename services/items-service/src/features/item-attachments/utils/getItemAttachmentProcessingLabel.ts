import { ITEM_ATTACHMENT_STATUS } from "../constants";

export const getItemAttachmentProcessingLabel = (status: string): string => {
  if (status === ITEM_ATTACHMENT_STATUS.SCANNING) {
    return "Scanning…";
  }
  if (status === ITEM_ATTACHMENT_STATUS.FAILED) {
    return "Scan failed";
  }
  return "Processing…";
};
