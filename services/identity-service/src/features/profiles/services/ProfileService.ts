import { ATTACHMENT_SCOPE_TYPE, type IAttachmentClient } from "@pine/attachment";
import { requirePermission, type IAuthorizationClient } from "@pine/authorization";
import { UserProfileAlreadyExistsError, UserProfileNotFoundError } from "@pine/common";
import {
  createCloudEvent,
  ProfileCreatedEvent,
  ProfileDeletedEvent,
  ProfileGenderUpdatedEvent,
} from "@pine/events";
import type { IOutboxService } from "@pine/outbox";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import type { Database, DbClient, Profile } from "@/db";
import type { IProfilePhotoUploadRequestRepository } from "@/features/profiles/repositories/IProfilePhotoUploadRequestRepository";
import type { IProfileRepository } from "@/features/profiles/repositories/IProfileRepository";
import type {
  CreatePhotoUploadRequestOptions,
  CreatePhotoUploadRequestResult,
  CreateProfileOptions,
  DeleteProfileOptions,
  IProfileService,
  UpdateGenderOptions,
  UpdateNameOptions,
  UpdatePhotoOptions,
} from "@/features/profiles/services/IProfileService";

@injectable()
export class ProfileService implements IProfileService {
  constructor(
    @inject(TYPES.ProfileRepository)
    private readonly profileRepository: IProfileRepository,
    @inject(TYPES.ProfilePhotoUploadRequestRepository)
    private readonly photoUploadRequestRepository: IProfilePhotoUploadRequestRepository,
    @inject(TYPES.AuthorizationClient)
    private readonly authorizationClient: IAuthorizationClient,
    @inject(TYPES.AttachmentClient)
    private readonly attachmentClient: IAttachmentClient,
    @inject(TYPES.OutboxService)
    private readonly outboxService: IOutboxService,
    @inject(TYPES.Database)
    private readonly db: Database,
  ) {}

  async create(options: CreateProfileOptions): Promise<Profile> {
    const { firstName, middleName, lastName, identityId, description, gender } = options;
    const ownsTransaction = options.tx === undefined;

    const run = async (tx: DbClient) => {
      const existing = await this.profileRepository.findByIdentityId(identityId, { tx });
      if (existing) throw new UserProfileAlreadyExistsError();

      const profile = await this.profileRepository.save(
        { firstName, middleName, lastName, identityId, description, gender },
        { tx },
      );

      const event = createCloudEvent({
        type: ProfileCreatedEvent.type,
        version: ProfileCreatedEvent.version,
        schema: ProfileCreatedEvent.schema,
        source: "pine/identity-service",
        subject: profile.id,
        data: {
          id: profile.id,
          identityId,
        },
      });

      await this.outboxService.schedule(
        {
          eventId: event.id,
          eventType: event.type,
          eventVersion: ProfileCreatedEvent.version,
          aggregateType: "profile",
          aggregateId: profile.id,
          payload: event,
        },
        { tx },
      );

      return profile;
    };

    const profile = options.tx
      ? await run(options.tx)
      : await this.db.transaction(async (tx) => run(tx));

    if (ownsTransaction) {
      await this.authorizationClient.ensureRelationship({
        object: { namespace: "profile", id: profile.id },
        relation: "identity",
        subject: { namespace: "identity", id: identityId },
      });
    }

    return profile;
  }

  async getByIdentityId(identityId: string) {
    const profile = await this.profileRepository.findByIdentityId(identityId);
    if (!profile) throw new UserProfileNotFoundError();

    return profile;
  }

  async updateName(options: UpdateNameOptions): Promise<Profile> {
    const profile = await this.profileRepository.findByIdentityId(options.identityId);
    if (!profile) throw new UserProfileNotFoundError();

    await requirePermission(
      this.authorizationClient,
      options.identityId,
      "update",
      `profile:${profile.id}`,
    );

    return this.profileRepository.update(profile.id, {
      firstName: options.firstName,
      middleName: options.middleName ?? null,
      lastName: options.lastName ?? null,
    });
  }

