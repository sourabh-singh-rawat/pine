import {
  type AttachmentCreatedData,
  type CloudEvent,
  type IBroker,
  Streams,
  AttachmentCreatedEvent,
  Consumer,
  validateEvent,
} from "@pine/events";
import { inject, injectable } from "inversify";
import type { JsMsg } from "nats";
import { TYPES } from "@/bootstrap/container-types";
import type { Database } from "@/db";
import type { IAttachmentRepository } from "@/features/attachments/repositories";
import type { IAuditLogRepository } from "@/features/audit";

@injectable()
export class AuditAttachmentSyncConsumer extends Consumer<CloudEvent<AttachmentCreatedData>> {
  readonly stream = Streams.ATTACHMENT;
  readonly consumer = "audit-attachment-sync";
  readonly subjects = [AttachmentCreatedEvent.type];

  constructor(
    @inject(TYPES.Broker)
    broker: IBroker,
    @inject(TYPES.Database)
    private readonly db: Database,
    @inject(TYPES.AttachmentRepository)
    private readonly attachmentRepository: IAttachmentRepository,
    @inject(TYPES.AuditLogRepository)
    private readonly auditLogRepository: IAuditLogRepository,
  ) {
    super(broker.client);
  }

  onMessage = async (message: JsMsg, payload: CloudEvent<AttachmentCreatedData>): Promise<void> => {
    if (payload.type === AttachmentCreatedEvent.type) {
      const event = validateEvent(AttachmentCreatedEvent, payload);
      const data = event.data;
      if (!data) {
        message.ack();
        return;
      }

      await this.db.transaction(async (tx) => {
        await this.attachmentRepository.upsert(
          {
            id: data.id,
            tenantId: data.tenantId ?? null,
            scopeType: data.scopeType,
            scopeId: data.scopeId,
            status: data.status,
            createdBy: data.createdBy,
          },
          { tx },
        );
        await this.auditLogRepository.save(
          {
            entityType: "attachment",
            entityId: data.id,
            action: "created",
            actorId: data.createdBy,
            tenantId: data.tenantId ?? null,
            payload: { ...data },
          },
          { tx },
        );
      });

      message.ack();
    }
  };
}
