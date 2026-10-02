import {
  type CloudEvent,
  type IBroker,
  type TenantCreatedData,
  type TenantDeletedData,
  Consumer,
  Streams,
  TenantCreatedEvent,
  TenantDeletedEvent,
  validateEvent,
} from "@pine/events";
import { inject, injectable } from "inversify";
import type { JsMsg } from "nats";
import { TYPES } from "@/bootstrap/container-types";
import type { Database } from "@/db";
import type { ITenantRepository } from "@/features/tenants/repositories";

@injectable()
export class AttachmentTenantSyncConsumer extends Consumer<
  CloudEvent<TenantCreatedData | TenantDeletedData>
> {
  readonly stream = Streams.PLATFORM;
  readonly consumer = "attachment-tenant-sync";
  readonly subjects = [TenantCreatedEvent.type, TenantDeletedEvent.type];

  constructor(
    @inject(TYPES.Broker)
    private readonly broker: IBroker,
    @inject(TYPES.Database)
    private readonly db: Database,
    @inject(TYPES.TenantRepository)
    private readonly tenantRepository: ITenantRepository,
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

      await this.db.transaction(async (tx) => {
        const exists = await this.tenantRepository.existsById(data.id, { tx });
        if (exists) {
          return;
        }

        await this.tenantRepository.save(
          {
            id: data.id,
            name: data.name,
            slug: data.slug,
            isActive: data.isActive,
          },
          { tx },
        );
      });

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

      await this.db.transaction(async (tx) => {
        const exists = await this.tenantRepository.existsById(data.id, { tx });
        if (!exists) {
          return;
        }

        await this.tenantRepository.deactivate(data.id, { tx });
      });

      message.ack();
      return;
    }

    message.ack();
  }
}
