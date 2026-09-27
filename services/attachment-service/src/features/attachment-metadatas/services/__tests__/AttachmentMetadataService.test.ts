import { NotFoundError } from "@pine/common";
import type { IOutboxService } from "@pine/outbox";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Attachment, AttachmentMetadata, AttachmentVersion, DbClient } from "@/db";
import {
  ATTACHMENT_SCOPE_TYPE,
  ATTACHMENT_SECURITY_STATUS,
  ATTACHMENT_STATUS,
} from "@/features/attachment/constants";
import type { IAttachmentRepository } from "@/features/attachment/repositories";
import type { IAttachmentMetadataRepository } from "@/features/attachment-metadatas/repositories";
import {
  type AttachmentMetadataDatabase,
  AttachmentMetadataService,
} from "@/features/attachment-metadatas/services/AttachmentMetadataService";

const toDbClient = (_val: unknown): _val is DbClient => true;
const dummyTx: unknown = {};
const mockTx = toDbClient(dummyTx) ? dummyTx : undefined;

describe("AttachmentMetadataService", () => {
  const db: AttachmentMetadataDatabase = {
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

  const attachmentMetadataRepository: IAttachmentMetadataRepository = {
    save: vi.fn(),
    findByVersionId: vi.fn(),
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

  describe("store", () => {
    it("saves metadata record and schedules AttachmentImageMetadataExtractedEvent via outbox", async () => {
      const savedMetadata: AttachmentMetadata = {
        id: "meta-1",
        attachmentId: "att-10",
        versionId: "ver-10",
        width: 800,
        height: 600,
        format: "png",
        space: "srgb",
        channels: 4,
        density: 72,
        hasAlpha: true,
        orientation: 1,
        extractedAt: new Date("2026-09-27T10:00:00.000Z"),
        createdAt: new Date("2026-09-27T10:00:00.000Z"),
      };

      vi.mocked(attachmentRepository.findById).mockResolvedValue(existingAttachment);
      vi.mocked(attachmentRepository.findVersionById).mockResolvedValue(existingVersion);
      vi.mocked(attachmentMetadataRepository.save).mockResolvedValue(savedMetadata);

      const service = new AttachmentMetadataService(
        db,
        attachmentRepository,
        attachmentMetadataRepository,
        outboxService,
      );

      const result = await service.store({
        attachmentId: "att-10",
        versionId: "ver-10",
        width: 800,
        height: 600,
        format: "png",
        space: "srgb",
        channels: 4,
        density: 72,
        hasAlpha: true,
        orientation: 1,
        extractedAt: "2026-09-27T10:00:00.000Z",
      });

      expect(attachmentMetadataRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          attachmentId: "att-10",
          versionId: "ver-10",
          width: 800,
          height: 600,
          format: "png",
        }),
        expect.anything(),
      );

      expect(outboxSchedule).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "attachment.image.metadata-extracted",
          aggregateType: "attachment_metadata",
          aggregateId: "meta-1",
          payload: expect.objectContaining({
            type: "attachment.image.metadata-extracted",
            subject: "att-10",
            data: expect.objectContaining({
              attachmentId: "att-10",
              versionId: "ver-10",
              width: 800,
              height: 600,
              format: "png",
            }),
          }),
        }),
        expect.anything(),
      );

      expect(result).toBe(savedMetadata);
    });

    it("throws NotFoundError when attachment does not exist", async () => {
      vi.mocked(attachmentRepository.findById).mockResolvedValue(null);

      const service = new AttachmentMetadataService(
        db,
        attachmentRepository,
        attachmentMetadataRepository,
        outboxService,
      );

      await expect(
        service.store({
          attachmentId: "missing-att",
          versionId: "ver-10",
          extractedAt: "2026-09-27T10:00:00.000Z",
        }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe("getByVersionId", () => {
    it("returns metadata when found", async () => {
      const savedMetadata: AttachmentMetadata = {
        id: "meta-1",
        attachmentId: "att-10",
        versionId: "ver-10",
        width: 800,
        height: 600,
        format: "png",
        space: "srgb",
        channels: 4,
        density: 72,
        hasAlpha: true,
        orientation: 1,
        extractedAt: new Date("2026-09-27T10:00:00.000Z"),
        createdAt: new Date("2026-09-27T10:00:00.000Z"),
      };

      vi.mocked(attachmentRepository.findById).mockResolvedValue(existingAttachment);
      vi.mocked(attachmentRepository.findVersionById).mockResolvedValue(existingVersion);
      vi.mocked(attachmentMetadataRepository.findByVersionId).mockResolvedValue(savedMetadata);

      const service = new AttachmentMetadataService(
        db,
        attachmentRepository,
        attachmentMetadataRepository,
        outboxService,
      );

      const result = await service.getByVersionId({
        attachmentId: "att-10",
        versionId: "ver-10",
      });

      expect(result).toBe(savedMetadata);
    });

    it("throws NotFoundError when metadata is not found", async () => {
      vi.mocked(attachmentRepository.findById).mockResolvedValue(existingAttachment);
      vi.mocked(attachmentRepository.findVersionById).mockResolvedValue(existingVersion);
      vi.mocked(attachmentMetadataRepository.findByVersionId).mockResolvedValue(null);

      const service = new AttachmentMetadataService(
        db,
        attachmentRepository,
        attachmentMetadataRepository,
        outboxService,
      );

      await expect(
        service.getByVersionId({
          attachmentId: "att-10",
          versionId: "ver-10",
        }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});
