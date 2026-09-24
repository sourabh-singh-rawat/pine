import {
  type CloudEvent,
  type IBroker,
  type IdentityEmailVerifiedData,
  type UserRegisteredData,
  Streams,
  Consumer,
  IdentityEmailVerifiedEvent,
  UserRegisteredEvent,
  validateEvent,
} from "@pine/events";
import { inject, injectable } from "inversify";
import type { JsMsg } from "nats";
import { TYPES } from "@/bootstrap/container-types";
import type { Database } from "@/db";
import type { IAuditLogRepository } from "@/features/audit";
import type { IIdentityRepository } from "@/features/identities/repositories";

@injectable()
export class AuditIdentitySyncConsumer extends Consumer<
  CloudEvent<UserRegisteredData | IdentityEmailVerifiedData>
> {
  readonly stream = Streams.IDENTITY;
  readonly consumer = "audit-identity-sync";
  readonly subjects = [UserRegisteredEvent.type, IdentityEmailVerifiedEvent.type];

  constructor(
    @inject(TYPES.Broker)
    broker: IBroker,
    @inject(TYPES.Database)
    private readonly db: Database,
    @inject(TYPES.IdentityRepository)
    private readonly identityRepository: IIdentityRepository,
    @inject(TYPES.AuditLogRepository)
    private readonly auditLogRepository: IAuditLogRepository,
  ) {
    super(broker.client);
  }

  onMessage = async (
    message: JsMsg,
    payload: CloudEvent<UserRegisteredData | IdentityEmailVerifiedData>,
  ): Promise<void> => {
    if (payload.type === UserRegisteredEvent.type) {
      const event = validateEvent(UserRegisteredEvent, payload);
      const data = event.data;
      if (!data) {
        message.ack();
        return;
      }

      await this.db.transaction(async (tx) => {
        await this.auditLogRepository.save(
          {
            entityType: "identity",
            entityId: data.userId,
            action: "registered",
            actorId: data.userId,
            payload: { ...data },
          },
          { tx },
        );
      });

      message.ack();
      return;
    }

    if (payload.type === IdentityEmailVerifiedEvent.type) {
      const event = validateEvent(IdentityEmailVerifiedEvent, payload);
      const data = event.data;
      if (!data) {
        message.ack();
        return;
      }

      await this.db.transaction(async (tx) => {
        await this.identityRepository.upsert(
          { id: data.userId, displayName: data.displayName ?? null },
          { tx },
        );
        await this.auditLogRepository.save(
          {
            entityType: "identity",
            entityId: data.userId,
            action: "email_verified",
            actorId: data.userId,
            payload: { ...data },
          },
          { tx },
        );
      });

      message.ack();
    }
  };
}
