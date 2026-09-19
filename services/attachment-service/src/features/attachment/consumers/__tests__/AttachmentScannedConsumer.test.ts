import { AttachmentScannedEvent, createCloudEvent } from "@pine/events";
import { describe, expect, it, vi } from "vitest";
import type { IAttachmentService } from "@/features/attachment/services";
import { AttachmentScannedConsumer } from "../AttachmentScannedConsumer";

const createBroker = () => ({
  client: { jetstream: vi.fn() },
  init: vi.fn(),
  getConfig: vi.fn(),
});

describe("AttachmentScannedConsumer", () => {
  it("processes scan result and updates security status", async () => {
    const attachmentService: IAttachmentService = {
      createFromUpload: vi.fn(),
      delete: vi.fn(),
      getContent: vi.fn(),
      updateSecurityStatus: vi.fn().mockResolvedValue({}),
    };

    const consumer = new AttachmentScannedConsumer(
      createBroker() as never,
      attachmentService,
    );

    const message = { ack: vi.fn() };
    const event = createCloudEvent({
      type: AttachmentScannedEvent.type,
      version: AttachmentScannedEvent.version,
      schema: AttachmentScannedEvent.schema,
      source: "pine/attachment-scanner-service",
      subject: "att-1",
      data: {
        scanId: "scan-1",
        attachmentId: "att-1",
        versionId: "ver-1",
        scopeType: "IDENTITY",
        scopeId: "user-1",
        type: "MALWARE",
        status: "CLEAN",
        scanner: "clamav",
        durationMs: 42,
      },
    });

    await consumer.onMessage(message as never, event);

    expect(attachmentService.updateSecurityStatus).toHaveBeenCalledWith({
      id: "att-1",
      status: "CLEAN",
    });
    expect(message.ack).toHaveBeenCalled();
  });
});
