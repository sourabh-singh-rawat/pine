import {
  itemOwnerRelationship,
  itemProjectRelationship,
  type GraphRelationship,
} from "@pine/authorization";
import {
  type CloudEvent,
  type IBroker,
  type IssueCreatedData,
  Consumer,
  IssueCreatedEvent,
  Streams,
  validateEvent,
} from "@pine/events";
import { inject, injectable } from "inversify";
import type { JsMsg } from "nats";
import { TYPES } from "@/bootstrap/container-types";
import { ensureRelationship } from "@/features/platform/consumers/syncRelationship";
import type { IAuthorizationGraphProvider } from "@/integrations/authorization";

@injectable()
export class AuthorizationItemSyncConsumer extends Consumer<CloudEvent<IssueCreatedData>> {
  readonly stream = Streams.ISSUES;
  readonly consumer = "authorization-item-sync";
  readonly subjects = [IssueCreatedEvent.type];

  constructor(
    @inject(TYPES.Broker)
    private readonly broker: IBroker,
    @inject(TYPES.AuthorizationGraphProvider)
    private readonly authorizationGraphProvider: IAuthorizationGraphProvider,
  ) {
    super(broker.client);
  }

  async onMessage(message: JsMsg, payload: CloudEvent<IssueCreatedData>): Promise<void> {
    if (payload.type !== IssueCreatedEvent.type) {
      message.ack();
      return;
    }

    const event = validateEvent(IssueCreatedEvent, payload);
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

  private itemGraph(data: IssueCreatedData): GraphRelationship[] {
    return [
      itemProjectRelationship(data.id, data.projectId),
      itemOwnerRelationship(data.id, data.ownerId),
    ];
  }
}
