import {
  type AttachmentCreatedData,
  type AttachmentQuarantinedData,
  type CloudEvent,
  type IBroker,
  AttachmentCreatedEvent,
  AttachmentQuarantinedEvent,
  Consumer,
  Streams,
  validateEvent,
} from "@pine/events";
import { inject, injectable } from "inversify";
import type { JsMsg } from "nats";
import { TYPES } from "@/bootstrap/container-types";
import type { IItemAttachmentService } from "@/features/item-attachments/services";

const resolveUploadRequestId = (data: {
  operationId?: string;
  metadata?: Record<string, unknown>;
}): string | undefined => {
  if (typeof data.operationId === "string") {
    return data.operationId;
  }
  if (typeof data.metadata?.uploadRequestId === "string") {
    return data.metadata.uploadRequestId;
  }
  return undefined;
};

@injectable()
export class ItemAttachmentCreatedConsumer extends Consumer<
  CloudEvent<AttachmentCreatedData | AttachmentQuarantinedData>
> {
  readonly stream = Streams.ATTACHMENT;
  readonly consumer = "items-item-attachment-sync";
  readonly subjects = [AttachmentQuarantinedEvent.type, AttachmentCreatedEvent.type];

  constructor(
    @inject(TYPES.Broker)
    private readonly broker: IBroker,
    @inject(TYPES.ItemAttachmentService)
    private readonly itemAttachmentService: IItemAttachmentService,
  ) {
    super(broker);
  }

  async onMessage(
    message: JsMsg,
    payload: CloudEvent<AttachmentCreatedData | AttachmentQuarantinedData>,
  ): Promise<void> {
    if (payload.type === AttachmentQuarantinedEvent.type) {
      const event = validateEvent(AttachmentQuarantinedEvent, payload);
      const data = event.data;

      if (!data || data.scopeType !== "WORKSPACE") {
        message.ack();
        return;
      }

      const uploadRequestId = resolveUploadRequestId(data);
      if (!uploadRequestId) {
        message.ack();
        return;
      }

      await this.itemAttachmentService.markScanning({
        uploadRequestId,
        attachmentId: data.id,
      });

      message.ack();
      return;
    }

    if (payload.type === AttachmentCreatedEvent.type) {
      const event = validateEvent(AttachmentCreatedEvent, payload);
      const data = event.data;

      if (!data || data.scopeType !== "WORKSPACE") {
        message.ack();
        return;
      }

      const uploadRequestId = resolveUploadRequestId(data);
      if (!uploadRequestId) {
        message.ack();
        return;
      }

      if (data.status === "AVAILABLE" && data.securityStatus === "CLEAN") {
        await this.itemAttachmentService.completeUpload({
          uploadRequestId,
          attachmentId: data.id,
        });
        message.ack();
        return;
      }

      if (data.status === "REJECTED") {
        await this.itemAttachmentService.markFailed({ uploadRequestId });
        message.ack();
        return;
      }

      message.ack();
      return;
    }

    message.ack();
  }
}
