import { requirePermission, type IAuthorizationClient } from "@pine/authorization";
import { UserProfileAlreadyExistsError, UserProfileNotFoundError } from "@pine/common";
import {
  createCloudEvent,
  ProfileCreatedEvent,
  ProfileDeletedEvent,
  ProfileGenderUpdatedEvent,
  ProfileNameUpdatedEvent,
  ProfilePhotoUpdatedEvent,
} from "@pine/events";
import type { IOutboxService } from "@pine/outbox";
import { inject, injectable } from "inversify";
import { env } from "@/bootstrap/env";
import { TYPES } from "@/bootstrap/container-types";
import type { Database, DbClient, Profile } from "@/db";
import { PROFILE_PHOTO_MAX_BYTES, profilePhotoContentType } from "@/features/profiles/constants";
import { InvalidProfilePhotoError, ProfilePhotoNotFoundError } from "@/features/profiles/errors";
import type { IProfileRepository } from "@/features/profiles/repositories/IProfileRepository";
import type {
  CreateProfileOptions,
  DeleteProfileOptions,
  IProfileService,
  UpdateGenderOptions,
  UpdateNameOptions,
  UploadProfilePhotoOptions,
} from "@/features/profiles/services/IProfileService";
import type { IProfilePhotoStorage, ProfilePhotoObject } from "@/integrations/storage";

const profilePhotoUrl = (identityId: string): string => {
  const base = env.API_PUBLIC_URL.replace(/\/$/, "");
  return `${base}/identity/profiles/${identityId}/photo?v=${Date.now()}`;
};

const buildFullName = (
  firstName?: string | null,
  middleName?: string | null,
  lastName?: string | null,
): string | null => {
  const parts: string[] = [];
  for (const part of [firstName, middleName, lastName]) {
    const trimmed = part?.trim();
    if (trimmed) {
      parts.push(trimmed);
    }
  }
  if (parts.length === 0) {
    return null;
  }
  return parts.join(" ");
};

@injectable()
export class ProfileService implements IProfileService {
  constructor(
    @inject(TYPES.ProfileRepository)
    private readonly profileRepository: IProfileRepository,
    @inject(TYPES.AuthorizationClient)
    private readonly authorizationClient: IAuthorizationClient,
    @inject(TYPES.ProfilePhotoStorage)
    private readonly profilePhotoStorage: IProfilePhotoStorage,
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

      const fullName = buildFullName(profile.firstName, profile.middleName, profile.lastName);

      const event = createCloudEvent({
        type: ProfileCreatedEvent.type,
        version: ProfileCreatedEvent.version,
        schema: ProfileCreatedEvent.schema,
        source: "pine/identity-service",
        subject: profile.id,
        data: {
          id: profile.id,
          identityId,
          ...(fullName ? { fullName } : {}),
          ...(profile.firstName ? { firstName: profile.firstName } : {}),
          ...(profile.middleName ? { middleName: profile.middleName } : {}),
          ...(profile.lastName ? { lastName: profile.lastName } : {}),
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
        object: { namespace: "Profile", id: profile.id },
        relation: "identity",
        subject: { namespace: "Identity", id: identityId },
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
      `Profile:${profile.id}`,
    );

    return this.db.transaction(async (tx) => {
      const updated = await this.profileRepository.update(
        profile.id,
        {
          firstName: options.firstName,
          middleName: options.middleName ?? null,
          lastName: options.lastName ?? null,
        },
        { tx },
      );

      const fullName = buildFullName(updated.firstName, updated.middleName, updated.lastName);

      const event = createCloudEvent({
        type: ProfileNameUpdatedEvent.type,
        version: ProfileNameUpdatedEvent.version,
        schema: ProfileNameUpdatedEvent.schema,
        source: "pine/identity-service",
        subject: updated.id,
        data: {
          id: updated.id,
          identityId: options.identityId,
          ...(fullName ? { fullName } : {}),
          ...(updated.firstName ? { firstName: updated.firstName } : {}),
          ...(updated.middleName ? { middleName: updated.middleName } : {}),
          ...(updated.lastName ? { lastName: updated.lastName } : {}),
        },
      });

      await this.outboxService.schedule(
        {
          eventId: event.id,
          eventType: event.type,
          eventVersion: ProfileNameUpdatedEvent.version,
          aggregateType: "profile",
          aggregateId: updated.id,
          payload: event,
        },
        { tx },
      );

      return updated;
    });
  }

  async updateGender(options: UpdateGenderOptions): Promise<Profile> {
    const profile = await this.profileRepository.findByIdentityId(options.identityId);
    if (!profile) throw new UserProfileNotFoundError();

    await requirePermission(
      this.authorizationClient,
      options.identityId,
      "update",
      `Profile:${profile.id}`,
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

  async uploadPhoto(options: UploadProfilePhotoOptions): Promise<Profile> {
    const profile = await this.profileRepository.findByIdentityId(options.identityId);
    if (!profile) throw new UserProfileNotFoundError();

    await requirePermission(
      this.authorizationClient,
      options.identityId,
      "update",
      `Profile:${profile.id}`,
    );

    const contentType = profilePhotoContentType(options.contentType);
    if (!contentType) {
      throw new InvalidProfilePhotoError("Profile photo must be a JPEG, PNG, or WebP image");
    }

    if (options.body.byteLength === 0 || options.body.byteLength > PROFILE_PHOTO_MAX_BYTES) {
      throw new InvalidProfilePhotoError("Profile photo must be a non-empty image under 5 MB");
    }

    await this.profilePhotoStorage.putProfilePhoto({
      identityId: options.identityId,
      contentType,
      body: options.body,
    });

    const photoUrl = profilePhotoUrl(options.identityId);

    return this.db.transaction(async (tx) => {
      const updated = await this.profileRepository.update(profile.id, { photoUrl }, { tx });

      const event = createCloudEvent({
        type: ProfilePhotoUpdatedEvent.type,
        version: ProfilePhotoUpdatedEvent.version,
        schema: ProfilePhotoUpdatedEvent.schema,
        source: "pine/identity-service",
        subject: updated.id,
        data: {
          id: updated.id,
          identityId: options.identityId,
          photoUrl,
        },
      });

      await this.outboxService.schedule(
        {
          eventId: event.id,
          eventType: event.type,
          eventVersion: ProfilePhotoUpdatedEvent.version,
          aggregateType: "profile",
          aggregateId: updated.id,
          payload: event,
        },
        { tx },
      );

      return updated;
    });
  }

  async getProfilePhoto(identityId: string): Promise<ProfilePhotoObject> {
    const profile = await this.profileRepository.findByIdentityId(identityId);
    if (!profile?.photoUrl) throw new ProfilePhotoNotFoundError();

    const stored = await this.profilePhotoStorage.getProfilePhoto(identityId);
    if (!stored) throw new ProfilePhotoNotFoundError();

    return stored;
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
}
