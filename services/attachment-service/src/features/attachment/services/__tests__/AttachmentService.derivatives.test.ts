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

describe("AttachmentService.derivatives", () => {
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

  const outboxSchedule = vi.fn().mockResolvedValue({ id: "outbox-1" });
  const outboxService: IOutboxService = {
    schedule: outboxSchedule,
    claimBatch: vi.fn(),
    complete: vi.fn(),
    failed: vi.fn(),
    get: vi.fn(),
    getByEventId: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("storeDerivative", () => {
    it("stores derivative bytes in object storage, saves derivative record, and schedules AttachmentDerivativeCreatedEvent", async () => {
      const existingAttachment: Attachment = {
        id: "att-10",
        scopeType: ATTACHMENT_SCOPE_TYPE.WORKSPACE,
        scopeId: "org-1",
        tenantId: "tenant-1",
        currentVersionId: "ver-10",
        operationId: null,
        metadata: null,
        status: ATTACHMENT_STATUS.AVAILABLE,
        securityStatus: ATTACHMENT_SECURITY_STATUS.CLEAN,
        createdBy: "user-1",
        createdAt: new Date(),
        updatedAt: null,
      };

      const existingVersion: AttachmentVersion = {
        id: "ver-10",
        attachmentId: "att-10",
        versionNumber: 1,
        filename: "test.png",
        contentType: "image/png",
        fileSize: 100,
        sha256: "abc",
        storageProvider: "seaweed",
        storageObjectKey: "trusted/workspace/org-1/att-10",
        createdBy: "user-1",
        createdAt: new Date(),
      };

      const savedDerivative = {
        id: "der-1",
        attachmentId: "att-10",
        versionId: "ver-10",
        derivativeType: "thumbnail",
        mimeType: "image/png",
        fileSize: 50,
        width: 250,
        height: 250,
        storageProvider: "seaweed",
        storageObjectKey: "trusted/workspace/org-1/att-10/derivatives/thumbnail",
        createdAt: new Date(),
      };

      vi.mocked(attachmentRepository.findById).mockResolvedValue(existingAttachment);
      vi.mocked(attachmentRepository.findVersionById).mockResolvedValue(existingVersion);
      vi.mocked(attachmentRepository.saveDerivative).mockResolvedValue(savedDerivative);

      const service = new AttachmentService(db, attachmentRepository, objectStorage, outboxService);
      const data = Buffer.from("thumbnail bytes");

      const result = await service.storeDerivative({
        attachmentId: "att-10",
        versionId: "ver-10",
        derivativeType: "thumbnail",
        data,
        contentType: "image/png",
        width: 250,
        height: 250,
      });

      expect(objectStorage.putObject).toHaveBeenCalledWith({
        storageObjectKey: "trusted/workspace/org-1/att-10/derivatives/thumbnail",
        contentType: "image/png",
        body: data,
        contentLength: data.byteLength,
      });

      expect(attachmentRepository.saveDerivative).toHaveBeenCalledWith(
        expect.objectContaining({
          attachmentId: "att-10",
          versionId: "ver-10",
          derivativeType: "thumbnail",
          mimeType: "image/png",
          fileSize: data.byteLength,
          width: 250,
          height: 250,
        }),
        expect.anything(),
      );

      expect(outboxSchedule).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "attachment.derivative.created",
          aggregateType: "attachment_derivative",
          aggregateId: "der-1",
        }),
        expect.anything(),
      );

      expect(result).toBe(savedDerivative);
    });
  });
});
