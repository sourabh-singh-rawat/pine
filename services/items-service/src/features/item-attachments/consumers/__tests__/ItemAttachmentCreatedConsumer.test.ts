import {
  AttachmentCreatedEvent,
  AttachmentQuarantinedEvent,
  createCloudEvent,
  type IBroker,
} from "@pine/events";
import type { JsMsg } from "nats";
import { describe, expect, it, vi } from "vitest";
import type { IItemAttachmentService } from "@/features/item-attachments/services";
import { ItemAttachmentCreatedConsumer } from "../ItemAttachmentCreatedConsumer";

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

const createService = (
  overrides: Partial<IItemAttachmentService> = {},
): IItemAttachmentService => ({
  create: vi.fn(),
  list: vi.fn(),
  delete: vi.fn(),
  createUploadRequest: vi.fn(),
  completeUpload: vi.fn(),
  markScanning: vi.fn(),
  markFailed: vi.fn(),
  failStale: vi.fn(),
  ...overrides,
});

describe("ItemAttachmentCreatedConsumer", () => {
  it("marks scanning on organization quarantine with operationId", async () => {
    const itemAttachmentService = createService({
      markScanning: vi.fn().mockResolvedValue(null),
    });
    const consumer = new ItemAttachmentCreatedConsumer(createBroker(), itemAttachmentService);

    const messageObj: unknown = { ack: vi.fn() };
    if (!toJsMsg(messageObj)) {
      throw new Error("Invalid mock message");
    }

    const event = createCloudEvent({
      type: AttachmentQuarantinedEvent.type,
      version: AttachmentQuarantinedEvent.version,
      schema: AttachmentQuarantinedEvent.schema,
      source: "pine/attachment-service",
      subject: "att-1",
      data: {
        id: "att-1",
        scopeType: "ORGANIZATION",
        scopeId: "organization-1",
        currentVersionId: "ver-1",
        operationId: "upload-req-1",
        status: "QUARANTINED",
        securityStatus: "PENDING",
        createdBy: "user-1",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });

    await consumer.onMessage(messageObj, event);

    expect(itemAttachmentService.markScanning).toHaveBeenCalledWith({
      uploadRequestId: "upload-req-1",
      attachmentId: "att-1",
    });
    expect(itemAttachmentService.completeUpload).not.toHaveBeenCalled();
    expect(messageObj.ack).toHaveBeenCalled();
  });

  it("completes upload on available clean created event", async () => {
    const itemAttachmentService = createService({
      completeUpload: vi.fn().mockResolvedValue(null),
    });
    const consumer = new ItemAttachmentCreatedConsumer(createBroker(), itemAttachmentService);

    const messageObj: unknown = { ack: vi.fn() };
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
        scopeType: "ORGANIZATION",
        scopeId: "organization-1",
        operationId: "upload-req-1",
        status: "AVAILABLE",
        securityStatus: "CLEAN",
        createdBy: "user-1",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });

    await consumer.onMessage(messageObj, event);

    expect(itemAttachmentService.completeUpload).toHaveBeenCalledWith({
      uploadRequestId: "upload-req-1",
      attachmentId: "att-1",
    });
    expect(itemAttachmentService.markFailed).not.toHaveBeenCalled();
    expect(messageObj.ack).toHaveBeenCalled();
  });

  it("marks failed on rejected created event", async () => {
    const itemAttachmentService = createService({
      markFailed: vi.fn().mockResolvedValue(null),
    });
    const consumer = new ItemAttachmentCreatedConsumer(createBroker(), itemAttachmentService);

    const messageObj: unknown = { ack: vi.fn() };
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
        scopeType: "ORGANIZATION",
        scopeId: "organization-1",
        operationId: "upload-req-1",
        status: "REJECTED",
        securityStatus: "INFECTED",
        createdBy: "user-1",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });

    await consumer.onMessage(messageObj, event);

    expect(itemAttachmentService.markFailed).toHaveBeenCalledWith({
      uploadRequestId: "upload-req-1",
    });
    expect(itemAttachmentService.completeUpload).not.toHaveBeenCalled();
    expect(messageObj.ack).toHaveBeenCalled();
  });

  it("acks quarantine without operationId without calling the service", async () => {
    const itemAttachmentService = createService();
    const consumer = new ItemAttachmentCreatedConsumer(createBroker(), itemAttachmentService);

    const messageObj: unknown = { ack: vi.fn() };
    if (!toJsMsg(messageObj)) {
      throw new Error("Invalid mock message");
    }

    const event = createCloudEvent({
      type: AttachmentQuarantinedEvent.type,
      version: AttachmentQuarantinedEvent.version,
      schema: AttachmentQuarantinedEvent.schema,
      source: "pine/attachment-service",
      subject: "att-1",
      data: {
        id: "att-1",
        scopeType: "ORGANIZATION",
        scopeId: "organization-1",
        status: "QUARANTINED",
        securityStatus: "PENDING",
        createdBy: "user-1",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });

    await consumer.onMessage(messageObj, event);

    expect(itemAttachmentService.markScanning).not.toHaveBeenCalled();
    expect(messageObj.ack).toHaveBeenCalled();
  });
});
