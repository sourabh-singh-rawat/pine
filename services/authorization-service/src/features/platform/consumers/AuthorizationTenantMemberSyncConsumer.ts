import { relationship, type GraphRelationship } from "@pine/authorization";
import {
  type CloudEvent,
  type IBroker,
  type TenantMemberCreatedData,
  type TenantMemberDeletedData,
  Consumer,
  Streams,
  TenantMemberCreatedEvent,
  TenantMemberDeletedEvent,
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
export class AuthorizationTenantMemberSyncConsumer extends Consumer<
  CloudEvent<TenantMemberCreatedData | TenantMemberDeletedData>
> {
  readonly stream = Streams.PLATFORM;
  readonly consumer = "authorization-tenant-member-sync";
  readonly subjects = [TenantMemberCreatedEvent.type, TenantMemberDeletedEvent.type];

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
    payload: CloudEvent<TenantMemberCreatedData | TenantMemberDeletedData>,
  ): Promise<void> {
    if (payload.type === TenantMemberCreatedEvent.type) {
      const event = validateEvent(TenantMemberCreatedEvent, payload);
      const data = event.data;
      if (!data) {
        message.ack();
        return;
      }

      const rel = this.relationshipFor(data.tenantId, data.identityId, data.role);
      if (rel !== undefined) {
        await ensureRelationship(this.authorizationGraphProvider, rel);
      }
      message.ack();
      return;
    }

    if (payload.type === TenantMemberDeletedEvent.type) {
      const event = validateEvent(TenantMemberDeletedEvent, payload);
      const data = event.data;
      if (!data) {
        message.ack();
        return;
      }

      const rel = this.relationshipFor(data.tenantId, data.identityId, data.role);
      if (rel !== undefined) {
        await removeRelationship(this.authorizationGraphProvider, rel);
      }
      message.ack();
      return;
    }

    message.ack();
  }

  private relationshipFor(
    tenantId: string,
    identityId: string,
    role: string,
  ): GraphRelationship | undefined {
    if (role === "owners" || role === "owner") {
      return relationship({
        object: { namespace: "Tenant", id: tenantId },
        relation: "owners",
        subject: { namespace: "Identity", id: identityId },
      });
    }
    if (role === "admins" || role === "admin") {
      return relationship({
        object: { namespace: "Tenant", id: tenantId },
        relation: "admins",
        subject: { namespace: "Identity", id: identityId },
      });
    }
    if (role === "members" || role === "member") {
      return relationship({
        object: { namespace: "Tenant", id: tenantId },
        relation: "members",
        subject: { namespace: "Identity", id: identityId },
      });
    }
    return undefined;
  }
}
