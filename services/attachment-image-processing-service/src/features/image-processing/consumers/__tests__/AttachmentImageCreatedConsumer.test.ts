import { AttachmentCreatedEvent, createCloudEvent, type IBroker } from "@pine/events";
import type { JsMsg } from "nats";
import { describe, expect, it, vi } from "vitest";
import type { IImageProcessingService } from "@/features/image-processing/services";
import { AttachmentImageCreatedConsumer } from "../AttachmentImageCreatedConsumer";

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

describe("AttachmentImageCreatedConsumer", () => {
  it("processes available image attachment using top-level contentType", async () => {
    const processImage = vi.fn().mockResolvedValue(undefined);
    const imageProcessingService: IImageProcessingService = {
      process: processImage,
    };

    const consumer = new AttachmentImageCreatedConsumer(createBroker(), imageProcessingService);

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

    expect(processImage).toHaveBeenCalledWith({
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

  it("falls back to metadata.contentType when top-level contentType is absent", async () => {
    const processImage = vi.fn().mockResolvedValue(undefined);
    const imageProcessingService: IImageProcessingService = {
      process: processImage,
    };

    const consumer = new AttachmentImageCreatedConsumer(createBroker(), imageProcessingService);

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
      subject: "att-1b",
      data: {
        id: "att-1b",
        scopeType: "IDENTITY",
        scopeId: "user-1",
        tenantId: "tenant-1",
        currentVersionId: "ver-1b",
        status: "AVAILABLE",
        securityStatus: "CLEAN",
        metadata: { contentType: "image/jpeg" },
        createdBy: "user-1",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });

    await consumer.onMessage(messageObj, event);

    expect(processImage).toHaveBeenCalledWith({
      attachmentId: "att-1b",
      versionId: "ver-1b",
      mimeType: "image/jpeg",
      scopeType: "IDENTITY",
      scopeId: "user-1",
      tenantId: "tenant-1",
      url: undefined,
    });
    expect(ack).toHaveBeenCalled();
  });

  it("acknowledges but does not process non-image attachment", async () => {
    const processImage = vi.fn().mockResolvedValue(undefined);
    const imageProcessingService: IImageProcessingService = {
      process: processImage,
    };

    const consumer = new AttachmentImageCreatedConsumer(createBroker(), imageProcessingService);

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

    expect(processImage).not.toHaveBeenCalled();
    expect(ack).toHaveBeenCalled();
  });

  it("acknowledges but does not process when contentType is missing", async () => {
    const processImage = vi.fn().mockResolvedValue(undefined);
    const imageProcessingService: IImageProcessingService = {
      process: processImage,
    };

    const consumer = new AttachmentImageCreatedConsumer(createBroker(), imageProcessingService);

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
      subject: "att-2b",
      data: {
        id: "att-2b",
        scopeType: "WORKSPACE",
        scopeId: "ws-1",
        tenantId: "tenant-1",
        currentVersionId: "ver-2b",
        status: "AVAILABLE",
        securityStatus: "CLEAN",
        metadata: { itemId: "item-1", uploadRequestId: "upload-2b" },
        createdBy: "user-1",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });

    await consumer.onMessage(messageObj, event);

    expect(processImage).not.toHaveBeenCalled();
    expect(ack).toHaveBeenCalled();
  });

  it("acknowledges but does not process non-available attachment", async () => {
    const processImage = vi.fn().mockResolvedValue(undefined);
    const imageProcessingService: IImageProcessingService = {
      process: processImage,
    };

    const consumer = new AttachmentImageCreatedConsumer(createBroker(), imageProcessingService);

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
      subject: "att-3",
      data: {
        id: "att-3",
        scopeType: "IDENTITY",
        scopeId: "user-1",
        tenantId: "tenant-1",
        currentVersionId: "ver-3",
        contentType: "image/png",
        status: "REJECTED",
        securityStatus: "INFECTED",
        metadata: { contentType: "image/png" },
        createdBy: "user-1",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });

    await consumer.onMessage(messageObj, event);

    expect(processImage).not.toHaveBeenCalled();
    expect(ack).toHaveBeenCalled();
  });
});
