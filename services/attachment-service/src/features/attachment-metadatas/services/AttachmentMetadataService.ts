import { NotFoundError, uuidv7 } from "@pine/common";
import {
  type AttachmentImageMetadataExtractedData,
  AttachmentImageMetadataExtractedEvent,
  type CloudEvent,
  createCloudEvent,
} from "@pine/events";
import type { IOutboxService } from "@pine/outbox";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import type { AttachmentMetadata, DbClient } from "@/db";
import type { IAttachmentRepository } from "@/features/attachment/repositories";
import type { IAttachmentMetadataRepository } from "@/features/attachment-metadatas/repositories";
import type {
  GetAttachmentMetadataInput,
  IAttachmentMetadataService,
  StoreAttachmentMetadataInput,
} from "./IAttachmentMetadataService";

export type AttachmentMetadataDatabase = {
  transaction: <T>(callback: (tx: DbClient) => Promise<T>) => Promise<T>;
};

@injectable()
export class AttachmentMetadataService implements IAttachmentMetadataService {
  constructor(
    @inject(TYPES.Database) private readonly db: AttachmentMetadataDatabase,
    @inject(TYPES.AttachmentRepository)
    private readonly attachmentRepository: IAttachmentRepository,
    @inject(TYPES.AttachmentMetadataRepository)
    private readonly attachmentMetadataRepository: IAttachmentMetadataRepository,
    @inject(TYPES.OutboxService) private readonly outboxService: IOutboxService,
  ) {}

  async store(input: StoreAttachmentMetadataInput): Promise<AttachmentMetadata> {
    const attachment = await this.attachmentRepository.findById(input.attachmentId);
    if (!attachment) {
      throw new NotFoundError("Attachment");
    }

    const version = await this.attachmentRepository.findVersionById(
      input.attachmentId,
      input.versionId,
    );
    if (!version) {
      throw new NotFoundError("AttachmentVersion");
    }

    const metadataId = uuidv7();

    const execute = async (tx: DbClient): Promise<AttachmentMetadata> => {
      const saved = await this.attachmentMetadataRepository.save(
        {
          id: metadataId,
          attachmentId: input.attachmentId,
          versionId: input.versionId,
          width: input.width ?? null,
          height: input.height ?? null,
          format: input.format ?? null,
          space: input.space ?? null,
          channels: input.channels ?? null,
          density: input.density ?? null,
          hasAlpha: input.hasAlpha ?? null,
          orientation: input.orientation ?? null,
          extractedAt: new Date(input.extractedAt),
        },
        { tx },
      );

      const event: CloudEvent<AttachmentImageMetadataExtractedData> = createCloudEvent({
        type: AttachmentImageMetadataExtractedEvent.type,
        version: AttachmentImageMetadataExtractedEvent.version,
        schema: AttachmentImageMetadataExtractedEvent.schema,
        source: "pine/attachment-service",
        subject: saved.attachmentId,
        data: {
          attachmentId: saved.attachmentId,
          versionId: saved.versionId,
          width: saved.width ?? undefined,
          height: saved.height ?? undefined,
          format: saved.format ?? undefined,
          space: saved.space ?? undefined,
          channels: saved.channels ?? undefined,
          density: saved.density ?? undefined,
          hasAlpha: saved.hasAlpha ?? undefined,
          orientation: saved.orientation ?? undefined,
          extractedAt: saved.extractedAt.toISOString(),
        },
      });

      await this.outboxService.schedule(
        {
          eventId: event.id,
          eventType: event.type,
          eventVersion: AttachmentImageMetadataExtractedEvent.version,
          aggregateType: "attachment_metadata",
          aggregateId: saved.id,
          payload: event,
        },
        { tx },
      );

      return saved;
    };

    return input.tx ? execute(input.tx) : this.db.transaction(execute);
  }

  async getByVersionId(input: GetAttachmentMetadataInput): Promise<AttachmentMetadata> {
    const { attachmentId, versionId } = input;
    const attachment = await this.attachmentRepository.findById(attachmentId);
    if (!attachment) {
      throw new NotFoundError("Attachment");
    }

    const version = await this.attachmentRepository.findVersionById(attachmentId, versionId);
    if (!version) {
      throw new NotFoundError("AttachmentVersion");
    }

    const metadata = await this.attachmentMetadataRepository.findByVersionId(
      attachmentId,
      versionId,
    );
    if (!metadata) {
      throw new NotFoundError("AttachmentMetadata");
    }

    return metadata;
  }
}
