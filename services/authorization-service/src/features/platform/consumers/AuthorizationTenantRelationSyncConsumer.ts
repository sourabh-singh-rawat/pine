import { relationship, type GraphRelationship } from "@pine/authorization";
import {
  type CloudEvent,
  type IBroker,
  type TenantRelationCreatedData,
  Consumer,
  Streams,
  TenantRelationCreatedEvent,
  validateEvent,
} from "@pine/events";
import { inject, injectable } from "inversify";
import type { JsMsg } from "nats";
import { TYPES } from "@/bootstrap/container-types";
import { ensureRelationship } from "@/features/platform/consumers/syncRelationship";
import type { IAuthorizationGraphProvider } from "@/integrations/authorization";

@injectable()
export class AuthorizationTenantRelationSyncConsumer extends Consumer<
  CloudEvent<TenantRelationCreatedData>
> {
  readonly stream = Streams.PLATFORM;
  readonly consumer = "authorization-tenant-relation-sync";
  readonly subjects = [TenantRelationCreatedEvent.type];

  constructor(
    @inject(TYPES.Broker)
    private readonly broker: IBroker,
    @inject(TYPES.AuthorizationGraphProvider)
    private readonly authorizationGraphProvider: IAuthorizationGraphProvider,
  ) {
    super(broker);
  }

  async onMessage(message: JsMsg, payload: CloudEvent<TenantRelationCreatedData>): Promise<void> {
    if (payload.type !== TenantRelationCreatedEvent.type) {
      message.ack();
      return;
    }

    const event = validateEvent(TenantRelationCreatedEvent, payload);
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

  private relationshipFor(data: TenantRelationCreatedData): GraphRelationship | undefined {
    if (data.relation === "owners") {
      return relationship({
        object: { namespace: "Tenant", id: data.tenantId },
        relation: "owners",
        subject: { namespace: "Identity", id: data.identityId },
      });
    }
    if (data.relation === "admins") {
      return relationship({
        object: { namespace: "Tenant", id: data.tenantId },
        relation: "admins",
        subject: { namespace: "Identity", id: data.identityId },
      });
    }
    if (data.relation === "members") {
      return relationship({
        object: { namespace: "Tenant", id: data.tenantId },
        relation: "members",
        subject: { namespace: "Identity", id: data.identityId },
      });
    }
    return undefined;
  }
}
