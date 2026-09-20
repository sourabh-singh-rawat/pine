import {
  type CloudEvent,
  type IBroker,
  type WorkspaceCreatedData,
  Streams,
  Consumer,
  WorkspaceCreatedEvent,
  validateEvent,
} from "@pine/events";
import { inject, injectable } from "inversify";
import type { JsMsg } from "nats";
import { TYPES } from "@/bootstrap/container-types";
import type { Database } from "@/db";
import type { IAuditLogRepository } from "@/features/audit";
import type { IWorkspaceRepository } from "@/features/workspaces/repositories";

@injectable()
export class AuditPlatformSyncConsumer extends Consumer<CloudEvent<WorkspaceCreatedData>> {
  readonly stream = Streams.PLATFORM;
  readonly consumer = "audit-platform-sync";
  readonly subjects = [WorkspaceCreatedEvent.type];

  constructor(
    @inject(TYPES.Broker)
    broker: IBroker,
    @inject(TYPES.Database)
    private readonly db: Database,
    @inject(TYPES.WorkspaceRepository)
    private readonly workspaceRepository: IWorkspaceRepository,
    @inject(TYPES.AuditLogRepository)
    private readonly auditLogRepository: IAuditLogRepository,
  ) {
    super(broker.client);
  }

  onMessage = async (message: JsMsg, payload: CloudEvent<WorkspaceCreatedData>): Promise<void> => {
    if (payload.type === WorkspaceCreatedEvent.type) {
      const event = validateEvent(WorkspaceCreatedEvent, payload);
      const data = event.data;
      if (!data) {
        message.ack();
        return;
      }

      await this.db.transaction(async (tx) => {
        await this.workspaceRepository.upsert(
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
            entityType: "workspace",
            entityId: data.id,
            action: "created",
            workspaceId: data.id,
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
