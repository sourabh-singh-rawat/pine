import { organizationTenantRelationship, type GraphRelationship } from "@pine/authorization";
import {
  type CloudEvent,
  type IBroker,
  type OrganizationCreatedData,
  Consumer,
  OrganizationCreatedEvent,
  Streams,
  validateEvent,
} from "@pine/events";
import { inject, injectable } from "inversify";
import type { JsMsg } from "nats";
import { TYPES } from "@/bootstrap/container-types";
import { ensureRelationship } from "@/features/platform/consumers/syncRelationship";
import type { IAuthorizationGraphProvider } from "@/integrations/authorization";

@injectable()
export class AuthorizationOrganizationSyncConsumer extends Consumer<
  CloudEvent<OrganizationCreatedData>
> {
  readonly stream = Streams.PLATFORM;
  readonly consumer = "authorization-organization-sync";
  readonly subjects = [OrganizationCreatedEvent.type];

  constructor(
    @inject(TYPES.Broker)
    private readonly broker: IBroker,
    @inject(TYPES.AuthorizationGraphProvider)
    private readonly authorizationGraphProvider: IAuthorizationGraphProvider,
  ) {
    super(broker);
  }

  async onMessage(message: JsMsg, payload: CloudEvent<OrganizationCreatedData>): Promise<void> {
    if (payload.type !== OrganizationCreatedEvent.type) {
      message.ack();
      return;
    }

    const event = validateEvent(OrganizationCreatedEvent, payload);
    const data = event.data;
    if (!data) {
      message.ack();
      return;
    }

    const relationship: GraphRelationship = organizationTenantRelationship(data.id, data.tenantId);
    await ensureRelationship(this.authorizationGraphProvider, relationship);
    message.ack();
  }
}
