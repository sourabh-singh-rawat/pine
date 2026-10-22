import { Readable } from "node:stream";
import { InsufficientPermissionError } from "@pine/authorization";
import { UserProfileAlreadyExistsError, UserProfileNotFoundError } from "@pine/common";
import {
  ProfileCreatedEvent,
  ProfileDeletedEvent,
  ProfileGenderUpdatedEvent,
  ProfileNameUpdatedEvent,
  ProfilePhotoUpdatedEvent,
} from "@pine/events";
import { describe, expect, it, vi } from "vitest";
import { ProfileGender } from "@/features/profiles/constants";
import { InvalidProfilePhotoError, ProfilePhotoNotFoundError } from "@/features/profiles/errors";
import { ProfileService } from "@/features/profiles/services/ProfileService";
import type { IProfilePhotoStorage } from "@/integrations/storage";

const allowAuthorizationClient = () => ({
  checkRelationship: vi.fn().mockResolvedValue(true),
  ensureRelationship: vi.fn().mockResolvedValue({ created: true }),
  deleteRelationship: vi.fn().mockResolvedValue(undefined),
  listRelationships: vi.fn().mockResolvedValue([]),
});

const createOutbox = () => ({
  schedule: vi.fn().mockResolvedValue({ id: "outbox-1" }),
});

const createProfilePhotoStorage = (
  overrides: Partial<IProfilePhotoStorage> = {},
): IProfilePhotoStorage => ({
  putProfilePhoto: vi.fn().mockResolvedValue(undefined),
  getProfilePhoto: vi.fn().mockResolvedValue(null),
  ...overrides,
});

const createDb = () => ({
  transaction: vi.fn(async (fn: (tx: object) => Promise<unknown>) => fn({})),
});

const existingProfile = {
  id: "profile-1",
  identityId: "identity-1",
  firstName: "Ada",
  middleName: null,
  lastName: "Lovelace",
  gender: null,
};

