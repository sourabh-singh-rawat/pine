import { relationship, type GraphRelationship } from "@pine/authorization";
import {
  type CloudEvent,
  type IBroker,
  type OrganizationRelationCreatedData,
  Consumer,
  OrganizationRelationCreatedEvent,
  Streams,
  validateEvent,
} from "@pine/events";
import { inject, injectable } from "inversify";
import type { JsMsg } from "nats";
import { TYPES } from "@/bootstrap/container-types";
import { ensureRelationship } from "@/features/platform/consumers/syncRelationship";
import type { IAuthorizationGraphProvider } from "@/integrations/authorization";

@injectable()
export class AuthorizationOrganizationRelationSyncConsumer extends Consumer<
  CloudEvent<OrganizationRelationCreatedData>
> {
  readonly stream = Streams.PLATFORM;
  readonly consumer = "authorization-organization-relation-sync";
  readonly subjects = [OrganizationRelationCreatedEvent.type];

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
    payload: CloudEvent<OrganizationRelationCreatedData>,
  ): Promise<void> {
    if (payload.type !== OrganizationRelationCreatedEvent.type) {
      message.ack();
      return;
    }

    const event = validateEvent(OrganizationRelationCreatedEvent, payload);
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

  private relationshipFor(data: OrganizationRelationCreatedData): GraphRelationship | undefined {
    if (data.relation === "owners") {
      return relationship({
        object: { namespace: "Organization", id: data.organizationId },
        relation: "owners",
        subject: { namespace: "Identity", id: data.identityId },
      });
    }
    if (data.relation === "admins") {
      return relationship({
        object: { namespace: "Organization", id: data.organizationId },
        relation: "admins",
        subject: { namespace: "Identity", id: data.identityId },
      });
    }
    if (data.relation === "members") {
      return relationship({
        object: { namespace: "Organization", id: data.organizationId },
        relation: "members",
        subject: { namespace: "Identity", id: data.identityId },
      });
    }
    return undefined;
  }
}
