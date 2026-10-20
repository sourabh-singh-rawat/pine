import { relationship, type GraphRelationship } from "@pine/authorization";
import {
  type CloudEvent,
  type IBroker,
  type ListData,
  Consumer,
  ListCreatedEvent,
  Streams,
  validateEvent,
} from "@pine/events";
import { inject, injectable } from "inversify";
import type { JsMsg } from "nats";
import { TYPES } from "@/bootstrap/container-types";
import { ensureRelationship } from "@/features/platform/consumers/syncRelationship";
import type { IAuthorizationGraphProvider } from "@/integrations/authorization";

@injectable()
export class AuthorizationListSyncConsumer extends Consumer<CloudEvent<ListData>> {
  readonly stream = Streams.ITEMS;
  readonly consumer = "authorization-list-sync";
  readonly subjects = [ListCreatedEvent.type];

  constructor(
    @inject(TYPES.Broker)
    private readonly broker: IBroker,
    @inject(TYPES.AuthorizationGraphProvider)
    private readonly authorizationGraphProvider: IAuthorizationGraphProvider,
  ) {
    super(broker);
  }

  async onMessage(message: JsMsg, payload: CloudEvent<ListData>): Promise<void> {
    if (payload.type !== ListCreatedEvent.type) {
      message.ack();
      return;
    }

    const event = validateEvent(ListCreatedEvent, payload);
    const data = event.data;
    if (!data) {
      message.ack();
      return;
    }

    for (const relationship of this.listGraph(data)) {
      await ensureRelationship(this.authorizationGraphProvider, relationship);
    }

    message.ack();
  }

  private listGraph(data: ListData): GraphRelationship[] {
    return [
      relationship({
        object: { namespace: "List", id: data.id },
        relation: "space",
        subject: { namespace: "Space", id: data.spaceId },
      }),
      relationship({
        object: { namespace: "List", id: data.id },
        relation: "owners",
        subject: { namespace: "Identity", id: data.ownerUserId },
      }),
    ];
  }
}
