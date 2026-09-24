import {
  itemListRelationship,
  itemOwnerRelationship,
  type GraphRelationship,
} from "@pine/authorization";
import {
  type CloudEvent,
  type IBroker,
  type ItemCreatedData,
  Consumer,
  ItemCreatedEvent,
  Streams,
  validateEvent,
} from "@pine/events";
import { inject, injectable } from "inversify";
import type { JsMsg } from "nats";
import { TYPES } from "@/bootstrap/container-types";
import { ensureRelationship } from "@/features/platform/consumers/syncRelationship";
import type { IAuthorizationGraphProvider } from "@/integrations/authorization";

@injectable()
export class AuthorizationItemSyncConsumer extends Consumer<CloudEvent<ItemCreatedData>> {
  readonly stream = Streams.ITEMS;
  readonly consumer = "authorization-item-sync";
  readonly subjects = [ItemCreatedEvent.type];

  constructor(
    @inject(TYPES.Broker)
    private readonly broker: IBroker,
    @inject(TYPES.AuthorizationGraphProvider)
    private readonly authorizationGraphProvider: IAuthorizationGraphProvider,
  ) {
    super(broker.client);
  }

  async onMessage(message: JsMsg, payload: CloudEvent<ItemCreatedData>): Promise<void> {
    if (payload.type !== ItemCreatedEvent.type) {
      message.ack();
      return;
    }

    const event = validateEvent(ItemCreatedEvent, payload);
    const data = event.data;
    if (!data) {
      message.ack();
      return;
    }

    for (const relationship of this.itemGraph(data)) {
      await ensureRelationship(this.authorizationGraphProvider, relationship);
    }

    message.ack();
  }

  private itemGraph(data: ItemCreatedData): GraphRelationship[] {
    return [
      itemListRelationship(data.id, data.listId),
      itemOwnerRelationship(data.id, data.ownerId),
    ];
  }
}
