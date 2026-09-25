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
    super(broker.client);
  }

  async onMessage(message: JsMsg, payload: CloudEvent<IdentityEmailVerifiedData>) {
    const event = validateEvent(IdentityEmailVerifiedEvent, payload);
    const { userId } = event.data!;

    await this.db.transaction(async (tx) => {
      const exists = await this.identityRepository.existsById(userId, { tx });
      if (exists) {
        return;
      }

      await this.identityRepository.save({ id: userId }, { tx });
    });

    message.ack();
  }
}
