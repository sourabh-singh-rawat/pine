import { createHash } from "node:crypto";
import { NotFoundError, uuidv7 } from "@pine/common";
import {
  type AttachmentCreatedData,
  AttachmentCreatedEvent,
  type AttachmentDerivativeCreatedData,
  AttachmentDerivativeCreatedEvent,
  type CloudEvent,
  createCloudEvent,
} from "@pine/events";
import type { IOutboxService } from "@pine/outbox";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import { env } from "@/bootstrap/env";
import type { Attachment, AttachmentDerivative, DbClient } from "@/db";
import {
  ATTACHMENT_SECURITY_STATUS,
  type AttachmentSecurityStatus,
  ATTACHMENT_STATUS,
  type AttachmentStatus,
  ATTACHMENT_STORAGE_ZONE,
} from "@/features/attachment/constants";
import type { IAttachmentRepository } from "@/features/attachment/repositories";
import type {
  AttachmentVersionContent,
  CreateAttachmentFromUploadInput,
  DeleteAttachmentOptions,
  GetAttachmentVersionContentInput,
  IAttachmentService,
  StoreDerivativeInput,
  UpdateSecurityStatusInput,
} from "@/features/attachment/services/IAttachmentService";
import type { IObjectStorage } from "@/integrations/storage";

export type AttachmentDatabase = {
  transaction: <T>(callback: (tx: DbClient) => Promise<T>) => Promise<T>;
};

@injectable()
export class AttachmentService implements IAttachmentService {
  constructor(
    @inject(TYPES.Database) private readonly db: AttachmentDatabase,
    @inject(TYPES.AttachmentRepository)
    private readonly attachmentRepository: IAttachmentRepository,
    @inject(TYPES.ObjectStorage) private readonly objectStorage: IObjectStorage,
    @inject(TYPES.OutboxService) private readonly outboxService: IOutboxService,
  ) {}

  async createFromUpload(input: CreateAttachmentFromUploadInput): Promise<Attachment> {
    const id = uuidv7();
    const versionId = uuidv7();
    const sha256 = createHash("sha256").update(input.data).digest("hex");

    const execute = async (tx: DbClient): Promise<Attachment> => {
      const attachment = await this.attachmentRepository.save(
        {
          id,
          scopeType: input.scopeType,
          scopeId: input.scopeId,
          tenantId: input.tenantId ?? null,
          currentVersionId: versionId,
          operationId: input.operationId,
          metadata: input.metadata,
          status: ATTACHMENT_STATUS.QUARANTINED,
          securityStatus: ATTACHMENT_SECURITY_STATUS.PENDING,
          createdBy: input.createdBy,
        },
        { tx },
      );

      await this.attachmentRepository.saveVersion(
        {
          id: versionId,
          attachmentId: id,
          versionNumber: 1,
          filename: input.filename,
          contentType: input.contentType,
          fileSize: input.data.byteLength,
          sha256,
          storageProvider: input.storageProvider,
          storageObjectKey: input.storageObjectKey,
          createdBy: input.createdBy,
        },
        { tx },
      );

      return attachment;
    };

    return input.tx ? execute(input.tx) : this.db.transaction(execute);
  }

  async delete(options: DeleteAttachmentOptions): Promise<void> {
    const { id, tx } = options;
    const attachment = await this.attachmentRepository.findById(id, { tx });
    if (!attachment) throw new NotFoundError("Attachment");
    await this.attachmentRepository.deleteById(id, { tx });
  }

  async getContent(input: GetAttachmentVersionContentInput): Promise<AttachmentVersionContent> {
    const { attachmentId, versionId } = input;
    const attachment = await this.attachmentRepository.findById(attachmentId);
    if (!attachment) throw new NotFoundError("Attachment");

    const version = await this.attachmentRepository.findVersionById(attachmentId, versionId);
    if (!version) throw new NotFoundError("AttachmentVersion");

    const object = await this.objectStorage.getObject(version.storageObjectKey);

    return {
      stream: object.body,
      filename: version.filename,
      contentType: version.contentType,
      fileSize: version.fileSize,
    };
  }

