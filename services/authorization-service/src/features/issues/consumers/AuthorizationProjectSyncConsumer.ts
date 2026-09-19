import {
  projectOwnerRelationship,
  projectSpaceRelationship,
  type GraphRelationship,
} from "@pine/authorization";
import {
  type CloudEvent,
  type IBroker,
  type ProjectData,
  Consumer,
  ProjectCreatedEvent,
  Streams,
  validateEvent,
} from "@pine/events";
import { inject, injectable } from "inversify";
import type { JsMsg } from "nats";
import { TYPES } from "@/bootstrap/container-types";
import { ensureRelationship } from "@/features/platform/consumers/syncRelationship";
import type { IAuthorizationGraphProvider } from "@/integrations/authorization";

@injectable()
export class AuthorizationProjectSyncConsumer extends Consumer<CloudEvent<ProjectData>> {
  readonly stream = Streams.ISSUES;
  readonly consumer = "authorization-project-sync";
  readonly subjects = [ProjectCreatedEvent.type];

  constructor(
    @inject(TYPES.Broker)
    private readonly broker: IBroker,
    @inject(TYPES.AuthorizationGraphProvider)
    private readonly authorizationGraphProvider: IAuthorizationGraphProvider,
  ) {
    super(broker.client);
  }

  async onMessage(message: JsMsg, payload: CloudEvent<ProjectData>): Promise<void> {
    if (payload.type !== ProjectCreatedEvent.type) {
      message.ack();
      return;
    }

    const event = validateEvent(ProjectCreatedEvent, payload);
    const data = event.data;
    if (!data) {
      message.ack();
      return;
    }

    for (const relationship of this.projectGraph(data)) {
      await ensureRelationship(this.authorizationGraphProvider, relationship);
    }

    message.ack();
  }

  private projectGraph(data: ProjectData): GraphRelationship[] {
    return [
      projectSpaceRelationship(data.id, data.spaceId),
      projectOwnerRelationship(data.id, data.ownerUserId),
    ];
  }
}
