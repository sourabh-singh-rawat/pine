import {
  spaceOwnerRelationship,
  spaceWorkspaceRelationship,
  type GraphRelationship,
} from "@pine/authorization";
import {
  type CloudEvent,
  type IBroker,
  type SpaceData,
  Consumer,
  SpaceCreatedEvent,
  Streams,
  validateEvent,
} from "@pine/events";
import { inject, injectable } from "inversify";
import type { JsMsg } from "nats";
import { TYPES } from "@/bootstrap/container-types";
import { ensureRelationship } from "@/features/platform/consumers/syncRelationship";
import type { IAuthorizationGraphProvider } from "@/integrations/authorization";

@injectable()
export class AuthorizationSpaceSyncConsumer extends Consumer<CloudEvent<SpaceData>> {
  readonly stream = Streams.ITEMS;
  readonly consumer = "authorization-space-sync";
  readonly subjects = [SpaceCreatedEvent.type];

  constructor(
    @inject(TYPES.Broker)
    private readonly broker: IBroker,
    @inject(TYPES.AuthorizationGraphProvider)
    private readonly authorizationGraphProvider: IAuthorizationGraphProvider,
  ) {
    super(broker.client);
  }

  async onMessage(message: JsMsg, payload: CloudEvent<SpaceData>): Promise<void> {
    if (payload.type !== SpaceCreatedEvent.type) {
      message.ack();
      return;
    }

    const event = validateEvent(SpaceCreatedEvent, payload);
    const data = event.data;
    if (!data) {
      message.ack();
      return;
    }

    for (const relationship of this.spaceGraph(data)) {
      await ensureRelationship(this.authorizationGraphProvider, relationship);
    }

    message.ack();
  }

  private spaceGraph(data: SpaceData): GraphRelationship[] {
    return [
      spaceWorkspaceRelationship(data.id, data.workspaceId),
      spaceOwnerRelationship(data.id, data.createdById),
    ];
  }
}
