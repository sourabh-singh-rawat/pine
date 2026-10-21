import { relationship, type GraphRelationship } from "@pine/authorization";
import {
  type CloudEvent,
  type IBroker,
  type OrganizationMemberCreatedData,
  type OrganizationMemberDeletedData,
  Consumer,
  OrganizationMemberCreatedEvent,
  OrganizationMemberDeletedEvent,
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
export class AuthorizationOrganizationMemberSyncConsumer extends Consumer<
  CloudEvent<OrganizationMemberCreatedData | OrganizationMemberDeletedData>
> {
  readonly stream = Streams.PLATFORM;
  readonly consumer = "authorization-organization-member-sync";
  readonly subjects = [OrganizationMemberCreatedEvent.type, OrganizationMemberDeletedEvent.type];

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
    payload: CloudEvent<OrganizationMemberCreatedData | OrganizationMemberDeletedData>,
  ): Promise<void> {
    if (payload.type === OrganizationMemberCreatedEvent.type) {
      const event = validateEvent(OrganizationMemberCreatedEvent, payload);
      const data = event.data;
      if (!data) {
        message.ack();
        return;
      }

      const rel = this.relationshipFor(data.organizationId, data.identityId, data.role);
      if (rel !== undefined) {
        await ensureRelationship(this.authorizationGraphProvider, rel);
      }
      message.ack();
      return;
    }

    if (payload.type === OrganizationMemberDeletedEvent.type) {
      const event = validateEvent(OrganizationMemberDeletedEvent, payload);
      const data = event.data;
      if (!data) {
        message.ack();
        return;
      }

      const rel = this.relationshipFor(data.organizationId, data.identityId, data.role);
      if (rel !== undefined) {
        await removeRelationship(this.authorizationGraphProvider, rel);
      }
      message.ack();
      return;
    }

    message.ack();
  }

  private relationshipFor(
    organizationId: string,
    identityId: string,
    role: string,
  ): GraphRelationship | undefined {
    if (role === "owners" || role === "owner") {
      return relationship({
        object: { namespace: "Organization", id: organizationId },
        relation: "owners",
        subject: { namespace: "Identity", id: identityId },
      });
    }
    if (role === "admins" || role === "admin") {
      return relationship({
        object: { namespace: "Organization", id: organizationId },
        relation: "admins",
        subject: { namespace: "Identity", id: identityId },
      });
    }
    if (role === "members" || role === "member") {
      return relationship({
        object: { namespace: "Organization", id: organizationId },
        relation: "members",
        subject: { namespace: "Identity", id: identityId },
      });
    }
    return undefined;
  }
}
