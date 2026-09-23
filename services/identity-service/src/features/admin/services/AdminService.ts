import { EMAIL_VERIFICATION_STATUS, UserNotFoundError } from "@pine/common";
import {
  createCloudEvent,
  IdentityEmailVerifiedEvent,
  UserRegisteredEvent,
} from "@pine/events";
import type { IOutboxService } from "@pine/outbox";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import type { Database } from "@/db";
import { IAdminService, type CreateIdentityOptions } from "@/features/admin/services/IAdminService";
import { IdentityProviderType } from "@/features/identities/constants";
import {
  type PublicIdentity,
  toPublicIdentity,
} from "@/features/identities/services/IIdentityService";
import type { IIdentityRepository } from "@/features/identities/repositories/IIdentityRepository";
import type { IProfileService } from "@/features/profiles/services/IProfileService";
import type { IIdentityAdminProvider } from "@/integrations/identity";

@injectable()
export class AdminService implements IAdminService {
  constructor(
    @inject(TYPES.IdentityRepository)
    private readonly identityRepository: IIdentityRepository,
    @inject(TYPES.ProfileService)
    private readonly profileService: IProfileService,
    @inject(TYPES.IdentityAdminProvider)
    private readonly identityAdminProvider: IIdentityAdminProvider,
    @inject(TYPES.OutboxService)
    private readonly outboxService: IOutboxService,
    @inject(TYPES.Database)
    private readonly db: Database,
  ) {}

  async createIdentity(options: CreateIdentityOptions): Promise<PublicIdentity> {
    const idpIdentity = await this.identityAdminProvider.createIdentity({
      email: options.email,
      username: options.username,
      password: options.password,
      emailVerified: options.emailVerified,
    });

    try {
      return await this.db.transaction(async (tx) => {
        const identity = await this.identityRepository.save(
          {
            idpId: idpIdentity.id,
            idpProvider: IdentityProviderType.KRATOS,
          },
          { tx },
        );

        await this.profileService.create({
          tx,
          identityId: identity.id,
          firstName: options.firstName,
          middleName: options.middleName,
          lastName: options.lastName,
        });

        const registeredEvent = createCloudEvent({
          type: UserRegisteredEvent.type,
          version: UserRegisteredEvent.version,
          schema: UserRegisteredEvent.schema,
          source: "pine/identity-service",
          subject: identity.id,
          data: {
            userId: identity.id,
          },
        });

        await this.outboxService.schedule(
          {
            eventId: registeredEvent.id,
            eventType: registeredEvent.type,
            eventVersion: UserRegisteredEvent.version,
            aggregateType: "identity",
            aggregateId: identity.id,
            payload: registeredEvent,
          },
          { tx },
        );

        if (options.emailVerified) {
          const displayName = [options.firstName, options.middleName, options.lastName]
            .filter(Boolean)
            .join(" ");

          const verifiedEvent = createCloudEvent({
            type: IdentityEmailVerifiedEvent.type,
            version: IdentityEmailVerifiedEvent.version,
            schema: IdentityEmailVerifiedEvent.schema,
            source: "pine/identity-service",
            subject: identity.id,
            data: {
              emailVerificationStatus: EMAIL_VERIFICATION_STATUS.VERIFIED,
              userId: identity.id,
              ...(displayName ? { displayName } : {}),
            },
          });

          await this.outboxService.schedule(
            {
              eventId: verifiedEvent.id,
              eventType: verifiedEvent.type,
              eventVersion: IdentityEmailVerifiedEvent.version,
              aggregateType: "identity",
              aggregateId: identity.id,
              payload: verifiedEvent,
            },
            { tx },
          );
        }

        return toPublicIdentity(identity);
      });
    } catch (error) {
      await this.identityAdminProvider.deleteIdentity(idpIdentity.id);
      throw error;
    }
  }

  async deleteIdentity(identityId: string): Promise<void> {
    const identity = await this.identityRepository.findById(identityId);
    if (!identity) throw new UserNotFoundError();

    await this.identityAdminProvider.deleteIdentity(identity.idpId);

    await this.db.transaction(async (tx) => {
      await this.profileService.delete({ tx, identityId });
      await this.identityRepository.softDelete(identityId, { tx });
    });
  }

  async findIdentities(): Promise<PublicIdentity[]> {
    const identities = await this.identityRepository.findAll();
    return identities.map(toPublicIdentity);
  }
}
