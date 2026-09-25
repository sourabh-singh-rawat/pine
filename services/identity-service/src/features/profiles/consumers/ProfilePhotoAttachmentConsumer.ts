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
import { env } from "@/bootstrap/env";
import type { IProfileService } from "@/features/profiles/services";

@injectable()
export class ProfilePhotoAttachmentConsumer extends Consumer<CloudEvent<AttachmentCreatedData>> {
  readonly stream = Streams.ATTACHMENT;
  readonly consumer = "identity-profile-photo-sync";
  readonly subjects = [AttachmentCreatedEvent.type];

  constructor(
    @inject(TYPES.Broker)
    private readonly broker: IBroker,
    @inject(TYPES.ProfileService)
    private readonly profileService: IProfileService,
  ) {
    super(broker.client);
  }

  async onMessage(message: JsMsg, payload: CloudEvent<AttachmentCreatedData>): Promise<void> {
    const event = validateEvent(AttachmentCreatedEvent, payload);
    const data = event.data;
    if (
      !data ||
      data.scopeType !== "IDENTITY" ||
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

    const photoUrl = data.url ?? `${env.DATA_GATEWAY_URL}/attachments/${data.id}`;

    await this.profileService.updatePhoto({
      identityId: data.scopeId,
      photoUrl,
      uploadRequestId,
      attachmentId: data.id,
    });

    message.ack();
  }
}
