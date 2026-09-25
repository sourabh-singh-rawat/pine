import { Readable } from "node:stream";
import type { IAttachmentClient } from "@pine/attachment";
import { AttachmentScannedEvent } from "@pine/events";
import type { IOutboxService } from "@pine/outbox";
import { describe, expect, it, vi } from "vitest";
import { ATTACHMENT_SCAN_TYPE, MALWARE_ATTACHMENT_SCAN_STATUS } from "@/constants";
import type { AttachmentScan, DbClient } from "@/db";
import type { IAttachmentScanRepository } from "@/features/attachment-scanner/repositories";
import type { IMalwareScannerService } from "@/features/malware-scanner/services";
import { AttachmentScannerService, type ScannerDatabase } from "../AttachmentScannerService";

const toDbClient = (_val: unknown): _val is DbClient => true;
const dummyTx: unknown = {};
const mockTx = toDbClient(dummyTx) ? dummyTx : undefined;

describe("AttachmentScannerService", () => {
  it("scans a clean attachment successfully and schedules outbox event", async () => {
    const mockScan: AttachmentScan = {
      id: "scan-1",
      attachmentId: "att-1",
      versionId: "ver-1",
      scopeType: "IDENTITY",
      scopeId: "user-1",
      tenantId: "tenant-1",
      type: ATTACHMENT_SCAN_TYPE.MALWARE,
      status: MALWARE_ATTACHMENT_SCAN_STATUS.SCANNING,
      scanner: null,
      durationMs: null,
      result: null,
      metadata: null,
      storageProvider: null,
      storageObjectKey: null,
      scannedAt: null,
      createdAt: new Date(),
      updatedAt: null,
    };

    const mockUpdatedScan: AttachmentScan = {
      ...mockScan,
      status: MALWARE_ATTACHMENT_SCAN_STATUS.CLEAN,
      scanner: "clamav",
      durationMs: 50,
      result: {
        isInfected: false,
        threats: [],
        rawOutput: "stream: OK",
      },
    };

    const scanRepository: IAttachmentScanRepository = {
      save: vi.fn().mockResolvedValue(mockScan),
      findById: vi.fn().mockResolvedValue(mockScan),
      findByAttachmentAndVersion: vi.fn().mockResolvedValue(mockScan),
      updateResult: vi.fn().mockResolvedValue(mockUpdatedScan),
      updateStatus: vi.fn().mockResolvedValue(mockUpdatedScan),
    };

    const stream = Readable.from(["file-content"]);
    const attachmentClient: IAttachmentClient = {
      createUploadTarget: vi.fn(),
      downloadStream: vi.fn().mockResolvedValue(stream),
    };

    const malwareScannerService: IMalwareScannerService = {
      scan: vi.fn().mockResolvedValue({
        isInfected: false,
        viruses: [],
        rawResponse: "stream: OK",
      }),
      ping: vi.fn().mockResolvedValue(true),
      version: vi.fn().mockResolvedValue("ClamAV 1.4.0"),
    };

    const outboxService: IOutboxService = {
      schedule: vi
        .fn()
        .mockResolvedValue({ id: "outbox-1" } as unknown as import("@pine/outbox").OutboxMessage),
      claimBatch: vi.fn(),
      complete: vi.fn(),
      failed: vi.fn(),
      get: vi.fn(),
      getByEventId: vi.fn(),
    };

    const db: ScannerDatabase = {
      transaction: vi.fn(async (cb) => {
        if (!mockTx) {
          throw new Error("mockTx not defined");
        }
        return cb(mockTx);
      }),
    };

    const service = new AttachmentScannerService(
      scanRepository,
      attachmentClient,
      malwareScannerService,
      outboxService,
      db,
    );

    const result = await service.scan({
      attachmentId: "att-1",
      versionId: "ver-1",
      scopeType: "IDENTITY",
      scopeId: "user-1",
      tenantId: "tenant-1",
    });

    expect(scanRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        attachmentId: "att-1",
        versionId: "ver-1",
        scopeType: "IDENTITY",
        scopeId: "user-1",
        tenantId: "tenant-1",
        type: ATTACHMENT_SCAN_TYPE.MALWARE,
        status: MALWARE_ATTACHMENT_SCAN_STATUS.SCANNING,
      }),
    );
    expect(attachmentClient.downloadStream).toHaveBeenCalledWith({
      attachmentId: "att-1",
      versionId: "ver-1",
    });
    expect(malwareScannerService.scan).toHaveBeenCalledWith(stream);
    expect(scanRepository.updateResult).toHaveBeenCalledWith(
      "scan-1",
      expect.objectContaining({
        status: MALWARE_ATTACHMENT_SCAN_STATUS.CLEAN,
        scanner: "clamav",
        result: {
          isInfected: false,
          threats: [],
          rawOutput: "stream: OK",
        },
      }),
      expect.anything(),
    );
    expect(outboxService.schedule).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: AttachmentScannedEvent.type,
        eventVersion: AttachmentScannedEvent.version,
        aggregateType: "attachment_scan",
        aggregateId: "scan-1",
        payload: expect.objectContaining({
          data: expect.objectContaining({
            scanId: "scan-1",
            attachmentId: "att-1",
            versionId: "ver-1",
            status: MALWARE_ATTACHMENT_SCAN_STATUS.CLEAN,
          }),
        }),
      }),
      expect.anything(),
    );
    expect(result).toEqual(mockUpdatedScan);
  });

  it("handles infected attachment scan and schedules outbox event", async () => {
    const mockScan: AttachmentScan = {
      id: "scan-2",
      attachmentId: "att-2",
      versionId: "ver-2",
      scopeType: "WORKSPACE",
      scopeId: "org-1",
      tenantId: "tenant-1",
      type: ATTACHMENT_SCAN_TYPE.MALWARE,
      status: MALWARE_ATTACHMENT_SCAN_STATUS.SCANNING,
      scanner: null,
      durationMs: null,
      result: null,
      metadata: null,
      storageProvider: null,
      storageObjectKey: null,
      scannedAt: null,
      createdAt: new Date(),
      updatedAt: null,
    };

    const mockUpdatedScan: AttachmentScan = {
      ...mockScan,
      status: MALWARE_ATTACHMENT_SCAN_STATUS.INFECTED,
      scanner: "clamav",
      durationMs: 80,
      result: {
        isInfected: true,
        threats: ["Eicar-Signature"],
        rawOutput: "stream: Eicar-Signature FOUND",
      },
    };

    const scanRepository: IAttachmentScanRepository = {
      save: vi.fn().mockResolvedValue(mockScan),
      findById: vi.fn().mockResolvedValue(mockScan),
      findByAttachmentAndVersion: vi.fn().mockResolvedValue(mockScan),
      updateResult: vi.fn().mockResolvedValue(mockUpdatedScan),
      updateStatus: vi.fn().mockResolvedValue(mockUpdatedScan),
    };

    const stream = Readable.from(["eicar-test-string"]);
    const attachmentClient: IAttachmentClient = {
      createUploadTarget: vi.fn(),
      downloadStream: vi.fn().mockResolvedValue(stream),
    };

    const malwareScannerService: IMalwareScannerService = {
      scan: vi.fn().mockResolvedValue({
        isInfected: true,
        viruses: ["Eicar-Signature"],
        rawResponse: "stream: Eicar-Signature FOUND",
      }),
      ping: vi.fn().mockResolvedValue(true),
      version: vi.fn().mockResolvedValue("ClamAV 1.4.0"),
    };

    const outboxService: IOutboxService = {
      schedule: vi.fn().mockResolvedValue({ id: "outbox-2" }),
      claimBatch: vi.fn(),
      complete: vi.fn(),
      failed: vi.fn(),
      get: vi.fn(),
      getByEventId: vi.fn(),
    };

    const db: ScannerDatabase = {
      transaction: vi.fn(async (cb) => {
        if (!mockTx) {
          throw new Error("mockTx not defined");
        }
        return cb(mockTx);
      }),
    };

    const service = new AttachmentScannerService(
      scanRepository,
      attachmentClient,
      malwareScannerService,
      outboxService,
      db,
    );

    const result = await service.scan({
      attachmentId: "att-2",
      versionId: "ver-2",
      scopeType: "WORKSPACE",
      scopeId: "org-1",
      tenantId: "tenant-1",
    });

    expect(scanRepository.updateResult).toHaveBeenCalledWith(
      "scan-2",
      expect.objectContaining({
        status: MALWARE_ATTACHMENT_SCAN_STATUS.INFECTED,
        scanner: "clamav",
        result: {
          isInfected: true,
          threats: ["Eicar-Signature"],
          rawOutput: "stream: Eicar-Signature FOUND",
        },
      }),
      expect.anything(),
    );
    expect(outboxService.schedule).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: AttachmentScannedEvent.type,
        eventVersion: AttachmentScannedEvent.version,
        aggregateType: "attachment_scan",
        aggregateId: "scan-2",
        payload: expect.objectContaining({
          data: expect.objectContaining({
            scanId: "scan-2",
            attachmentId: "att-2",
            status: MALWARE_ATTACHMENT_SCAN_STATUS.INFECTED,
          }),
        }),
      }),
      expect.anything(),
    );
    expect(result.status).toBe(MALWARE_ATTACHMENT_SCAN_STATUS.INFECTED);
  });

  it("updates scan status to FAILED and schedules outbox event when download or scanning fails", async () => {
    const mockScan: AttachmentScan = {
      id: "scan-3",
      attachmentId: "att-3",
      versionId: "ver-3",
      scopeType: "IDENTITY",
      scopeId: "user-1",
      tenantId: "tenant-1",
      type: ATTACHMENT_SCAN_TYPE.MALWARE,
      status: MALWARE_ATTACHMENT_SCAN_STATUS.SCANNING,
      scanner: null,
      durationMs: null,
      result: null,
      metadata: null,
      storageProvider: null,
      storageObjectKey: null,
      scannedAt: null,
      createdAt: new Date(),
      updatedAt: null,
    };

    const scanRepository: IAttachmentScanRepository = {
      save: vi.fn().mockResolvedValue(mockScan),
      findById: vi.fn().mockResolvedValue(mockScan),
      findByAttachmentAndVersion: vi.fn().mockResolvedValue(mockScan),
      updateResult: vi.fn().mockResolvedValue(null),
      updateStatus: vi.fn().mockResolvedValue(null),
    };

    const attachmentClient: IAttachmentClient = {
      createUploadTarget: vi.fn(),
      downloadStream: vi.fn().mockRejectedValue(new Error("Network failure")),
    };

    const malwareScannerService: IMalwareScannerService = {
      scan: vi.fn(),
      ping: vi.fn().mockResolvedValue(true),
      version: vi.fn().mockResolvedValue("ClamAV 1.4.0"),
    };

    const outboxService: IOutboxService = {
      schedule: vi.fn().mockResolvedValue({ id: "outbox-3" }),
      claimBatch: vi.fn(),
      complete: vi.fn(),
      failed: vi.fn(),
      get: vi.fn(),
      getByEventId: vi.fn(),
    };

    const db: ScannerDatabase = {
      transaction: vi.fn(async (cb) => {
        if (!mockTx) {
          throw new Error("mockTx not defined");
        }
        return cb(mockTx);
      }),
    };

    const service = new AttachmentScannerService(
      scanRepository,
      attachmentClient,
      malwareScannerService,
      outboxService,
      db,
    );

    await expect(
      service.scan({
        attachmentId: "att-3",
        versionId: "ver-3",
        scopeType: "IDENTITY",
        scopeId: "user-1",
        tenantId: "tenant-1",
      }),
    ).rejects.toThrow("Network failure");

    expect(scanRepository.updateResult).toHaveBeenCalledWith(
      "scan-3",
      expect.objectContaining({
        status: MALWARE_ATTACHMENT_SCAN_STATUS.FAILED,
      }),
      expect.anything(),
    );
    expect(outboxService.schedule).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: AttachmentScannedEvent.type,
        eventVersion: AttachmentScannedEvent.version,
        aggregateType: "attachment_scan",
        aggregateId: "scan-3",
        payload: expect.objectContaining({
          data: expect.objectContaining({
            scanId: "scan-3",
            attachmentId: "att-3",
            status: MALWARE_ATTACHMENT_SCAN_STATUS.FAILED,
          }),
        }),
      }),
      expect.anything(),
    );
  });
});
