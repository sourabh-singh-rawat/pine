import {
  type AttachmentCreatedData,
  type CloudEvent,
  type IBroker,
  AttachmentCreatedEvent,
  Consumer,
  Streams,
  validateEvent,
} from "@pine/events";
import { inject, injectable } from "inversify";
import type { JsMsg } from "nats";
import { TYPES } from "@/bootstrap/container-types";
import type { IMetadataProcessingService } from "@/features/metadata-processing/services";

const isImageMimeType = (mimeType: string | undefined): boolean => {
  if (!mimeType) {
    return false;
  }
  return mimeType.startsWith("image/");
};

const resolveMimeTypeFromMetadata = (metadata?: Record<string, unknown>): string | undefined => {
  if (!metadata) {
    return undefined;
  }
  const contentType = metadata.contentType;
  if (typeof contentType === "string") {
    return contentType;
  }
  const mimeType = metadata.mimeType;
  if (typeof mimeType === "string") {
    return mimeType;
  }
  return undefined;
};

const resolveMimeType = (
  contentType: string | undefined,
  metadata?: Record<string, unknown>,
): string | undefined => {
  if (typeof contentType === "string" && contentType.length > 0) {
    return contentType;
  }
  return resolveMimeTypeFromMetadata(metadata);
};

@injectable()
export class AttachmentImageMetadataConsumer extends Consumer<CloudEvent<AttachmentCreatedData>> {
  readonly stream = Streams.ATTACHMENT;
  readonly consumer = "attachment-image-metadata-created";
  readonly subjects = [AttachmentCreatedEvent.type];

  constructor(
    @inject(TYPES.Broker)
    private readonly broker: IBroker,
    @inject(TYPES.MetadataProcessingService)
    private readonly metadataProcessingService: IMetadataProcessingService,
  ) {
    super(broker);
  }

  async onMessage(message: JsMsg, payload: CloudEvent<AttachmentCreatedData>): Promise<void> {
    const event = validateEvent(AttachmentCreatedEvent, payload);
    const data = event.data;
    if (!data) {
      message.ack();
      return;
    }

    const mimeType = resolveMimeType(data.contentType, data.metadata);

    if (data.status === "AVAILABLE" && isImageMimeType(mimeType)) {
      await this.metadataProcessingService.process({
        attachmentId: data.id,
        versionId: data.currentVersionId ?? data.id,
        mimeType: mimeType ?? "",
        scopeType: data.scopeType,
        scopeId: data.scopeId,
        tenantId: data.tenantId,
        url: data.url,
      });
    }

    message.ack();
  }
}
