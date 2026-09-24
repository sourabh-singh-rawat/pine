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
import type { IItemAttachmentService } from "@/features/attachments/services";

@injectable()
export class ItemAttachmentCreatedConsumer extends Consumer<
  CloudEvent<AttachmentCreatedData>
> {
  readonly stream = Streams.ATTACHMENT;
  readonly consumer = "items-item-attachment-sync";
  readonly subjects = [AttachmentCreatedEvent.type];

  constructor(
    @inject(TYPES.Broker)
    private readonly broker: IBroker,
    @inject(TYPES.ItemAttachmentService)
    private readonly itemAttachmentService: IItemAttachmentService,
  ) {
    super(broker.client);
  }

  async onMessage(
    message: JsMsg,
    payload: CloudEvent<AttachmentCreatedData>,
  ): Promise<void> {
    const event = validateEvent(AttachmentCreatedEvent, payload);
    const data = event.data;

    if (
      !data ||
      data.scopeType !== "WORKSPACE" ||
      data.status !== "AVAILABLE" ||
      data.securityStatus !== "CLEAN"
    ) {
      message.ack();
      return;
    }

    const uploadRequestId =
      typeof data.operationId === "string"
        ? data.operationId
        : typeof data.metadata?.uploadRequestId === "string"
          ? data.metadata.uploadRequestId
          : undefined;

    if (!uploadRequestId) {
      message.ack();
      return;
    }

    await this.itemAttachmentService.completeUpload({
      uploadRequestId,
      attachmentId: data.id,
    });

    message.ack();
  }
}
