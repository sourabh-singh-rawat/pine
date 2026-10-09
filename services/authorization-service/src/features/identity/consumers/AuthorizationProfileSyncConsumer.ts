import {
  type CloudEvent,
  type IBroker,
  type ProfileCreatedData,
  type ProfileDeletedData,
  Consumer,
  ProfileCreatedEvent,
  ProfileDeletedEvent,
  Streams,
  validateEvent,
} from "@pine/events";
import { inject, injectable } from "inversify";
import type { JsMsg } from "nats";
import { TYPES } from "@/bootstrap/container-types";
import {
  ensureRelationship,
  removeRelationship,
} from "@/features/platform/consumers/syncRelationship";
import type { IAuthorizationGraphProvider } from "@/integrations/authorization";

@injectable()
export class AuthorizationProfileSyncConsumer extends Consumer<
  CloudEvent<ProfileCreatedData | ProfileDeletedData>
> {
  readonly stream = Streams.IDENTITY;
  readonly consumer = "authorization-profile-sync";
  readonly subjects = [ProfileCreatedEvent.type, ProfileDeletedEvent.type];

  constructor(
    @inject(TYPES.Broker)
    private readonly broker: IBroker,
    @inject(TYPES.AuthorizationGraphProvider)
    private readonly authorizationGraphProvider: IAuthorizationGraphProvider,
  ) {
    super(broker);
  }

  async onMessage(
    message: JsMsg,
    payload: CloudEvent<ProfileCreatedData | ProfileDeletedData>,
  ): Promise<void> {
    switch (payload.type) {
      case ProfileCreatedEvent.type: {
        const event = validateEvent(ProfileCreatedEvent, payload);
        const data = event.data;
        if (!data) {
          break;
        }

        await ensureRelationship(this.authorizationGraphProvider, {
          object: { namespace: "Profile", id: data.id },
          relation: "identity",
          subject: { namespace: "Identity", id: data.identityId },
        });
        break;
      }
      case ProfileDeletedEvent.type: {
        const event = validateEvent(ProfileDeletedEvent, payload);
        const data = event.data;
        if (!data) {
          break;
        }

        await removeRelationship(this.authorizationGraphProvider, {
          object: { namespace: "Profile", id: data.id },
          relation: "identity",
          subject: { namespace: "Identity", id: data.identityId },
        });
        break;
      }
    }

    message.ack();
  }
}
