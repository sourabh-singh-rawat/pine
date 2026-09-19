import { Readable } from "node:stream";
import { createHash } from "node:crypto";
import { NotFoundError } from "@pine/common";
import { AttachmentCreatedEvent } from "@pine/events";
import type { IOutboxService } from "@pine/outbox";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/bootstrap/env", () => ({
  env: {
    DATA_GATEWAY_URL: "http://127.0.0.1:4001",
  },
}));

import type { Attachment, AttachmentVersion, DbClient } from "@/db";
import {
  ATTACHMENT_SCOPE_TYPE,
  ATTACHMENT_SECURITY_STATUS,
  ATTACHMENT_STATUS,
} from "@/features/attachment/constants";
import type { IAttachmentRepository } from "@/features/attachment/repositories";
import {
  type AttachmentDatabase,
  AttachmentService,
} from "@/features/attachment/services/AttachmentService";
import type { IObjectStorage } from "@/integrations/storage";

const toDbClient = (_val: unknown): _val is DbClient => true;
const dummyTx: unknown = {};
const mockTx = toDbClient(dummyTx) ? dummyTx : undefined;

describe("AttachmentService", () => {
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
    findById: vi.fn(),
    findVersionById: vi.fn(),
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

  const outboxService: IOutboxService = {
    schedule: vi.fn().mockResolvedValue({ id: "outbox-1" }),
    claimBatch: vi.fn(),
    complete: vi.fn(),
    failed: vi.fn(),
    get: vi.fn(),
    getByEventId: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createFromUpload", () => {
    it("creates attachment and attachment version within a transaction", async () => {
      const savedAttachment: Attachment = {
        id: "att-123",
        scopeType: ATTACHMENT_SCOPE_TYPE.WORKSPACE,
        scopeId: "org-1",
        tenantId: "tenant-1",
        currentVersionId: "ver-123",
        operationId: null,
        metadata: null,
        status: ATTACHMENT_STATUS.QUARANTINED,
        securityStatus: ATTACHMENT_SECURITY_STATUS.PENDING,
        createdBy: "user-1",
        createdAt: new Date(),
        updatedAt: null,
      };

      const savedVersion: AttachmentVersion = {
        id: "ver-123",
        attachmentId: "att-123",
        versionNumber: 1,
        filename: "test.png",
        contentType: "image/png",
        fileSize: 10,
        sha256: "abc",
        storageProvider: "seaweed",
        storageObjectKey: "quarantine/workspace/org-1/att-123",
        createdBy: "user-1",
        createdAt: new Date(),
      };

      vi.mocked(attachmentRepository.save).mockResolvedValue(savedAttachment);
      vi.mocked(attachmentRepository.saveVersion).mockResolvedValue(savedVersion);

      const service = new AttachmentService(db, attachmentRepository, objectStorage, outboxService);
      const data = Buffer.from("image data");
      const expectedSha256 = createHash("sha256").update(data).digest("hex");

      const result = await service.createFromUpload({
        scopeType: ATTACHMENT_SCOPE_TYPE.WORKSPACE,
        scopeId: "org-1",
        tenantId: "tenant-1",
        filename: "test.png",
        contentType: "image/png",
        data,
        storageProvider: "seaweed",
        storageObjectKey: "quarantine/workspace/org-1/att-123",
        createdBy: "user-1",
      });

      expect(result).toBe(savedAttachment);
      expect(attachmentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          scopeType: ATTACHMENT_SCOPE_TYPE.WORKSPACE,
          scopeId: "org-1",
          tenantId: "tenant-1",
          status: ATTACHMENT_STATUS.QUARANTINED,
          securityStatus: ATTACHMENT_SECURITY_STATUS.PENDING,
          createdBy: "user-1",
        }),
        expect.anything(),
      );
      expect(attachmentRepository.saveVersion).toHaveBeenCalledWith(
        expect.objectContaining({
          versionNumber: 1,
          filename: "test.png",
          contentType: "image/png",
          fileSize: data.byteLength,
          sha256: expectedSha256,
          storageProvider: "seaweed",
          storageObjectKey: "quarantine/workspace/org-1/att-123",
          createdBy: "user-1",
        }),
        expect.anything(),
      );
    });
  });

  describe("delete", () => {
    it("throws NotFoundError when attachment does not exist", async () => {
      vi.mocked(attachmentRepository.findById).mockResolvedValue(null);

      const service = new AttachmentService(db, attachmentRepository, objectStorage, outboxService);

      await expect(service.delete({ id: "non-existent" })).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });

    it("deletes attachment when found", async () => {
      const existing: Attachment = {
        id: "att-1",
        scopeType: ATTACHMENT_SCOPE_TYPE.WORKSPACE,
        scopeId: "org-1",
        tenantId: "tenant-1",
        currentVersionId: "ver-1",
        operationId: null,
        metadata: null,
        status: ATTACHMENT_STATUS.AVAILABLE,
        securityStatus: ATTACHMENT_SECURITY_STATUS.CLEAN,
        createdBy: "user-1",
        createdAt: new Date(),
        updatedAt: null,
      };
      vi.mocked(attachmentRepository.findById).mockResolvedValue(existing);

      const service = new AttachmentService(db, attachmentRepository, objectStorage, outboxService);
      await service.delete({ id: "att-1" });

      expect(attachmentRepository.deleteById).toHaveBeenCalledWith("att-1", { tx: undefined });
    });
  });

  describe("getContent", () => {
    it("throws NotFoundError when attachment is not found", async () => {
      vi.mocked(attachmentRepository.findById).mockResolvedValue(null);

      const service = new AttachmentService(db, attachmentRepository, objectStorage, outboxService);

      await expect(
        service.getContent({ attachmentId: "att-1", versionId: "ver-1" }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("throws NotFoundError when version is not found", async () => {
      const existingAttachment: Attachment = {
        id: "att-1",
        scopeType: ATTACHMENT_SCOPE_TYPE.WORKSPACE,
        scopeId: "org-1",
        tenantId: "tenant-1",
        currentVersionId: "ver-1",
        operationId: null,
        metadata: null,
        status: ATTACHMENT_STATUS.AVAILABLE,
        securityStatus: ATTACHMENT_SECURITY_STATUS.CLEAN,
        createdBy: "user-1",
        createdAt: new Date(),
        updatedAt: null,
      };
      vi.mocked(attachmentRepository.findById).mockResolvedValue(existingAttachment);
      vi.mocked(attachmentRepository.findVersionById).mockResolvedValue(null);

      const service = new AttachmentService(db, attachmentRepository, objectStorage, outboxService);

      await expect(
        service.getContent({ attachmentId: "att-1", versionId: "ver-1" }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("returns stream and metadata for valid version", async () => {
      const existingAttachment: Attachment = {
        id: "att-1",
        scopeType: ATTACHMENT_SCOPE_TYPE.WORKSPACE,
        scopeId: "org-1",
        tenantId: "tenant-1",
        currentVersionId: "ver-1",
        operationId: null,
        metadata: null,
        status: ATTACHMENT_STATUS.AVAILABLE,
        securityStatus: ATTACHMENT_SECURITY_STATUS.CLEAN,
        createdBy: "user-1",
        createdAt: new Date(),
        updatedAt: null,
      };
      const existingVersion: AttachmentVersion = {
        id: "ver-1",
        attachmentId: "att-1",
        versionNumber: 1,
        filename: "document.pdf",
        contentType: "application/pdf",
        fileSize: 1024,
        sha256: "dummy-sha256",
        storageProvider: "seaweed",
        storageObjectKey: "trusted/workspace/org-1/att-1/ver-1",
        createdBy: "user-1",
        createdAt: new Date(),
      };
      const stream = Readable.from(["pdf content"]);

      vi.mocked(attachmentRepository.findById).mockResolvedValue(existingAttachment);
      vi.mocked(attachmentRepository.findVersionById).mockResolvedValue(existingVersion);
      vi.mocked(objectStorage.getObject).mockResolvedValue({
        body: stream,
        contentType: "application/pdf",
        contentLength: 1024,
      });

      const service = new AttachmentService(db, attachmentRepository, objectStorage, outboxService);
      const result = await service.getContent({ attachmentId: "att-1", versionId: "ver-1" });

      expect(result.stream).toBe(stream);
      expect(result.filename).toBe("document.pdf");
      expect(result.contentType).toBe("application/pdf");
      expect(result.fileSize).toBe(1024);
      expect(objectStorage.getObject).toHaveBeenCalledWith("trusted/workspace/org-1/att-1/ver-1");
    });
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
      expect(outboxService.schedule).toHaveBeenCalledWith(
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

    it("updates status to REJECTED and INFECTED when scan is infected without moving object or scheduling created event", async () => {
      const existing: Attachment = {
        id: "att-2",
        scopeType: ATTACHMENT_SCOPE_TYPE.WORKSPACE,
        scopeId: "org-1",
        tenantId: "tenant-1",
        currentVersionId: "ver-2",
        operationId: null,
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
      expect(outboxService.schedule).not.toHaveBeenCalled();
      expect(result).toBe(updated);
    });

    it("updates status to REJECTED and FAILED when scan fails without moving object or scheduling created event", async () => {
      const existing: Attachment = {
        id: "att-3",
        scopeType: ATTACHMENT_SCOPE_TYPE.WORKSPACE,
        scopeId: "org-1",
        tenantId: "tenant-1",
        currentVersionId: "ver-3",
        operationId: null,
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
      expect(outboxService.schedule).not.toHaveBeenCalled();
      expect(result).toBe(updated);
    });
  });
});
