import {
  AttachmentQuarantinedEvent,
  createCloudEvent,
  type IBroker,
} from "@pine/events";
import type { JsMsg } from "nats";
import { describe, expect, it, vi } from "vitest";
import type { IAttachmentScannerService } from "@/features/attachment-scanner/services";
import { AttachmentQuarantinedConsumer } from "../AttachmentQuarantinedConsumer";

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

describe("AttachmentQuarantinedConsumer", () => {
  it("calls attachment scanner service and acknowledges message", async () => {
    const scannerService: IAttachmentScannerService = {
      scan: vi.fn().mockResolvedValue({
        id: "scan-1",
        attachmentId: "att-1",
        versionId: "ver-1",
        scopeType: "IDENTITY",
        scopeId: "user-1",
        tenantId: "tenant-1",
        type: "MALWARE",
        status: "PENDING",
        scanner: null,
        durationMs: null,
        result: null,
        metadata: null,
        storageProvider: null,
        storageObjectKey: null,
        scannedAt: null,
        createdAt: new Date(),
        updatedAt: null,
      }),
    };

    const consumer = new AttachmentQuarantinedConsumer(
      createBroker(),
      scannerService,
    );

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
        scopeType: "IDENTITY",
        scopeId: "user-1",
        tenantId: "tenant-1",
        currentVersionId: "ver-1",
        status: "QUARANTINED",
        securityStatus: "MALICIOUS",
        createdBy: "user-1",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });

    await consumer.onMessage(messageObj, event);

    expect(scannerService.scan).toHaveBeenCalledWith({
      attachmentId: "att-1",
      versionId: "ver-1",
      scopeType: "IDENTITY",
      scopeId: "user-1",
      tenantId: "tenant-1",
    });
    expect(messageObj.ack).toHaveBeenCalled();
  });
});
