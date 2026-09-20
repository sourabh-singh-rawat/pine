import {
  type CloudEvent,
  type IBroker,
  type IssueCreatedData,
  type SpaceData,
  Streams,
  Consumer,
  IssueCreatedEvent,
  SpaceCreatedEvent,
  validateEvent,
} from "@pine/events";
import { inject, injectable } from "inversify";
import type { JsMsg } from "nats";
import { TYPES } from "@/bootstrap/container-types";
import type { Database } from "@/db";
import type { IAuditLogRepository } from "@/features/audit";
import type { IItemRepository } from "@/features/items/repositories";
import type { ISpaceRepository } from "@/features/spaces/repositories";

@injectable()
export class AuditIssuesSyncConsumer extends Consumer<CloudEvent<IssueCreatedData | SpaceData>> {
  readonly stream = Streams.ISSUES;
  readonly consumer = "audit-issues-sync";
  readonly subjects = [IssueCreatedEvent.type, SpaceCreatedEvent.type];

  constructor(
    @inject(TYPES.Broker)
    broker: IBroker,
    @inject(TYPES.Database)
    private readonly db: Database,
    @inject(TYPES.ItemRepository)
    private readonly itemRepository: IItemRepository,
    @inject(TYPES.SpaceRepository)
    private readonly spaceRepository: ISpaceRepository,
    @inject(TYPES.AuditLogRepository)
    private readonly auditLogRepository: IAuditLogRepository,
  ) {
    super(broker.client);
  }

  onMessage = async (
    message: JsMsg,
    payload: CloudEvent<IssueCreatedData | SpaceData>,
  ): Promise<void> => {
    if (payload.type === IssueCreatedEvent.type) {
      const event = validateEvent(IssueCreatedEvent, payload);
      const data = event.data;
      if (!data) {
        message.ack();
        return;
      }

      await this.db.transaction(async (tx) => {
        await this.itemRepository.upsert(
          {
            id: data.id,
            name: data.name,
            type: "issue",
            projectId: data.projectId,
            createdById: data.ownerId,
          },
          { tx },
        );
        await this.auditLogRepository.save(
          {
            entityType: "item",
            entityId: data.id,
            action: "created",
            actorId: data.ownerId,
            payload: { ...data },
          },
          { tx },
        );
      });

      message.ack();
      return;
    }

    if (payload.type === SpaceCreatedEvent.type) {
      const event = validateEvent(SpaceCreatedEvent, payload);
      const data = event.data;
      if (!data) {
        message.ack();
        return;
      }

      await this.db.transaction(async (tx) => {
        await this.spaceRepository.upsert(
          {
            id: data.id,
            workspaceId: data.workspaceId,
            name: data.name,
            createdById: data.createdById,
          },
          { tx },
        );
        await this.auditLogRepository.save(
          {
            entityType: "space",
            entityId: data.id,
            action: "created",
            actorId: data.createdById,
            workspaceId: data.workspaceId,
            payload: { ...data },
          },
          { tx },
        );
      });

      message.ack();
    }
  };
}
