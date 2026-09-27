import { NotFoundError, uuidv7 } from "@pine/common";
import {
  type AttachmentDerivativeCreatedData,
  AttachmentDerivativeCreatedEvent,
  type CloudEvent,
  createCloudEvent,
} from "@pine/events";
import type { IOutboxService } from "@pine/outbox";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import type { AttachmentDerivative, DbClient } from "@/db";
import { ATTACHMENT_STORAGE_ZONE } from "@/features/attachment/constants";
import type { IAttachmentRepository } from "@/features/attachment/repositories";
import type {
  AttachmentDerivativeContent,
  GetAttachmentDerivativeContentInput,
  IAttachmentDerivativeService,
  StoreAttachmentDerivativeInput,
} from "@/features/attachment-derivatives/services/IAttachmentDerivativeService";
import type { IObjectStorage } from "@/integrations/storage";

export type AttachmentDerivativeDatabase = {
  transaction: <T>(callback: (tx: DbClient) => Promise<T>) => Promise<T>;
};

@injectable()
export class AttachmentDerivativeService implements IAttachmentDerivativeService {
  constructor(
    @inject(TYPES.Database) private readonly db: AttachmentDerivativeDatabase,
    @inject(TYPES.AttachmentRepository)
    private readonly attachmentRepository: IAttachmentRepository,
    @inject(TYPES.ObjectStorage) private readonly objectStorage: IObjectStorage,
    @inject(TYPES.OutboxService) private readonly outboxService: IOutboxService,
  ) {}

  async store(input: StoreAttachmentDerivativeInput): Promise<AttachmentDerivative> {
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

  async getContent(
    input: GetAttachmentDerivativeContentInput,
  ): Promise<AttachmentDerivativeContent> {
    const { attachmentId, derivativeType } = input;
    const attachment = await this.attachmentRepository.findById(attachmentId);
    if (!attachment || !attachment.currentVersionId) {
      throw new NotFoundError("Attachment");
    }

    const version = await this.attachmentRepository.findVersionById(
      attachmentId,
      attachment.currentVersionId,
    );
    if (!version) {
      throw new NotFoundError("AttachmentVersion");
    }

    const derivative = await this.attachmentRepository.findDerivative(
      attachmentId,
      attachment.currentVersionId,
      derivativeType,
    );
    if (!derivative) {
      throw new NotFoundError("AttachmentDerivative");
    }

    const object = await this.objectStorage.getObject(derivative.storageObjectKey);

    return {
      stream: object.body,
      filename: `${version.filename}-${derivativeType}`,
      contentType: derivative.mimeType,
      fileSize: derivative.fileSize,
    };
  }
}
