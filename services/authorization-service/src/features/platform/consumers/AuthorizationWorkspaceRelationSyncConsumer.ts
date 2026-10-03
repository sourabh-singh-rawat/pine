import {
  ADMIN,
  MEMBER,
  OWNER,
  workspaceAdminRelationship,
  workspaceMemberRelationship,
  workspaceOwnerRelationship,
  type GraphRelationship,
} from "@pine/authorization";
import {
  type CloudEvent,
  type IBroker,
  type WorkspaceRelationCreatedData,
  Consumer,
  WorkspaceRelationCreatedEvent,
  Streams,
  validateEvent,
} from "@pine/events";
import { inject, injectable } from "inversify";
import type { JsMsg } from "nats";
import { TYPES } from "@/bootstrap/container-types";
import { ensureRelationship } from "@/features/platform/consumers/syncRelationship";
import type { IAuthorizationGraphProvider } from "@/integrations/authorization";

@injectable()
export class AuthorizationWorkspaceRelationSyncConsumer extends Consumer<
  CloudEvent<WorkspaceRelationCreatedData>
> {
  readonly stream = Streams.PLATFORM;
  readonly consumer = "authorization-workspace-relation-sync";
  readonly subjects = [WorkspaceRelationCreatedEvent.type];

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
    payload: CloudEvent<WorkspaceRelationCreatedData>,
  ): Promise<void> {
    if (payload.type !== WorkspaceRelationCreatedEvent.type) {
      message.ack();
      return;
    }

    const event = validateEvent(WorkspaceRelationCreatedEvent, payload);
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

  private relationshipFor(data: WorkspaceRelationCreatedData): GraphRelationship | undefined {
    if (data.relation === OWNER) {
      return workspaceOwnerRelationship(data.workspaceId, data.identityId);
    }
    if (data.relation === ADMIN) {
      return workspaceAdminRelationship(data.workspaceId, data.identityId);
    }
    if (data.relation === MEMBER) {
      return workspaceMemberRelationship(data.workspaceId, data.identityId);
    }
    return undefined;
  }
}
