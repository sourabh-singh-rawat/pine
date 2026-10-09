import {
  type CloudEvent,
  type IBroker,
  type OrganizationCreatedData,
  Streams,
  Consumer,
  OrganizationCreatedEvent,
  validateEvent,
} from "@pine/events";
import { inject, injectable } from "inversify";
import type { JsMsg } from "nats";
import { TYPES } from "@/bootstrap/container-types";
import type { Database } from "@/db";
import type { IAuditLogRepository } from "@/features/audit";
import type { IOrganizationRepository } from "@/features/organizations/repositories";

@injectable()
export class AuditPlatformSyncConsumer extends Consumer<CloudEvent<OrganizationCreatedData>> {
  readonly stream = Streams.PLATFORM;
  readonly consumer = "audit-platform-sync";
  readonly subjects = [OrganizationCreatedEvent.type];

  constructor(
    @inject(TYPES.Broker)
    broker: IBroker,
    @inject(TYPES.Database)
    private readonly db: Database,
    @inject(TYPES.OrganizationRepository)
    private readonly organizationRepository: IOrganizationRepository,
    @inject(TYPES.AuditLogRepository)
    private readonly auditLogRepository: IAuditLogRepository,
  ) {
    super(broker);
  }

  onMessage = async (
    message: JsMsg,
    payload: CloudEvent<OrganizationCreatedData>,
  ): Promise<void> => {
    if (payload.type === OrganizationCreatedEvent.type) {
      const event = validateEvent(OrganizationCreatedEvent, payload);
      const data = event.data;
      if (!data) {
        message.ack();
        return;
      }

      await this.db.transaction(async (tx) => {
        await this.organizationRepository.upsert(
          {
            id: data.id,
            tenantId: data.tenantId,
            name: data.name,
            slug: data.slug,
          },
          { tx },
        );
        await this.auditLogRepository.save(
          {
            entityType: "organization",
            entityId: data.id,
            action: "created",
            organizationId: data.id,
            tenantId: data.tenantId,
            payload: { ...data },
          },
          { tx },
        );
      });

      message.ack();
    }
  };
}
