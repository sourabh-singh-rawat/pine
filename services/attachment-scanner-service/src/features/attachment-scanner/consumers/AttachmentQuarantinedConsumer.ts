import {
  type AttachmentQuarantinedData,
  type CloudEvent,
  type IBroker,
  AttachmentQuarantinedEvent,
  Consumer,
  Streams,
  validateEvent,
} from "@pine/events";
import { inject, injectable } from "inversify";
import type { JsMsg } from "nats";
import { TYPES } from "@/bootstrap/container-types";
import type { IAttachmentScannerService } from "@/features/attachment-scanner/services";

@injectable()
export class AttachmentQuarantinedConsumer extends Consumer<CloudEvent<AttachmentQuarantinedData>> {
  readonly stream = Streams.ATTACHMENT;
  readonly consumer = "attachment-scanner-attachment-quarantined";
  readonly subjects = [AttachmentQuarantinedEvent.type];

  constructor(
    @inject(TYPES.Broker)
    private readonly broker: IBroker,
    @inject(TYPES.AttachmentScannerService)
    private readonly scannerService: IAttachmentScannerService,
  ) {
    super(broker);
  }

  async onMessage(message: JsMsg, payload: CloudEvent<AttachmentQuarantinedData>): Promise<void> {
    const event = validateEvent(AttachmentQuarantinedEvent, payload);
    const data = event.data;
    if (!data) {
      message.ack();
      return;
    }

    await this.scannerService.scan({
      attachmentId: data.id,
      versionId: data.currentVersionId ?? data.id,
      scopeType: data.scopeType,
      scopeId: data.scopeId,
      tenantId: data.tenantId,
    });

    message.ack();
  }
}
