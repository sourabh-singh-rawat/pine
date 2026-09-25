import { workspaceTenantRelationship, type GraphRelationship } from "@pine/authorization";
import {
  type CloudEvent,
  type IBroker,
  type WorkspaceCreatedData,
  Consumer,
  WorkspaceCreatedEvent,
  Streams,
  validateEvent,
} from "@pine/events";
import { inject, injectable } from "inversify";
import type { JsMsg } from "nats";
import { TYPES } from "@/bootstrap/container-types";
import { ensureRelationship } from "@/features/platform/consumers/syncRelationship";
import type { IAuthorizationGraphProvider } from "@/integrations/authorization";

@injectable()
export class AuthorizationWorkspaceSyncConsumer extends Consumer<CloudEvent<WorkspaceCreatedData>> {
  readonly stream = Streams.PLATFORM;
  readonly consumer = "authorization-workspace-sync";
  readonly subjects = [WorkspaceCreatedEvent.type];

  constructor(
    @inject(TYPES.Broker)
    private readonly broker: IBroker,
    @inject(TYPES.AuthorizationGraphProvider)
    private readonly authorizationGraphProvider: IAuthorizationGraphProvider,
  ) {
    super(broker.client);
  }

  async onMessage(message: JsMsg, payload: CloudEvent<WorkspaceCreatedData>): Promise<void> {
    if (payload.type !== WorkspaceCreatedEvent.type) {
      message.ack();
      return;
    }

    const event = validateEvent(WorkspaceCreatedEvent, payload);
    const data = event.data;
    if (!data) {
      message.ack();
      return;
    }

    const relationship: GraphRelationship = workspaceTenantRelationship(data.id, data.tenantId);
    await ensureRelationship(this.authorizationGraphProvider, relationship);
    message.ack();
  }
}
