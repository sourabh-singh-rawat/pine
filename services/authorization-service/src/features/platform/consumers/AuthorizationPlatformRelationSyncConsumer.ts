import { PLATFORM_OBJECT_ID, relationship, type GraphRelationship } from "@pine/authorization";
import {
  type CloudEvent,
  type IBroker,
  type PlatformRelationCreatedData,
  Consumer,
  PlatformRelationCreatedEvent,
  Streams,
  validateEvent,
} from "@pine/events";
import { inject, injectable } from "inversify";
import type { JsMsg } from "nats";
import { TYPES } from "@/bootstrap/container-types";
import { ensureRelationship } from "@/features/platform/consumers/syncRelationship";
import type { IAuthorizationGraphProvider } from "@/integrations/authorization";

@injectable()
export class AuthorizationPlatformRelationSyncConsumer extends Consumer<
  CloudEvent<PlatformRelationCreatedData>
> {
  readonly stream = Streams.PLATFORM;
  readonly consumer = "authorization-platform-relation-sync";
  readonly subjects = [PlatformRelationCreatedEvent.type];

  constructor(
    @inject(TYPES.Broker)
    private readonly broker: IBroker,
    @inject(TYPES.AuthorizationGraphProvider)
    private readonly authorizationGraphProvider: IAuthorizationGraphProvider,
  ) {
    super(broker);
  }

  async onMessage(message: JsMsg, payload: CloudEvent<PlatformRelationCreatedData>): Promise<void> {
    if (payload.type !== PlatformRelationCreatedEvent.type) {
      message.ack();
      return;
    }

    const event = validateEvent(PlatformRelationCreatedEvent, payload);
    const data = event.data;
    if (!data) {
      message.ack();
      return;
    }

    const relationship = this.relationshipFor(data);
    if (relationship !== undefined) {
      await ensureRelationship(this.authorizationGraphProvider, relationship);
    }

    message.ack();
  }

  private relationshipFor(data: PlatformRelationCreatedData): GraphRelationship | undefined {
    if (data.relation === "owners") {
      return relationship({
        object: { namespace: "Platform", id: PLATFORM_OBJECT_ID },
        relation: "owners",
        subject: { namespace: "Identity", id: data.identityId },
      });
    }
    if (data.relation === "admins") {
      return relationship({
        object: { namespace: "Platform", id: PLATFORM_OBJECT_ID },
        relation: "admins",
        subject: { namespace: "Identity", id: data.identityId },
      });
    }
    if (data.relation === "members") {
      return relationship({
        object: { namespace: "Platform", id: PLATFORM_OBJECT_ID },
        relation: "members",
        subject: { namespace: "Identity", id: data.identityId },
      });
    }
    return undefined;
  }
}
