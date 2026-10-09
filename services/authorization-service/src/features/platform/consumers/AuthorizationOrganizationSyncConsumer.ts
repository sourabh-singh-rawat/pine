import {
  organizationParentsRelationship,
  organizationTenantRelationship,
  type GraphRelationship,
} from "@pine/authorization";
import {
  type CloudEvent,
  type IBroker,
  type OrganizationCreatedData,
  type OrganizationDeletedData,
  type OrganizationUpdatedData,
  Consumer,
  OrganizationCreatedEvent,
  OrganizationDeletedEvent,
  OrganizationUpdatedEvent,
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
export class AuthorizationOrganizationSyncConsumer extends Consumer<
  CloudEvent<OrganizationCreatedData | OrganizationUpdatedData | OrganizationDeletedData>
> {
  readonly stream = Streams.PLATFORM;
  readonly consumer = "authorization-organization-sync";
  readonly subjects = [
    OrganizationCreatedEvent.type,
    OrganizationUpdatedEvent.type,
    OrganizationDeletedEvent.type,
  ];

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
    payload: CloudEvent<
      OrganizationCreatedData | OrganizationUpdatedData | OrganizationDeletedData
    >,
  ): Promise<void> {
    if (payload.type === OrganizationCreatedEvent.type) {
      const event = validateEvent(OrganizationCreatedEvent, payload);
      const data = event.data;
      if (!data) {
        message.ack();
        return;
      }

      for (const relationship of this.createdGraph(data)) {
        await ensureRelationship(this.authorizationGraphProvider, relationship);
      }
      message.ack();
      return;
    }

    if (payload.type === OrganizationUpdatedEvent.type) {
      const event = validateEvent(OrganizationUpdatedEvent, payload);
      const data = event.data;
      if (!data) {
        message.ack();
        return;
      }

      if (data.previousParentOrganizationId) {
        await removeRelationship(
          this.authorizationGraphProvider,
          organizationParentsRelationship(data.id, data.previousParentOrganizationId),
        );
      }

      if (data.parentOrganizationId) {
        await ensureRelationship(
          this.authorizationGraphProvider,
          organizationParentsRelationship(data.id, data.parentOrganizationId),
        );
      }

      message.ack();
      return;
    }

    if (payload.type === OrganizationDeletedEvent.type) {
      const event = validateEvent(OrganizationDeletedEvent, payload);
      const data = event.data;
      if (!data) {
        message.ack();
        return;
      }

      for (const relationship of this.deletedGraph(data)) {
        await removeRelationship(this.authorizationGraphProvider, relationship);
      }
      message.ack();
      return;
    }

    message.ack();
  }

  private createdGraph(data: OrganizationCreatedData): GraphRelationship[] {
    const relationships: GraphRelationship[] = [
      organizationTenantRelationship(data.id, data.tenantId),
    ];

    if (data.parentOrganizationId) {
      relationships.push(organizationParentsRelationship(data.id, data.parentOrganizationId));
    }

    return relationships;
  }

  private deletedGraph(data: OrganizationDeletedData): GraphRelationship[] {
    const relationships: GraphRelationship[] = [
      organizationTenantRelationship(data.id, data.tenantId),
    ];

    if (data.parentOrganizationId) {
      relationships.push(organizationParentsRelationship(data.id, data.parentOrganizationId));
    }

    return relationships;
  }
}