  async updateGender(options: UpdateGenderOptions): Promise<Profile> {
    const profile = await this.profileRepository.findByIdentityId(options.identityId);
    if (!profile) throw new UserProfileNotFoundError();

    await requirePermission(
      this.authorizationClient,
      options.identityId,
      "update",
      `profile:${profile.id}`,
    );

    const updated = await this.profileRepository.update(profile.id, {
      gender: options.gender,
    });

    const event = createCloudEvent({
      type: ProfileGenderUpdatedEvent.type,
      version: ProfileGenderUpdatedEvent.version,
      schema: ProfileGenderUpdatedEvent.schema,
      source: "pine/identity-service",
      subject: updated.id,
      data: {
        id: updated.id,
        identityId: options.identityId,
      },
    });

    await this.outboxService.schedule({
      eventId: event.id,
      eventType: event.type,
      eventVersion: ProfileGenderUpdatedEvent.version,
      aggregateType: "profile",
      aggregateId: updated.id,
      payload: event,
    });

    return updated;
  }

  async updatePhoto(options: UpdatePhotoOptions): Promise<Profile> {
    const { identityId, photoUrl, uploadRequestId, attachmentId, tx } = options;
    const repoOptions = tx === undefined ? undefined : { tx };
    const profile = await this.profileRepository.findByIdentityId(identityId, repoOptions);
    if (!profile) throw new UserProfileNotFoundError();

    const updated = await this.profileRepository.update(profile.id, { photoUrl }, repoOptions);

    if (uploadRequestId) {
      await this.photoUploadRequestRepository.update(
        uploadRequestId,
        {
          status: "completed",
          attachmentId,
          completedAt: new Date(),
        },
        repoOptions,
      );
    }

    return updated;
  }

  async delete(options: DeleteProfileOptions): Promise<void> {
    const profile = await this.profileRepository.findByIdentityId(options.identityId, {
      tx: options.tx,
    });
    if (!profile) return;

    await this.profileRepository.softDelete(profile.id, { tx: options.tx });

    const event = createCloudEvent({
      type: ProfileDeletedEvent.type,
      version: ProfileDeletedEvent.version,
      schema: ProfileDeletedEvent.schema,
      source: "pine/identity-service",
      subject: profile.id,
      data: {
        id: profile.id,
        identityId: options.identityId,
      },
    });

    await this.outboxService.schedule(
      {
        eventId: event.id,
        eventType: event.type,
        eventVersion: ProfileDeletedEvent.version,
        aggregateType: "profile",
        aggregateId: profile.id,
        payload: event,
      },
      { tx: options.tx },
    );
  }

  async createPhotoUploadRequest(
    options: CreatePhotoUploadRequestOptions,
  ): Promise<CreatePhotoUploadRequestResult> {
    const profile = await this.profileRepository.findByIdentityId(options.identityId);
    if (!profile) throw new UserProfileNotFoundError();

    await requirePermission(
      this.authorizationClient,
      options.identityId,
      "update",
      `profile:${profile.id}`,
    );

    const requestRecord = await this.photoUploadRequestRepository.save({
      profileId: profile.id,
      status: "pending",
    });

    const uploadTarget = await this.attachmentClient.createUploadTarget({
      input: {
        scopeType: ATTACHMENT_SCOPE_TYPE.IDENTITY,
        scopeId: options.identityId,
        filename: options.filename,
        contentType: options.contentType,
        size: options.size,
        operationId: requestRecord.id,
        metadata: { profileId: profile.id, uploadRequestId: requestRecord.id },
      },
      identityId: options.identityId,
      authMethod: options.authMethod,
    });

    return {
      uploadRequestId: requestRecord.id,
      url: uploadTarget.url,
      headers: uploadTarget.headers,
      expiresAt: uploadTarget.expiresAt,
    };
  }
}
