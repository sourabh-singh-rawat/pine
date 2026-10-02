import {
  type CloudEvent,
  type IBroker,
  type IdentityEmailVerifiedData,
  Streams,
  Consumer,
  IdentityEmailVerifiedEvent,
  validateEvent,
} from "@pine/events";
import { inject, injectable } from "inversify";
import { JsMsg } from "nats";
import { TYPES } from "@/bootstrap/container-types";
import type { Database } from "@/db";
import type { IIdentityRepository } from "@/features/identities/repositories";

@injectable()
export class AttachmentIdentitySyncConsumer extends Consumer<
  CloudEvent<IdentityEmailVerifiedData>
> {
  readonly stream = Streams.IDENTITY;
  readonly consumer = "attachment-identity-sync";
  readonly subjects = [IdentityEmailVerifiedEvent.type];

  constructor(
    @inject(TYPES.Broker)
    private readonly broker: IBroker,
    @inject(TYPES.Database)
    private readonly db: Database,
    @inject(TYPES.IdentityRepository)
    private readonly identityRepository: IIdentityRepository,
  ) {
    super(broker);
  }

  onMessage = async (
    message: JsMsg,
    payload: CloudEvent<IdentityEmailVerifiedData>,
  ): Promise<void> => {
    const event = validateEvent(IdentityEmailVerifiedEvent, payload);
    const data = event.data;
    if (!data) {
      message.ack();
      return;
    }

    const nameParts = (data.displayName ?? "").trim().split(/\s+/);
    const fallbackFirstName = nameParts[0] || null;
    const fallbackLastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;

    const firstName = data.firstName ?? fallbackFirstName;
    const middleName = data.middleName ?? null;
    const lastName = data.lastName ?? fallbackLastName;

    const fullName = data.fullName ?? data.displayName;

    await this.db.transaction(async (tx) => {
      await this.identityRepository.upsert(
        {
          identityId: data.userId,
          ...(fullName !== undefined ? { fullName } : {}),
          ...(firstName !== null ? { firstName } : {}),
          ...(middleName !== null ? { middleName } : {}),
          ...(lastName !== null ? { lastName } : {}),
        },
        { tx },
      );
    });

    message.ack();
  };
}
