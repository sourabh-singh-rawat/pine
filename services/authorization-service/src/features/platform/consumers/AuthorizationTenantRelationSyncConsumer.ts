import {
  ADMIN,
  MEMBER,
  OWNER,
  tenantAdminRelationship,
  tenantMemberRelationship,
  tenantOwnerRelationship,
  type GraphRelationship,
} from "@pine/authorization";
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
    if (data.relation === OWNER) {
      return tenantOwnerRelationship(data.tenantId, data.identityId);
    }
    if (data.relation === ADMIN) {
      return tenantAdminRelationship(data.tenantId, data.identityId);
    }
    if (data.relation === MEMBER) {
      return tenantMemberRelationship(data.tenantId, data.identityId);
    }
    return undefined;
  }
}
