import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/bootstrap/env", () => ({
  env: {
    DATA_GATEWAY_URL: "http://127.0.0.1:4001",
  },
}));

import type { Attachment, AttachmentUpload, DbClient } from "@/db";
import { AttachmentQuarantinedEvent } from "@pine/events";
import type { IOutboxService } from "@pine/outbox";
import {
  ATTACHMENT_SCOPE_TYPE,
  ATTACHMENT_SECURITY_STATUS,
  ATTACHMENT_STATUS,
  ATTACHMENT_STORAGE_ZONE,
  type IAttachmentService,
} from "@/features/attachment";
import { ATTACHMENT_UPLOAD_STATUS } from "@/features/attachment-upload/constants";
import {
  AttachmentUploadAlreadyProcessedError,
  AttachmentUploadExpiredError,
  AttachmentUploadNotFoundError,
} from "@/features/attachment-upload/errors";
import type { IAttachmentUploadRepository } from "@/features/attachment-upload/repositories";
import {
  AttachmentUploadService,
  type UploadDatabase,
} from "@/features/attachment-upload/services/AttachmentUploadService";
import type { IObjectStorage } from "@/integrations/storage";

const toDbClient = (_val: unknown): _val is DbClient => true;
const dummyTx: unknown = {};
const mockTx = toDbClient(dummyTx) ? dummyTx : undefined;

