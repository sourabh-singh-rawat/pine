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
import type { IImageProcessingService } from "@/features/image-processing/services";

const isImageMimeType = (mimeType: string | undefined): boolean => {
  if (!mimeType) {
    return false;
  }
  return mimeType.startsWith("image/");
};

const resolveMimeType = (metadata?: Record<string, unknown>): string | undefined => {
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

@injectable()
export class AttachmentImageCreatedConsumer extends Consumer<CloudEvent<AttachmentCreatedData>> {
  readonly stream = Streams.ATTACHMENT;
  readonly consumer = "attachment-image-processing-created";
  readonly subjects = [AttachmentCreatedEvent.type];

  constructor(
    @inject(TYPES.Broker)
    private readonly broker: IBroker,
    @inject(TYPES.ImageProcessingService)
    private readonly imageProcessingService: IImageProcessingService,
  ) {
    super(broker.client);
  }

  async onMessage(message: JsMsg, payload: CloudEvent<AttachmentCreatedData>): Promise<void> {
    const event = validateEvent(AttachmentCreatedEvent, payload);
    const data = event.data;
    if (!data) {
      message.ack();
      return;
    }

    const mimeType = resolveMimeType(data.metadata);

    if (data.status === "AVAILABLE" && isImageMimeType(mimeType)) {
      await this.imageProcessingService.process({
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