  async updateSecurityStatus(input: UpdateSecurityStatusInput): Promise<Attachment | null> {
    let securityStatus: AttachmentSecurityStatus;
    let status: AttachmentStatus;

    if (input.status === "CLEAN") {
      securityStatus = ATTACHMENT_SECURITY_STATUS.CLEAN;
      status = ATTACHMENT_STATUS.AVAILABLE;
    } else if (input.status === "INFECTED") {
      securityStatus = ATTACHMENT_SECURITY_STATUS.INFECTED;
      status = ATTACHMENT_STATUS.REJECTED;
    } else {
      securityStatus = ATTACHMENT_SECURITY_STATUS.FAILED;
      status = ATTACHMENT_STATUS.REJECTED;
    }

    const execute = async (tx: DbClient): Promise<Attachment | null> => {
      const existing = await this.attachmentRepository.findById(input.id, { tx });
      if (!existing) return null;

      if (securityStatus === ATTACHMENT_SECURITY_STATUS.CLEAN && existing.currentVersionId) {
        const version = await this.attachmentRepository.findVersionById(
          existing.id,
          existing.currentVersionId,
          { tx },
        );

        if (version && version.storageObjectKey.startsWith(ATTACHMENT_STORAGE_ZONE.QUARANTINE)) {
          const trustedKey = version.storageObjectKey.replace(
            ATTACHMENT_STORAGE_ZONE.QUARANTINE,
            ATTACHMENT_STORAGE_ZONE.TRUSTED,
          );
          await this.objectStorage.moveObject(version.storageObjectKey, trustedKey);
          await this.attachmentRepository.updateVersionStorageKey(version.id, trustedKey, { tx });
        }
      }

      const updated = await this.attachmentRepository.updateStatus(
        input.id,
        { securityStatus, status },
        { tx },
      );

      if (
        updated &&
        (updated.status === ATTACHMENT_STATUS.AVAILABLE ||
          updated.status === ATTACHMENT_STATUS.REJECTED)
      ) {
        const event: CloudEvent<AttachmentCreatedData> = createCloudEvent({
          type: AttachmentCreatedEvent.type,
          version: AttachmentCreatedEvent.version,
          schema: AttachmentCreatedEvent.schema,
          source: "pine/attachment-service",
          subject: updated.id,
          data: {
            id: updated.id,
            url: `${env.DATA_GATEWAY_URL}/attachments/${updated.id}`,
            scopeType: updated.scopeType,
            scopeId: updated.scopeId,
            ...(updated.tenantId ? { tenantId: updated.tenantId } : {}),
            ...(updated.currentVersionId ? { currentVersionId: updated.currentVersionId } : {}),
            ...(updated.operationId ? { operationId: updated.operationId } : {}),
            ...(updated.metadata ? { metadata: updated.metadata } : {}),
            status: updated.status,
            securityStatus: updated.securityStatus,
            createdBy: updated.createdBy,
            createdAt: updated.createdAt.toISOString(),
          },
        });

        await this.outboxService.schedule(
          {
            eventId: event.id,
            eventType: event.type,
            eventVersion: AttachmentCreatedEvent.version,
            aggregateType: "attachment",
            aggregateId: updated.id,
            payload: event,
          },
          { tx },
        );
      }

      return updated;
    };

    return input.tx ? execute(input.tx) : this.db.transaction(execute);
  }

  async storeDerivative(input: StoreDerivativeInput): Promise<AttachmentDerivative> {
    const attachment = await this.attachmentRepository.findById(input.attachmentId);
    if (!attachment) throw new NotFoundError("Attachment");

    const version = await this.attachmentRepository.findVersionById(
      input.attachmentId,
      input.versionId,
    );
    if (!version) throw new NotFoundError("AttachmentVersion");

    const derivativeId = uuidv7();
    const storageObjectKey = `${ATTACHMENT_STORAGE_ZONE.TRUSTED}/${attachment.scopeType.toLowerCase()}/${attachment.scopeId}/${input.attachmentId}/derivatives/${input.derivativeType}`;

    await this.objectStorage.putObject({
      storageObjectKey,
      contentType: input.contentType,
      body: input.data,
      contentLength: input.data.byteLength,
    });

    const execute = async (tx: DbClient): Promise<AttachmentDerivative> => {
      const saved = await this.attachmentRepository.saveDerivative(
        {
          id: derivativeId,
          attachmentId: input.attachmentId,
          versionId: input.versionId,
          derivativeType: input.derivativeType,
          mimeType: input.contentType,
          fileSize: input.data.byteLength,
          width: input.width ?? 0,
          height: input.height ?? 0,
          storageProvider: "seaweed",
          storageObjectKey,
        },
        { tx },
      );

      const event: CloudEvent<AttachmentDerivativeCreatedData> = createCloudEvent({
        type: AttachmentDerivativeCreatedEvent.type,
        version: AttachmentDerivativeCreatedEvent.version,
        schema: AttachmentDerivativeCreatedEvent.schema,
        source: "pine/attachment-service",
        subject: saved.attachmentId,
        data: {
          derivativeId: saved.id,
          attachmentId: saved.attachmentId,
          versionId: saved.versionId,
          derivativeType: input.derivativeType,
          mimeType: saved.mimeType,
          fileSize: saved.fileSize,
          width: saved.width,
          height: saved.height,
          storageProvider: saved.storageProvider,
          storageObjectKey: saved.storageObjectKey,
          createdAt: saved.createdAt.toISOString(),
        },
      });

      await this.outboxService.schedule(
        {
          eventId: event.id,
          eventType: event.type,
          eventVersion: AttachmentDerivativeCreatedEvent.version,
          aggregateType: "attachment_derivative",
          aggregateId: saved.id,
          payload: event,
        },
        { tx },
      );

      return saved;
    };

    return input.tx ? execute(input.tx) : this.db.transaction(execute);
  }
}
