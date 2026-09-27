import {
  type CloudEvent,
  type IBroker,
  type IdentityEmailVerifiedData,
  Streams,
  Consumer,
  IdentityEmailVerifiedEvent,
  validateEvent,
} from "@pine/events";
import { inject, injectable } from "inversify";
import type { JsMsg } from "nats";
import { TYPES } from "@/bootstrap/container-types";
import type { Database } from "@/db";
import type { IAuditLogRepository } from "@/features/audit";
import type { IIdentityRepository } from "@/features/identities/repositories";

@injectable()
export class AuditIdentitySyncConsumer extends Consumer<CloudEvent<IdentityEmailVerifiedData>> {
  readonly stream = Streams.IDENTITY;
  readonly consumer = "audit-identity-sync";
  readonly subjects = [IdentityEmailVerifiedEvent.type];

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
    payload: CloudEvent<IdentityEmailVerifiedData>,
  ): Promise<void> => {
    const event = validateEvent(IdentityEmailVerifiedEvent, payload);
    const data = event.data;
    if (!data) {
      message.ack();
      return;
    }

    const nameParts = (data.displayName ?? "").trim().split(/\s+/);
    const fallbackFirstName = nameParts[0] || null;
    const fallbackLastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;

    const firstName = data.firstName ?? fallbackFirstName;
    const middleName = data.middleName ?? null;
    const lastName = data.lastName ?? fallbackLastName;

    const fullName = data.fullName ?? data.displayName ?? null;

    await this.db.transaction(async (tx) => {
      await this.identityRepository.upsert(
        {
          identityId: data.userId,
          fullName,
          firstName,
          middleName,
          lastName,
        },
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
  };
}
