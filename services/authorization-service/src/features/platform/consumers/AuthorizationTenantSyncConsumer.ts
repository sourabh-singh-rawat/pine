import {
  platformTenantRelationship,
  tenantPlatformRelationship,
  type GraphRelationship,
} from "@pine/authorization";
import {
  type CloudEvent,
  type IBroker,
  type TenantCreatedData,
  type TenantDeletedData,
  Consumer,
  TenantCreatedEvent,
  TenantDeletedEvent,
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
export class AuthorizationTenantSyncConsumer extends Consumer<
  CloudEvent<TenantCreatedData | TenantDeletedData>
> {
  readonly stream = Streams.PLATFORM;
  readonly consumer = "authorization-tenant-sync";
  readonly subjects = [TenantCreatedEvent.type, TenantDeletedEvent.type];

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
    payload: CloudEvent<TenantCreatedData | TenantDeletedData>,
  ): Promise<void> {
    if (payload.type === TenantCreatedEvent.type) {
      const event = validateEvent(TenantCreatedEvent, payload);
      const data = event.data;
      if (!data) {
        message.ack();
        return;
      }

      for (const relationship of this.tenantGraph(data.id)) {
        await ensureRelationship(this.authorizationGraphProvider, relationship);
      }
      message.ack();
      return;
    }

    if (payload.type === TenantDeletedEvent.type) {
      const event = validateEvent(TenantDeletedEvent, payload);
      const data = event.data;
      if (!data) {
        message.ack();
        return;
      }

      for (const relationship of this.tenantGraph(data.id)) {
        await removeRelationship(this.authorizationGraphProvider, relationship);
      }
      message.ack();
      return;
    }

    message.ack();
  }

  private tenantGraph(tenantId: string): GraphRelationship[] {
    return [platformTenantRelationship(tenantId), tenantPlatformRelationship(tenantId)];
  }
}