describe("AttachmentUploadService", () => {
  const db: UploadDatabase = {
    transaction: vi.fn(async (callback) => {
      if (!mockTx) {
        throw new Error("mockTx not defined");
      }
      return callback(mockTx);
    }),
  };

  const attachmentUploads: IAttachmentUploadRepository = {
    save: vi.fn(),
    findById: vi.fn(),
    markCompleted: vi.fn(),
    markFailed: vi.fn(),
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

  const attachmentService: IAttachmentService = {
    createFromUpload: vi.fn(),
    delete: vi.fn(),
    getContent: vi.fn(),
    updateSecurityStatus: vi.fn(),
  };

  const schedule = vi.fn();

  const outboxService: IOutboxService = {
    schedule,
    claimBatch: vi.fn(),
    complete: vi.fn(),
    failed: vi.fn(),
    get: vi.fn(),
    getByEventId: vi.fn(),
  };

  const createService = () =>
    new AttachmentUploadService(
      db,
      attachmentUploads,
      objectStorage,
      attachmentService,
      outboxService,
    );

  const makeRecord = (overrides?: Partial<AttachmentUpload>): AttachmentUpload => ({
    id: "upload-1",
    scopeType: ATTACHMENT_SCOPE_TYPE.WORKSPACE,
    scopeId: "org-1",
    tenantId: "tenant-1",
    operationId: null,
    metadata: null,
    status: ATTACHMENT_UPLOAD_STATUS.PENDING,
    filename: "photo.png",
    contentType: "image/png",
    expectedSize: 1024,
    storageProvider: "seaweed",
    storageObjectKey: "quarantine/workspace/org-1/upload-1",
    expiresAt: new Date(Date.now() + 60_000),
    createdBy: "user-1",
    createdAt: new Date(),
    completedAt: null,
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createUploadTarget", () => {
    it("creates target URL and saves pending upload record", async () => {
      const service = createService();
      const target = await service.createUploadTarget({
        scopeType: ATTACHMENT_SCOPE_TYPE.WORKSPACE,
        scopeId: "01a015a6-2e8f-74da-92ce-174d8adb00d4",
        tenantId: "tenant-1",
        filename: "avatar.png",
        contentType: "image/png",
        size: 1024,
        createdBy: "user-1",
      });

      expect(target.url).toMatch(/^http:\/\/127\.0\.0\.1:4001\/attachments\/upload\/[0-9a-f-]+$/);
      expect(target.objectId).toMatch(
        new RegExp(`^${ATTACHMENT_STORAGE_ZONE.QUARANTINE}/workspace/01a015a6-2e8f-74da-92ce-174d8adb00d4/[0-9a-f-]+$`),
      );
      expect(target.headers).toEqual({ "Content-Type": "image/png" });
      expect(attachmentUploads.save).toHaveBeenCalledWith(
        expect.objectContaining({
          storageObjectKey: expect.stringMatching(
            new RegExp(`^${ATTACHMENT_STORAGE_ZONE.QUARANTINE}/workspace/01a015a6-2e8f-74da-92ce-174d8adb00d4/[0-9a-f-]+$`),
          ),
        }),
      );
    });
  });

  describe("uploadToTarget", () => {
    it("puts object to storage, creates attachment, marks upload completed, and schedules outbox event in transaction", async () => {
      const record = makeRecord();
      vi.mocked(attachmentUploads.findById).mockResolvedValue(record);

      const createdAttachment: Attachment = {
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
      vi.mocked(attachmentService.createFromUpload).mockResolvedValue(createdAttachment);

      const service = createService();
      const data = Buffer.from("test payload");
      await service.uploadToTarget({ uploadId: "upload-1", data, contentType: "image/png" });

      expect(objectStorage.putObject).toHaveBeenCalledWith({
        storageObjectKey: "quarantine/workspace/org-1/upload-1",
        contentType: "image/png",
        body: data,
        contentLength: data.byteLength,
      });
      expect(db.transaction).toHaveBeenCalled();
      expect(attachmentService.createFromUpload).toHaveBeenCalledWith({
        scopeType: ATTACHMENT_SCOPE_TYPE.WORKSPACE,
        scopeId: "org-1",
        tenantId: "tenant-1",
        filename: "photo.png",
        contentType: "image/png",
        data,
        storageProvider: "seaweed",
        storageObjectKey: "quarantine/workspace/org-1/upload-1",
        createdBy: "user-1",
        tx: mockTx,
      });
      expect(attachmentUploads.markCompleted).toHaveBeenCalledWith("upload-1", { tx: mockTx });

      expect(schedule).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AttachmentQuarantinedEvent.type,
          eventVersion: AttachmentQuarantinedEvent.version,
          aggregateType: "attachment",
          aggregateId: "att-1",
          payload: expect.objectContaining({
            type: AttachmentQuarantinedEvent.type,
            source: "pine/attachment-service",
            subject: "att-1",
            data: {
              id: "att-1",
              scopeType: ATTACHMENT_SCOPE_TYPE.WORKSPACE,
              scopeId: "org-1",
              tenantId: "tenant-1",
              currentVersionId: "ver-1",
              status: ATTACHMENT_STATUS.QUARANTINED,
              securityStatus: ATTACHMENT_SECURITY_STATUS.PENDING,
              createdBy: "user-1",
              createdAt: createdAttachment.createdAt.toISOString(),
            },
          }),
        }),
        { tx: mockTx },
      );
    });

    it("throws AttachmentUploadNotFoundError when record is not found", async () => {
      vi.mocked(attachmentUploads.findById).mockResolvedValue(null);

      const service = createService();
      const data = Buffer.from("test payload");

      await expect(
        service.uploadToTarget({ uploadId: "missing-upload", data, contentType: "image/png" }),
      ).rejects.toBeInstanceOf(AttachmentUploadNotFoundError);
    });

    it("throws AttachmentUploadAlreadyProcessedError when status is not PENDING", async () => {
      const record = makeRecord({ status: ATTACHMENT_UPLOAD_STATUS.COMPLETED });
      vi.mocked(attachmentUploads.findById).mockResolvedValue(record);

      const service = createService();
      const data = Buffer.from("test payload");

      await expect(
        service.uploadToTarget({ uploadId: "upload-1", data, contentType: "image/png" }),
      ).rejects.toBeInstanceOf(AttachmentUploadAlreadyProcessedError);
    });

    it("marks upload as failed and throws AttachmentUploadExpiredError when expired", async () => {
      const record = makeRecord({ expiresAt: new Date(Date.now() - 60_000) });
      vi.mocked(attachmentUploads.findById).mockResolvedValue(record);

      const service = createService();
      const data = Buffer.from("test payload");

      await expect(
        service.uploadToTarget({ uploadId: "upload-1", data, contentType: "image/png" }),
      ).rejects.toBeInstanceOf(AttachmentUploadExpiredError);

      expect(attachmentUploads.markFailed).toHaveBeenCalledWith("upload-1");
    });

    it("marks upload as failed if storage or attachment creation throws", async () => {
      const record = makeRecord();
      vi.mocked(attachmentUploads.findById).mockResolvedValue(record);
      vi.mocked(attachmentService.createFromUpload).mockRejectedValue(
        new Error("Database insert failure"),
      );

      const service = createService();
      const data = Buffer.from("test payload");

      await expect(
        service.uploadToTarget({ uploadId: "upload-1", data, contentType: "image/png" }),
      ).rejects.toThrow("Database insert failure");

      expect(attachmentUploads.markFailed).toHaveBeenCalledWith("upload-1");
    });
  });
});
