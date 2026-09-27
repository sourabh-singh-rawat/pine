import {
  type CloudEvent,
  type IBroker,
  type IdentityEmailVerifiedData,
  type ProfileCreatedData,
  type ProfileNameUpdatedData,
  Streams,
  Consumer,
  IdentityEmailVerifiedEvent,
  ProfileCreatedEvent,
  ProfileNameUpdatedEvent,
  validateEvent,
} from "@pine/events";
import { inject, injectable } from "inversify";
import type { JsMsg } from "nats";
import { TYPES } from "@/bootstrap/container-types";
import type { Database } from "@/db";
import type { IAuditLogRepository } from "@/features/audit";
import type { IIdentityRepository } from "@/features/identities/repositories";

type IdentityNameFields = {
  fullName?: string | null;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
};

const resolveIdentityNames = (data: IdentityNameFields) => {
  const nameParts = (data.displayName ?? data.fullName ?? "").trim().split(/\s+/);
  const fallbackFirstName = nameParts[0] || null;
  const fallbackLastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;

  const firstName = data.firstName ?? fallbackFirstName;
  const middleName = data.middleName ?? null;
  const lastName = data.lastName ?? fallbackLastName;
  const fullName = data.fullName ?? data.displayName ?? null;

  return { fullName, firstName, middleName, lastName };
};

@injectable()
export class AuditIdentitySyncConsumer extends Consumer<
  CloudEvent<IdentityEmailVerifiedData | ProfileCreatedData | ProfileNameUpdatedData>
> {
  readonly stream = Streams.IDENTITY;
  readonly consumer = "audit-identity-sync";
  readonly subjects = [
    IdentityEmailVerifiedEvent.type,
    ProfileCreatedEvent.type,
    ProfileNameUpdatedEvent.type,
  ];

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
    payload: CloudEvent<IdentityEmailVerifiedData | ProfileCreatedData | ProfileNameUpdatedData>,
  ): Promise<void> => {
    if (payload.type === IdentityEmailVerifiedEvent.type) {
      const event = validateEvent(IdentityEmailVerifiedEvent, payload);
      const data = event.data;
      if (!data) {
        message.ack();
        return;
      }

      const names = resolveIdentityNames(data);

      await this.db.transaction(async (tx) => {
        await this.identityRepository.upsert(
          {
            identityId: data.userId,
            ...names,
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
      return;
    }

    if (payload.type === ProfileCreatedEvent.type) {
      const event = validateEvent(ProfileCreatedEvent, payload);
      const data = event.data;
      if (!data) {
        message.ack();
        return;
      }

      const names = resolveIdentityNames(data);

      await this.identityRepository.upsert({
        identityId: data.identityId,
        ...names,
      });

      message.ack();
      return;
    }

    if (payload.type === ProfileNameUpdatedEvent.type) {
      const event = validateEvent(ProfileNameUpdatedEvent, payload);
      const data = event.data;
      if (!data) {
        message.ack();
        return;
      }

      const names = resolveIdentityNames(data);

      await this.identityRepository.upsert({
        identityId: data.identityId,
        ...names,
      });

      message.ack();
    }
  };
}
