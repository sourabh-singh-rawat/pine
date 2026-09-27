import { AttachmentCreatedEvent, createCloudEvent, type IBroker } from "@pine/events";
import type { JsMsg } from "nats";
import { describe, expect, it, vi } from "vitest";
import type { IThumbnailProcessingService } from "@/features/thumbnail-processing/services";
import { AttachmentImageThumbnailConsumer } from "../AttachmentImageThumbnailConsumer";

const toBroker = (_val: unknown): _val is IBroker => true;
const toJsMsg = (_val: unknown): _val is JsMsg => true;

const createBroker = (): IBroker => {
  const brokerObj: unknown = {
    client: { jetstream: vi.fn() },
    init: vi.fn(),
    getConfig: vi.fn(),
  };

  if (toBroker(brokerObj)) {
    return brokerObj;
  }

  throw new Error("Invalid mock broker");
};

describe("AttachmentImageThumbnailConsumer", () => {
  it("processes available image attachment using top-level contentType", async () => {
    const process = vi.fn().mockResolvedValue(undefined);
    const thumbnailProcessingService: IThumbnailProcessingService = {
      process,
      generateSizes: vi.fn(),
    };

    const consumer = new AttachmentImageThumbnailConsumer(
      createBroker(),
      thumbnailProcessingService,
    );

    const ack = vi.fn();
    const messageObj: unknown = { ack };
    if (!toJsMsg(messageObj)) {
      throw new Error("Invalid mock message");
    }

    const event = createCloudEvent({
      type: AttachmentCreatedEvent.type,
      version: AttachmentCreatedEvent.version,
      schema: AttachmentCreatedEvent.schema,
      source: "pine/attachment-service",
      subject: "att-1",
      data: {
        id: "att-1",
        scopeType: "IDENTITY",
        scopeId: "user-1",
        tenantId: "tenant-1",
        currentVersionId: "ver-1",
        contentType: "image/png",
        status: "AVAILABLE",
        securityStatus: "CLEAN",
        metadata: { itemId: "item-1", uploadRequestId: "upload-1" },
        createdBy: "user-1",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });

    await consumer.onMessage(messageObj, event);

    expect(process).toHaveBeenCalledWith({
      attachmentId: "att-1",
      versionId: "ver-1",
      mimeType: "image/png",
      scopeType: "IDENTITY",
      scopeId: "user-1",
      tenantId: "tenant-1",
      url: undefined,
    });
    expect(ack).toHaveBeenCalled();
  });

  it("acknowledges but does not process non-image attachment", async () => {
    const process = vi.fn().mockResolvedValue(undefined);
    const thumbnailProcessingService: IThumbnailProcessingService = {
      process,
      generateSizes: vi.fn(),
    };

    const consumer = new AttachmentImageThumbnailConsumer(
      createBroker(),
      thumbnailProcessingService,
    );

    const ack = vi.fn();
    const messageObj: unknown = { ack };
    if (!toJsMsg(messageObj)) {
      throw new Error("Invalid mock message");
    }

    const event = createCloudEvent({
      type: AttachmentCreatedEvent.type,
      version: AttachmentCreatedEvent.version,
      schema: AttachmentCreatedEvent.schema,
      source: "pine/attachment-service",
      subject: "att-2",
      data: {
        id: "att-2",
        scopeType: "IDENTITY",
        scopeId: "user-1",
        tenantId: "tenant-1",
        currentVersionId: "ver-2",
        contentType: "application/pdf",
        status: "AVAILABLE",
        securityStatus: "CLEAN",
        metadata: { uploadRequestId: "upload-2" },
        createdBy: "user-1",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });

    await consumer.onMessage(messageObj, event);

    expect(process).not.toHaveBeenCalled();
    expect(ack).toHaveBeenCalled();
  });
});
