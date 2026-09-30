import { uuidv7 } from "@pine/common";
import { AttachmentQuarantinedEvent, createCloudEvent } from "@pine/events";
import type { IOutboxService } from "@pine/outbox";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import { env } from "@/bootstrap/env";
import type { DbClient } from "@/db";
import { ATTACHMENT_STORAGE_ZONE, type IAttachmentService } from "@/features/attachment";
import { ATTACHMENT_UPLOAD_STATUS } from "@/features/attachment-upload/constants";
import {
  AttachmentUploadAlreadyProcessedError,
  AttachmentUploadExpiredError,
  AttachmentUploadNotFoundError,
} from "@/features/attachment-upload/errors";
import type { IAttachmentUploadRepository } from "@/features/attachment-upload/repositories";
import type {
  CreateAttachmentUploadInput,
  IAttachmentUploadService,
  UploadToTargetInput,
} from "@/features/attachment-upload/services/IAttachmentUploadService";
import type { IObjectStorage, UploadTarget } from "@/integrations/storage";

export type UploadDatabase = {
  transaction: <T>(callback: (tx: DbClient) => Promise<T>) => Promise<T>;
};

@injectable()
export class AttachmentUploadService implements IAttachmentUploadService {
  constructor(
    @inject(TYPES.Database)
    private readonly db: UploadDatabase,
    @inject(TYPES.AttachmentUploadRepository)
    private readonly attachmentUploads: IAttachmentUploadRepository,
    @inject(TYPES.ObjectStorage)
    private readonly objectStorage: IObjectStorage,
    @inject(TYPES.AttachmentService)
    private readonly attachmentService: IAttachmentService,
    @inject(TYPES.OutboxService)
    private readonly outboxService: IOutboxService,
  ) {}

  async createUploadTarget(input: CreateAttachmentUploadInput): Promise<UploadTarget> {
    const id = uuidv7();
    const objectKey = `${ATTACHMENT_STORAGE_ZONE.QUARANTINE}/${input.scopeType.toLowerCase()}/${input.scopeId}/${id}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.attachmentUploads.save({
      id,
      scopeType: input.scopeType,
      scopeId: input.scopeId,
      tenantId: input.tenantId ?? null,
      operationId: input.operationId,
      metadata: input.metadata,
      status: ATTACHMENT_UPLOAD_STATUS.PENDING,
      filename: input.filename,
      contentType: input.contentType,
      expectedSize: input.size,
      storageProvider: "seaweed",
      storageObjectKey: objectKey,
      expiresAt,
      createdBy: input.createdBy,
    });

    const url = new URL(`/attachments/upload/${id}`, env.DATA_GATEWAY_URL).toString();

    return {
      objectId: objectKey,
      url,
      headers: {
        "Content-Type": input.contentType,
      },
      expiresAt,
    };
  }

  async uploadToTarget(input: UploadToTargetInput): Promise<void> {
    const record = await this.attachmentUploads.findById(input.uploadId);
    if (!record) {
      throw new AttachmentUploadNotFoundError();
    }

    if (record.status !== ATTACHMENT_UPLOAD_STATUS.PENDING) {
      throw new AttachmentUploadAlreadyProcessedError(record.status);
    }

    if (record.expiresAt < new Date()) {
      await this.attachmentUploads.markFailed(record.id);
      throw new AttachmentUploadExpiredError();
    }

    try {
      const contentType = input.contentType ?? record.contentType;

      await this.objectStorage.putObject({
        storageObjectKey: record.storageObjectKey,
        contentType,
        body: input.data,
        contentLength: input.data.byteLength,
      });

      await this.db.transaction(async (tx) => {
        const attachment = await this.attachmentService.createFromUpload({
          scopeType: record.scopeType,
          scopeId: record.scopeId,
          tenantId: record.tenantId ?? undefined,
          filename: record.filename,
          contentType,
          data: input.data,
          storageProvider: record.storageProvider,
          storageObjectKey: record.storageObjectKey,
          operationId: record.operationId ?? undefined,
          metadata: record.metadata ?? undefined,
          createdBy: record.createdBy,
          tx,
        });

        await this.attachmentUploads.markCompleted(record.id, { tx });

        const event = createCloudEvent({
          type: AttachmentQuarantinedEvent.type,
          version: AttachmentQuarantinedEvent.version,
          schema: AttachmentQuarantinedEvent.schema,
          source: "pine/attachment-service",
          subject: attachment.id,
          data: {
            id: attachment.id,
            scopeType: attachment.scopeType,
            scopeId: attachment.scopeId,
            tenantId: attachment.tenantId ?? undefined,
            currentVersionId: attachment.currentVersionId ?? undefined,
            ...(attachment.operationId ? { operationId: attachment.operationId } : {}),
            ...(attachment.metadata ? { metadata: attachment.metadata } : {}),
            status: attachment.status,
            securityStatus: attachment.securityStatus,
            createdBy: attachment.createdBy,
            createdAt: attachment.createdAt.toISOString(),
          },
        });

        await this.outboxService.schedule(
          {
            eventId: event.id,
            eventType: event.type,
            eventVersion: AttachmentQuarantinedEvent.version,
            aggregateType: "attachment",
            aggregateId: attachment.id,
            payload: event,
          },
          { tx },
        );
      });
    } catch (error) {
      await this.attachmentUploads.markFailed(record.id);
      throw error;
    }
  }
}
