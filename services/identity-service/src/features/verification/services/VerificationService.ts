import { EMAIL_VERIFICATION_STATUS } from "@pine/common";
import { createCloudEvent, IdentityEmailVerifiedEvent } from "@pine/events";
import type { IOutboxService } from "@pine/outbox";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import type { IIdentityService } from "@/features/identities/services/IIdentityService";
import type { IProfileRepository } from "@/features/profiles/repositories/IProfileRepository";
import type {
  IVerificationService,
  ResendVerificationEmailInput,
  VerifyEmailInput,
} from "@/features/verification/services/IVerificationService";
import {
  IdentityProviderUnavailableError,
  type IVerificationProvider,
} from "@/integrations/identity";

@injectable()
export class VerificationService implements IVerificationService {
  constructor(
    @inject(TYPES.VerificationProvider)
    private readonly verificationProvider: IVerificationProvider,
    @inject(TYPES.IdentityService)
    private readonly identityService: IIdentityService,
    @inject(TYPES.ProfileRepository)
    private readonly profileRepository: IProfileRepository,
    @inject(TYPES.OutboxService)
    private readonly outboxService: IOutboxService,
  ) {}

  async verifyEmail(input: VerifyEmailInput): Promise<void> {
    const idpIdentity = await this.verificationProvider.verifyEmail({
      flowId: input.flowId,
      code: input.code,
    });

    const identityId = await this.identityService.getIdByExternalId(idpIdentity.id);

    const profile = await this.profileRepository.findByIdentityId(identityId);
    const displayName = profile
      ? [profile.firstName, profile.middleName, profile.lastName].filter(Boolean).join(" ")
      : undefined;

    const event = createCloudEvent({
      type: IdentityEmailVerifiedEvent.type,
      version: IdentityEmailVerifiedEvent.version,
      schema: IdentityEmailVerifiedEvent.schema,
      source: "pine/identity-service",
      subject: identityId,
      data: {
        emailVerificationStatus: EMAIL_VERIFICATION_STATUS.VERIFIED,
        userId: identityId,
        ...(displayName ? { displayName, fullName: displayName } : {}),
        ...(profile?.firstName ? { firstName: profile.firstName } : {}),
        ...(profile?.middleName ? { middleName: profile.middleName } : {}),
        ...(profile?.lastName ? { lastName: profile.lastName } : {}),
        ...(profile?.photoUrl ? { photoUrl: profile.photoUrl } : {}),
      },
    });

    await this.outboxService.schedule({
      eventId: event.id,
      eventType: event.type,
      eventVersion: IdentityEmailVerifiedEvent.version,
      aggregateType: "identity",
      aggregateId: identityId,
      payload: event,
    });
  }

  async resendVerificationEmail(input: ResendVerificationEmailInput): Promise<void> {
    try {
      await this.verificationProvider.resendVerificationEmail({
        email: input.email,
      });
    } catch (error) {
      if (error instanceof IdentityProviderUnavailableError) {
        throw error;
      }
    }
  }
}
