import { describe, expect, it } from "vitest";
import { ITEM_ATTACHMENT_STATUS } from "../../constants";
import { getItemAttachmentProcessingLabel } from "../getItemAttachmentProcessingLabel";

describe("getItemAttachmentProcessingLabel", () => {
  it("returns Scanning… for SCANNING", () => {
    expect(getItemAttachmentProcessingLabel(ITEM_ATTACHMENT_STATUS.SCANNING)).toBe("Scanning…");
  });

  it("returns Scan failed for FAILED", () => {
    expect(getItemAttachmentProcessingLabel(ITEM_ATTACHMENT_STATUS.FAILED)).toBe("Scan failed");
  });

  it("returns Processing… for PENDING and other statuses", () => {
    expect(getItemAttachmentProcessingLabel(ITEM_ATTACHMENT_STATUS.PENDING)).toBe("Processing…");
    expect(getItemAttachmentProcessingLabel(ITEM_ATTACHMENT_STATUS.READY)).toBe("Processing…");
    expect(getItemAttachmentProcessingLabel("UNKNOWN")).toBe("Processing…");
  });
});
