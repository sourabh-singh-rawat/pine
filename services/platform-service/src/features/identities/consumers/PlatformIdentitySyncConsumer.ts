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
import type { JsMsg } from "nats";
import { TYPES } from "@/bootstrap/container-types";
import type { Database } from "@/db";
import type { IIdentityRepository } from "@/features/identities/repositories";

@injectable()
export class PlatformIdentitySyncConsumer extends Consumer<CloudEvent<IdentityEmailVerifiedData>> {
  readonly stream = Streams.IDENTITY;
  readonly consumer = "platform-identity-sync";
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

    await this.db.transaction(async (tx) => {
      await this.identityRepository.upsert(
        {
          id: data.userId,
          ...(data.displayName !== undefined ? { displayName: data.displayName } : {}),
        },
        { tx },
      );
    });

    message.ack();
  };
}