describe("ProfileService", () => {
  it("saves a profile when a transaction is provided", async () => {
    const tx = {};
    const profileRepository = {
      save: vi.fn().mockResolvedValue(existingProfile),
      findByIdentityId: vi.fn().mockResolvedValue(null),
      update: vi.fn(),
      softDelete: vi.fn(),
      existsById: vi.fn(),
      findById: vi.fn(),
    };
    const authorizationClient = allowAuthorizationClient();
    const outboxService = createOutbox();
    const db = createDb();

    const service = new ProfileService(
      profileRepository,
      authorizationClient,
      createProfilePhotoStorage(),
      outboxService,
      db,
    );

    const result = await service.create({
      tx,
      identityId: "identity-1",
      firstName: "Ada",
      lastName: "Lovelace",
    });

    expect(result).toEqual(existingProfile);
    expect(db.transaction).not.toHaveBeenCalled();
    expect(profileRepository.findByIdentityId).toHaveBeenCalledWith("identity-1", { tx });
    expect(profileRepository.save).toHaveBeenCalledWith(
      {
        firstName: "Ada",
        middleName: undefined,
        lastName: "Lovelace",
        identityId: "identity-1",
        description: undefined,
        gender: undefined,
      },
      { tx },
    );
    expect(authorizationClient.ensureRelationship).not.toHaveBeenCalled();
    expect(outboxService.schedule).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: ProfileCreatedEvent.type,
        eventVersion: ProfileCreatedEvent.version,
        aggregateType: "profile",
        aggregateId: "profile-1",
        payload: expect.objectContaining({
          type: ProfileCreatedEvent.type,
          subject: "profile-1",
          data: {
            id: "profile-1",
            identityId: "identity-1",
            fullName: "Ada Lovelace",
            firstName: "Ada",
            lastName: "Lovelace",
          },
        }),
      }),
      { tx },
    );
  });

  it("creates a profile in its own transaction and syncs authz", async () => {
    const created = { ...existingProfile, gender: ProfileGender.FEMALE };
    const profileRepository = {
      save: vi.fn().mockResolvedValue(created),
      findByIdentityId: vi.fn().mockResolvedValue(null),
      update: vi.fn(),
      softDelete: vi.fn(),
      existsById: vi.fn(),
      findById: vi.fn(),
    };
    const authorizationClient = allowAuthorizationClient();
    const outboxService = createOutbox();
    const db = createDb();

    const service = new ProfileService(
      profileRepository,
      authorizationClient,
      createProfilePhotoStorage(),
      outboxService,
      db,
    );

    const result = await service.create({
      identityId: "identity-1",
      firstName: "Ada",
      lastName: "Lovelace",
      gender: ProfileGender.FEMALE,
    });

    expect(result).toEqual(created);
    expect(db.transaction).toHaveBeenCalledOnce();
    expect(profileRepository.save).toHaveBeenCalledWith(
      {
        firstName: "Ada",
        middleName: undefined,
        lastName: "Lovelace",
        identityId: "identity-1",
        description: undefined,
        gender: ProfileGender.FEMALE,
      },
      { tx: {} },
    );
    expect(authorizationClient.ensureRelationship).toHaveBeenCalledWith({
      object: { namespace: "Profile", id: "profile-1" },
      relation: "identity",
      subject: { namespace: "Identity", id: "identity-1" },
    });
    expect(outboxService.schedule).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: ProfileCreatedEvent.type,
        aggregateId: "profile-1",
      }),
      { tx: {} },
    );
  });

  it("throws when a profile already exists for the identity", async () => {
    const profileRepository = {
      save: vi.fn(),
      findByIdentityId: vi.fn().mockResolvedValue(existingProfile),
      update: vi.fn(),
      softDelete: vi.fn(),
      existsById: vi.fn(),
      findById: vi.fn(),
    };
    const authorizationClient = allowAuthorizationClient();
    const outboxService = createOutbox();

    const service = new ProfileService(
      profileRepository,
      authorizationClient,
      createProfilePhotoStorage(),
      outboxService,
      createDb(),
    );

    await expect(
      service.create({
        identityId: "identity-1",
        firstName: "Ada",
      }),
    ).rejects.toBeInstanceOf(UserProfileAlreadyExistsError);
    expect(profileRepository.save).not.toHaveBeenCalled();
    expect(outboxService.schedule).not.toHaveBeenCalled();
    expect(authorizationClient.ensureRelationship).not.toHaveBeenCalled();
  });

  it("returns the profile by identity id", async () => {
    const profileRepository = {
      save: vi.fn(),
      findByIdentityId: vi.fn().mockResolvedValue(existingProfile),
      update: vi.fn(),
      softDelete: vi.fn(),
      existsById: vi.fn(),
      findById: vi.fn(),
    };

    const service = new ProfileService(
      profileRepository,
      allowAuthorizationClient(),
      createProfilePhotoStorage(),
      createOutbox(),
      createDb(),
    );

    await expect(service.getByIdentityId("identity-1")).resolves.toEqual(existingProfile);
  });

  it("throws when the profile is missing by identity id", async () => {
    const profileRepository = {
      save: vi.fn(),
      findByIdentityId: vi.fn().mockResolvedValue(null),
      update: vi.fn(),
      softDelete: vi.fn(),
      existsById: vi.fn(),
      findById: vi.fn(),
    };

    const service = new ProfileService(
      profileRepository,
      allowAuthorizationClient(),
      createProfilePhotoStorage(),
      createOutbox(),
      createDb(),
    );

    await expect(service.getByIdentityId("missing")).rejects.toBeInstanceOf(
      UserProfileNotFoundError,
    );
  });

  it("updates name fields on the identity profile", async () => {
    const updated = { ...existingProfile, firstName: "Grace", lastName: "Hopper" };
    const profileRepository = {
      save: vi.fn(),
      findByIdentityId: vi.fn().mockResolvedValue(existingProfile),
      update: vi.fn().mockResolvedValue(updated),
      softDelete: vi.fn(),
      existsById: vi.fn(),
      findById: vi.fn(),
    };
    const authorizationClient = allowAuthorizationClient();
    const outboxService = createOutbox();
    const db = createDb();

    const service = new ProfileService(
      profileRepository,
      authorizationClient,
      createProfilePhotoStorage(),
      outboxService,
      db,
    );

    const result = await service.updateName({
      identityId: "identity-1",
      firstName: "Grace",
      lastName: "Hopper",
    });

    expect(authorizationClient.checkRelationship).toHaveBeenCalledWith({
      namespace: "Profile",
      object: "profile-1",
      relation: "update",
      subject: "Identity:identity-1",
    });
    expect(profileRepository.findByIdentityId).toHaveBeenCalledWith("identity-1");
    expect(db.transaction).toHaveBeenCalledOnce();
    expect(profileRepository.update).toHaveBeenCalledWith(
      "profile-1",
      {
        firstName: "Grace",
        middleName: null,
        lastName: "Hopper",
      },
      { tx: {} },
    );
    expect(outboxService.schedule).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: ProfileNameUpdatedEvent.type,
        eventVersion: ProfileNameUpdatedEvent.version,
        aggregateType: "profile",
        aggregateId: "profile-1",
        payload: expect.objectContaining({
          type: ProfileNameUpdatedEvent.type,
          subject: "profile-1",
          data: {
            id: "profile-1",
            identityId: "identity-1",
            fullName: "Grace Hopper",
            firstName: "Grace",
            lastName: "Hopper",
          },
        }),
      }),
      { tx: {} },
    );
    expect(result).toEqual(updated);
  });

  it("does not update the name without update permission", async () => {
    const profileRepository = {
      save: vi.fn(),
      findByIdentityId: vi.fn().mockResolvedValue(existingProfile),
      update: vi.fn(),
      softDelete: vi.fn(),
      existsById: vi.fn(),
      findById: vi.fn(),
    };
    const authorizationClient = {
      ...allowAuthorizationClient(),
      checkRelationship: vi.fn().mockResolvedValue(false),
    };

    const service = new ProfileService(
      profileRepository,
      authorizationClient,
      createProfilePhotoStorage(),
      createOutbox(),
      createDb(),
    );

    await expect(
      service.updateName({ identityId: "identity-1", firstName: "Grace" }),
    ).rejects.toBeInstanceOf(InsufficientPermissionError);
    expect(profileRepository.update).not.toHaveBeenCalled();
  });

  it("throws when updating a name for a missing profile", async () => {
    const profileRepository = {
      save: vi.fn(),
      findByIdentityId: vi.fn().mockResolvedValue(null),
      update: vi.fn(),
      softDelete: vi.fn(),
      existsById: vi.fn(),
      findById: vi.fn(),
    };

    const service = new ProfileService(
      profileRepository,
      allowAuthorizationClient(),
      createProfilePhotoStorage(),
      createOutbox(),
      createDb(),
    );

    await expect(
      service.updateName({ identityId: "missing", firstName: "Ada" }),
    ).rejects.toBeInstanceOf(UserProfileNotFoundError);
    expect(profileRepository.update).not.toHaveBeenCalled();
  });

  it("updates gender on the identity profile and schedules ProfileGenderUpdated", async () => {
    const updated = { ...existingProfile, gender: ProfileGender.FEMALE };
    const profileRepository = {
      save: vi.fn(),
      findByIdentityId: vi.fn().mockResolvedValue(existingProfile),
      update: vi.fn().mockResolvedValue(updated),
      softDelete: vi.fn(),
      existsById: vi.fn(),
      findById: vi.fn(),
    };
    const authorizationClient = allowAuthorizationClient();
    const outboxService = createOutbox();

    const service = new ProfileService(
      profileRepository,
      authorizationClient,
      createProfilePhotoStorage(),
      outboxService,
      createDb(),
    );

    const result = await service.updateGender({
      identityId: "identity-1",
      gender: ProfileGender.FEMALE,
    });

    expect(authorizationClient.checkRelationship).toHaveBeenCalledWith({
      namespace: "Profile",
      object: "profile-1",
      relation: "update",
      subject: "Identity:identity-1",
    });
    expect(profileRepository.update).toHaveBeenCalledWith("profile-1", {
      gender: ProfileGender.FEMALE,
    });
    expect(outboxService.schedule).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: ProfileGenderUpdatedEvent.type,
        eventVersion: ProfileGenderUpdatedEvent.version,
        aggregateType: "profile",
        aggregateId: "profile-1",
        payload: expect.objectContaining({
          type: ProfileGenderUpdatedEvent.type,
          subject: "profile-1",
          data: {
            id: "profile-1",
            identityId: "identity-1",
          },
        }),
      }),
    );
    expect(result).toEqual(updated);
  });

  it("does not update gender without update permission", async () => {
    const profileRepository = {
      save: vi.fn(),
      findByIdentityId: vi.fn().mockResolvedValue(existingProfile),
      update: vi.fn(),
      softDelete: vi.fn(),
      existsById: vi.fn(),
      findById: vi.fn(),
    };
    const authorizationClient = {
      ...allowAuthorizationClient(),
      checkRelationship: vi.fn().mockResolvedValue(false),
    };
    const outboxService = createOutbox();

    const service = new ProfileService(
      profileRepository,
      authorizationClient,
      createProfilePhotoStorage(),
      outboxService,
      createDb(),
    );

    await expect(
      service.updateGender({ identityId: "identity-1", gender: ProfileGender.FEMALE }),
    ).rejects.toBeInstanceOf(InsufficientPermissionError);
    expect(profileRepository.update).not.toHaveBeenCalled();
    expect(outboxService.schedule).not.toHaveBeenCalled();
  });

  it("throws when updating gender for a missing profile", async () => {
    const profileRepository = {
      save: vi.fn(),
      findByIdentityId: vi.fn().mockResolvedValue(null),
      update: vi.fn(),
      softDelete: vi.fn(),
      existsById: vi.fn(),
      findById: vi.fn(),
    };
    const outboxService = createOutbox();

    const service = new ProfileService(
      profileRepository,
      allowAuthorizationClient(),
      createProfilePhotoStorage(),
      outboxService,
      createDb(),
    );

    await expect(
      service.updateGender({ identityId: "missing", gender: ProfileGender.MALE }),
    ).rejects.toBeInstanceOf(UserProfileNotFoundError);
    expect(profileRepository.update).not.toHaveBeenCalled();
    expect(outboxService.schedule).not.toHaveBeenCalled();
  });

  it("soft-deletes the profile and schedules ProfileDeleted", async () => {
    const tx = {};
    const profileRepository = {
      save: vi.fn(),
      findByIdentityId: vi.fn().mockResolvedValue(existingProfile),
      update: vi.fn(),
      softDelete: vi.fn(),
      existsById: vi.fn(),
      findById: vi.fn(),
    };
    const authorizationClient = allowAuthorizationClient();
    const outboxService = createOutbox();

    const service = new ProfileService(
      profileRepository,
      authorizationClient,
      createProfilePhotoStorage(),
      outboxService,
      createDb(),
    );

    await service.delete({ tx, identityId: "identity-1" });

    expect(profileRepository.findByIdentityId).toHaveBeenCalledWith("identity-1", { tx });
    expect(profileRepository.softDelete).toHaveBeenCalledWith("profile-1", { tx });
    expect(authorizationClient.deleteRelationship).not.toHaveBeenCalled();
    expect(outboxService.schedule).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: ProfileDeletedEvent.type,
        eventVersion: ProfileDeletedEvent.version,
        aggregateType: "profile",
        aggregateId: "profile-1",
        payload: expect.objectContaining({
          type: ProfileDeletedEvent.type,
          subject: "profile-1",
          data: {
            id: "profile-1",
            identityId: "identity-1",
          },
        }),
      }),
      { tx },
    );
  });

  it("does not schedule ProfileDeleted when the profile is missing", async () => {
    const tx = {};
    const profileRepository = {
      save: vi.fn(),
      findByIdentityId: vi.fn().mockResolvedValue(null),
      update: vi.fn(),
      softDelete: vi.fn(),
      existsById: vi.fn(),
      findById: vi.fn(),
    };
    const authorizationClient = allowAuthorizationClient();
    const outboxService = createOutbox();

    const service = new ProfileService(
      profileRepository,
      authorizationClient,
      createProfilePhotoStorage(),
      outboxService,
      createDb(),
    );

    await service.delete({ tx, identityId: "missing" });

    expect(profileRepository.softDelete).not.toHaveBeenCalled();
    expect(authorizationClient.deleteRelationship).not.toHaveBeenCalled();
    expect(outboxService.schedule).not.toHaveBeenCalled();
  });

  it("stores a profile photo and schedules ProfilePhotoUpdated", async () => {
    const profileRepository = {
      save: vi.fn(),
      findByIdentityId: vi.fn().mockResolvedValue(existingProfile),
      update: vi.fn().mockImplementation(async () => ({
        ...existingProfile,
        photoUrl: "https://localhost/api/identity/profiles/identity-1/photo?v=1",
      })),
      softDelete: vi.fn(),
      existsById: vi.fn(),
      findById: vi.fn(),
    };
    const authorizationClient = allowAuthorizationClient();
    const profilePhotoStorage = createProfilePhotoStorage();
    const outboxService = createOutbox();
    const db = createDb();
    const body = Buffer.from("image");

    const service = new ProfileService(
      profileRepository,
      authorizationClient,
      profilePhotoStorage,
      outboxService,
      db,
    );

    const result = await service.uploadPhoto({
      identityId: "identity-1",
      contentType: "image/png",
      body,
    });

    expect(authorizationClient.checkRelationship).toHaveBeenCalledWith({
      namespace: "Profile",
      object: "profile-1",
      relation: "update",
      subject: "Identity:identity-1",
    });
    expect(profilePhotoStorage.putProfilePhoto).toHaveBeenCalledWith({
      identityId: "identity-1",
      contentType: "image/png",
      body,
    });
    expect(profileRepository.update).toHaveBeenCalledWith(
      "profile-1",
      {
        photoUrl: expect.stringMatching(
          /^https:\/\/localhost\/api\/identity\/profiles\/identity-1\/photo\?v=\d+$/,
        ),
      },
      { tx: {} },
    );
    expect(outboxService.schedule).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: ProfilePhotoUpdatedEvent.type,
        eventVersion: ProfilePhotoUpdatedEvent.version,
        aggregateType: "profile",
        aggregateId: "profile-1",
        payload: expect.objectContaining({
          type: ProfilePhotoUpdatedEvent.type,
          subject: "profile-1",
          data: expect.objectContaining({
            id: "profile-1",
            identityId: "identity-1",
          }),
        }),
      }),
      { tx: {} },
    );
    expect(result.photoUrl).toEqual(expect.any(String));
    expect(db.transaction).toHaveBeenCalledOnce();
  });

  it("rejects a profile photo that is not an image", async () => {
    const profileRepository = {
      save: vi.fn(),
      findByIdentityId: vi.fn().mockResolvedValue(existingProfile),
      update: vi.fn(),
      softDelete: vi.fn(),
      existsById: vi.fn(),
      findById: vi.fn(),
    };
    const profilePhotoStorage = createProfilePhotoStorage();

    const service = new ProfileService(
      profileRepository,
      allowAuthorizationClient(),
      profilePhotoStorage,
      createOutbox(),
      createDb(),
    );

    await expect(
      service.uploadPhoto({
        identityId: "identity-1",
        contentType: "text/plain",
        body: Buffer.from("nope"),
      }),
    ).rejects.toBeInstanceOf(InvalidProfilePhotoError);
    expect(profilePhotoStorage.putProfilePhoto).not.toHaveBeenCalled();
  });

  it("returns the stored profile photo", async () => {
    const stored = {
      body: Readable.from(Buffer.from("image")),
      contentType: "image/png",
      contentLength: 5,
    };
    const profileRepository = {
      save: vi.fn(),
      findByIdentityId: vi.fn().mockResolvedValue({
        ...existingProfile,
        photoUrl: "https://localhost/api/identity/profiles/identity-1/photo?v=1",
      }),
      update: vi.fn(),
      softDelete: vi.fn(),
      existsById: vi.fn(),
      findById: vi.fn(),
    };
    const profilePhotoStorage = createProfilePhotoStorage({
      getProfilePhoto: vi.fn().mockResolvedValue(stored),
    });

    const service = new ProfileService(
      profileRepository,
      allowAuthorizationClient(),
      profilePhotoStorage,
      createOutbox(),
      createDb(),
    );

    await expect(service.getProfilePhoto("identity-1")).resolves.toEqual(stored);
  });

  it("throws when the profile has no photo", async () => {
    const profileRepository = {
      save: vi.fn(),
      findByIdentityId: vi.fn().mockResolvedValue(existingProfile),
      update: vi.fn(),
      softDelete: vi.fn(),
      existsById: vi.fn(),
      findById: vi.fn(),
    };
    const profilePhotoStorage = createProfilePhotoStorage();

    const service = new ProfileService(
      profileRepository,
      allowAuthorizationClient(),
      profilePhotoStorage,
      createOutbox(),
      createDb(),
    );

    await expect(service.getProfilePhoto("identity-1")).rejects.toBeInstanceOf(
      ProfilePhotoNotFoundError,
    );
    expect(profilePhotoStorage.getProfilePhoto).not.toHaveBeenCalled();
  });
});
