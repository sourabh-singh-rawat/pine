import { ATTACHMENT_SECURITY_STATUS, ATTACHMENT_STATUS } from "@/features/attachment/constants";
import type { IAttachmentRepository } from "@/features/attachment/repositories";
import {
  type AttachmentDatabase,
  AttachmentService,
} from "@/features/attachment/services/AttachmentService";
import type { IObjectStorage } from "@/integrations/storage";
import { AttachmentCreatedEvent } from "@pine/events";
import type { IOutboxService } from "@pine/outbox";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/bootstrap/env", () => ({
  env: {
    DATA_GATEWAY_URL: "http://127.0.0.1:4001",
  },
}));

import type { Attachment, AttachmentVersion, DbClient } from "@/db";
import { ATTACHMENT_SCOPE_TYPE } from "@/features/attachment/constants";

const toDbClient = (_val: unknown): _val is DbClient => true;
const dummyTx: unknown = {};
const mockTx = toDbClient(dummyTx) ? dummyTx : undefined;

describe("AttachmentService.securityStatus", () => {
  const db: AttachmentDatabase = {
    transaction: vi.fn(async (callback) => {
      if (!mockTx) {
        throw new Error("mockTx not defined");
      }
      return callback(mockTx);
    }),
  };

  const attachmentRepository: IAttachmentRepository = {
    save: vi.fn(),
    saveVersion: vi.fn(),
    saveDerivative: vi.fn(),
    findById: vi.fn(),
    findVersionById: vi.fn(),
    findDerivative: vi.fn(),
    updateStatus: vi.fn(),
    updateVersionStorageKey: vi.fn(),
    deleteById: vi.fn(),
  };

  const objectStorage: IObjectStorage = {
    createUploadTarget: vi.fn(),
    putObject: vi.fn(),
    createDownloadUrl: vi.fn(),
    deleteObject: vi.fn(),
    copyObject: vi.fn(),
    moveObject: vi.fn(),
    getObjectMetadata: vi.fn(),
    getObject: vi.fn(),
  };

  const scheduleOutbox = vi.fn().mockResolvedValue({ id: "outbox-1" });
  const outboxService: IOutboxService = {
    schedule: scheduleOutbox,
    claimBatch: vi.fn(),
    complete: vi.fn(),
    failed: vi.fn(),
    get: vi.fn(),
    getByEventId: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("updateSecurityStatus", () => {
    it("moves object from quarantine to trusted, updates status to AVAILABLE and CLEAN, and schedules outbox event", async () => {
      const existing: Attachment = {
        id: "att-1",
        scopeType: ATTACHMENT_SCOPE_TYPE.WORKSPACE,
        scopeId: "org-1",
        tenantId: "tenant-1",
        currentVersionId: "ver-1",
        operationId: null,
        metadata: null,
        status: ATTACHMENT_STATUS.QUARANTINED,
        securityStatus: ATTACHMENT_SECURITY_STATUS.PENDING,
        createdBy: "user-1",
        createdAt: new Date(),
        updatedAt: null,
      };

      const existingVersion: AttachmentVersion = {
        id: "ver-1",
        attachmentId: "att-1",
        versionNumber: 1,
        filename: "test.png",
        contentType: "image/png",
        fileSize: 10,
        sha256: "abc",
        storageProvider: "seaweed",
        storageObjectKey: "quarantine/workspace/org-1/att-1",
        createdBy: "user-1",
        createdAt: new Date(),
      };

      const updated: Attachment = {
        ...existing,
        status: ATTACHMENT_STATUS.AVAILABLE,
        securityStatus: ATTACHMENT_SECURITY_STATUS.CLEAN,
        updatedAt: new Date(),
      };

      vi.mocked(attachmentRepository.findById).mockResolvedValue(existing);
      vi.mocked(attachmentRepository.findVersionById).mockResolvedValue(existingVersion);
      vi.mocked(attachmentRepository.updateStatus).mockResolvedValue(updated);

      const service = new AttachmentService(db, attachmentRepository, objectStorage, outboxService);
      const result = await service.updateSecurityStatus({ id: "att-1", status: "CLEAN" });

      expect(objectStorage.moveObject).toHaveBeenCalledWith(
        "quarantine/workspace/org-1/att-1",
        "trusted/workspace/org-1/att-1",
      );
      expect(attachmentRepository.updateVersionStorageKey).toHaveBeenCalledWith(
        "ver-1",
        "trusted/workspace/org-1/att-1",
        { tx: mockTx },
      );
      expect(attachmentRepository.updateStatus).toHaveBeenCalledWith(
        "att-1",
        {
          securityStatus: ATTACHMENT_SECURITY_STATUS.CLEAN,
          status: ATTACHMENT_STATUS.AVAILABLE,
        },
        { tx: mockTx },
      );
      expect(scheduleOutbox).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AttachmentCreatedEvent.type,
          eventVersion: AttachmentCreatedEvent.version,
          aggregateType: "attachment",
          aggregateId: "att-1",
          payload: expect.objectContaining({
            data: expect.objectContaining({
              id: "att-1",
              url: "http://127.0.0.1:4001/attachments/att-1",
              status: ATTACHMENT_STATUS.AVAILABLE,
              securityStatus: ATTACHMENT_SECURITY_STATUS.CLEAN,
            }),
          }),
        }),
        { tx: mockTx },
      );
      expect(result).toBe(updated);
    });

    it("updates status to REJECTED and INFECTED when scan is infected and schedules created event", async () => {
      const existing: Attachment = {
        id: "att-2",
        scopeType: ATTACHMENT_SCOPE_TYPE.WORKSPACE,
        scopeId: "org-1",
        tenantId: "tenant-1",
        currentVersionId: "ver-2",
        operationId: "upload-req-2",
        metadata: { uploadRequestId: "upload-req-2" },
        status: ATTACHMENT_STATUS.QUARANTINED,
        securityStatus: ATTACHMENT_SECURITY_STATUS.PENDING,
        createdBy: "user-1",
        createdAt: new Date(),
        updatedAt: null,
      };

      const updated: Attachment = {
        ...existing,
        status: ATTACHMENT_STATUS.REJECTED,
        securityStatus: ATTACHMENT_SECURITY_STATUS.INFECTED,
        updatedAt: new Date(),
      };

      vi.mocked(attachmentRepository.findById).mockResolvedValue(existing);
      vi.mocked(attachmentRepository.updateStatus).mockResolvedValue(updated);

      const service = new AttachmentService(db, attachmentRepository, objectStorage, outboxService);
      const result = await service.updateSecurityStatus({ id: "att-2", status: "INFECTED" });

      expect(objectStorage.moveObject).not.toHaveBeenCalled();
      expect(attachmentRepository.updateVersionStorageKey).not.toHaveBeenCalled();
      expect(attachmentRepository.updateStatus).toHaveBeenCalledWith(
        "att-2",
        {
          securityStatus: ATTACHMENT_SECURITY_STATUS.INFECTED,
          status: ATTACHMENT_STATUS.REJECTED,
        },
        { tx: mockTx },
      );
      expect(scheduleOutbox).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AttachmentCreatedEvent.type,
          eventVersion: AttachmentCreatedEvent.version,
          aggregateType: "attachment",
          aggregateId: "att-2",
          payload: expect.objectContaining({
            type: AttachmentCreatedEvent.type,
            data: expect.objectContaining({
              id: "att-2",
              status: ATTACHMENT_STATUS.REJECTED,
              securityStatus: ATTACHMENT_SECURITY_STATUS.INFECTED,
              operationId: "upload-req-2",
            }),
          }),
        }),
        { tx: mockTx },
      );
      expect(result).toBe(updated);
    });

    it("updates status to REJECTED and FAILED when scan fails and schedules created event", async () => {
      const existing: Attachment = {
        id: "att-3",
        scopeType: ATTACHMENT_SCOPE_TYPE.WORKSPACE,
        scopeId: "org-1",
        tenantId: "tenant-1",
        currentVersionId: "ver-3",
        operationId: "upload-req-3",
        metadata: null,
        status: ATTACHMENT_STATUS.QUARANTINED,
        securityStatus: ATTACHMENT_SECURITY_STATUS.PENDING,
        createdBy: "user-1",
        createdAt: new Date(),
        updatedAt: null,
      };

      const updated: Attachment = {
        ...existing,
        status: ATTACHMENT_STATUS.REJECTED,
        securityStatus: ATTACHMENT_SECURITY_STATUS.FAILED,
        updatedAt: new Date(),
      };

      vi.mocked(attachmentRepository.findById).mockResolvedValue(existing);
      vi.mocked(attachmentRepository.updateStatus).mockResolvedValue(updated);

      const service = new AttachmentService(db, attachmentRepository, objectStorage, outboxService);
      const result = await service.updateSecurityStatus({ id: "att-3", status: "FAILED" });

      expect(objectStorage.moveObject).not.toHaveBeenCalled();
      expect(attachmentRepository.updateVersionStorageKey).not.toHaveBeenCalled();
      expect(attachmentRepository.updateStatus).toHaveBeenCalledWith(
        "att-3",
        {
          securityStatus: ATTACHMENT_SECURITY_STATUS.FAILED,
          status: ATTACHMENT_STATUS.REJECTED,
        },
        { tx: mockTx },
      );
      expect(scheduleOutbox).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AttachmentCreatedEvent.type,
          aggregateId: "att-3",
          payload: expect.objectContaining({
            data: expect.objectContaining({
              id: "att-3",
              status: ATTACHMENT_STATUS.REJECTED,
              securityStatus: ATTACHMENT_SECURITY_STATUS.FAILED,
              operationId: "upload-req-3",
            }),
          }),
        }),
        { tx: mockTx },
      );
      expect(result).toBe(updated);
    });
  });
});
