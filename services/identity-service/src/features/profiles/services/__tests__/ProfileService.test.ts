import { ATTACHMENT_SCOPE_TYPE } from "@pine/attachment";
import { InsufficientPermissionError } from "@pine/authorization";
import { UserProfileAlreadyExistsError, UserProfileNotFoundError } from "@pine/common";
import { ProfileCreatedEvent, ProfileDeletedEvent, ProfileGenderUpdatedEvent } from "@pine/events";
import { describe, expect, it, vi } from "vitest";
import { ProfileGender } from "@/features/profiles/constants";
import { ProfileService } from "@/features/profiles/services/ProfileService";

const allowAuthorizationClient = () => ({
  checkRelationship: vi.fn().mockResolvedValue(true),
  ensureRelationship: vi.fn().mockResolvedValue({ created: true }),
  deleteRelationship: vi.fn().mockResolvedValue(undefined),
  listRelationships: vi.fn().mockResolvedValue([]),
});

const createOutbox = () => ({
  schedule: vi.fn().mockResolvedValue({ id: "outbox-1" }),
});

const createAttachmentClient = () => ({
  createUploadTarget: vi.fn().mockResolvedValue({
    objectId: "target-object-id",
    url: "http://data-gateway/attachments/upload/123",
    headers: { "Content-Type": "image/png" },
    expiresAt: "2026-08-23T18:00:00.000Z",
  }),
});

const createPhotoUploadRequestRepo = () => ({
  save: vi.fn().mockResolvedValue({
    id: "req-1",
    profileId: "profile-1",
    status: "pending",
    attachmentId: null,
    createdAt: new Date(),
    completedAt: null,
  }),
  findById: vi.fn(),
  update: vi.fn().mockResolvedValue({}),
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
    const photoUploadRequestRepo = createPhotoUploadRequestRepo();
    const attachmentClient = createAttachmentClient();
    const db = createDb();

    const service = new ProfileService(
      profileRepository,
      photoUploadRequestRepo,
      authorizationClient,
      attachmentClient,
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
      createPhotoUploadRequestRepo(),
      authorizationClient,
      createAttachmentClient(),
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
      object: { namespace: "profile", id: "profile-1" },
      relation: "identity",
      subject: { namespace: "identity", id: "identity-1" },
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
      createPhotoUploadRequestRepo(),
      authorizationClient,
      createAttachmentClient(),
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
      createPhotoUploadRequestRepo(),
      allowAuthorizationClient(),
      createAttachmentClient(),
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
      createPhotoUploadRequestRepo(),
      allowAuthorizationClient(),
      createAttachmentClient(),
      createOutbox(),
      createDb(),
    );

    await expect(service.getByIdentityId("missing")).rejects.toBeInstanceOf(UserProfileNotFoundError);
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

    const service = new ProfileService(
      profileRepository,
      createPhotoUploadRequestRepo(),
      authorizationClient,
      createAttachmentClient(),
      createOutbox(),
      createDb(),
    );

    const result = await service.updateName({
      identityId: "identity-1",
      firstName: "Grace",
      lastName: "Hopper",
    });

    expect(authorizationClient.checkRelationship).toHaveBeenCalledWith({
      namespace: "profile",
      object: "profile-1",
      relation: "update",
      subject: "identity:identity-1",
    });
    expect(profileRepository.findByIdentityId).toHaveBeenCalledWith("identity-1");
    expect(profileRepository.update).toHaveBeenCalledWith("profile-1", {
      firstName: "Grace",
      middleName: null,
      lastName: "Hopper",
    });
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
      createPhotoUploadRequestRepo(),
      authorizationClient,
      createAttachmentClient(),
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
      createPhotoUploadRequestRepo(),
      allowAuthorizationClient(),
      createAttachmentClient(),
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
      createPhotoUploadRequestRepo(),
      authorizationClient,
      createAttachmentClient(),
      outboxService,
      createDb(),
    );

    const result = await service.updateGender({
      identityId: "identity-1",
      gender: ProfileGender.FEMALE,
    });

    expect(authorizationClient.checkRelationship).toHaveBeenCalledWith({
      namespace: "profile",
      object: "profile-1",
      relation: "update",
      subject: "identity:identity-1",
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
      createPhotoUploadRequestRepo(),
      authorizationClient,
      createAttachmentClient(),
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
      createPhotoUploadRequestRepo(),
      allowAuthorizationClient(),
      createAttachmentClient(),
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
      createPhotoUploadRequestRepo(),
      authorizationClient,
      createAttachmentClient(),
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
      createPhotoUploadRequestRepo(),
      authorizationClient,
      createAttachmentClient(),
      outboxService,
      createDb(),
    );

    await service.delete({ tx, identityId: "missing" });

    expect(profileRepository.softDelete).not.toHaveBeenCalled();
    expect(authorizationClient.deleteRelationship).not.toHaveBeenCalled();
    expect(outboxService.schedule).not.toHaveBeenCalled();
  });

  it("creates a photo upload request and returns target details", async () => {
    const profileRepository = {
      save: vi.fn(),
      findByIdentityId: vi.fn().mockResolvedValue(existingProfile),
      update: vi.fn(),
      softDelete: vi.fn(),
      existsById: vi.fn(),
      findById: vi.fn(),
    };
    const photoUploadRequestRepo = createPhotoUploadRequestRepo();
    const authorizationClient = allowAuthorizationClient();
    const attachmentClient = createAttachmentClient();
    const outboxService = createOutbox();

    const service = new ProfileService(
      profileRepository,
      photoUploadRequestRepo,
      authorizationClient,
      attachmentClient,
      outboxService,
      createDb(),
    );

    const result = await service.createPhotoUploadRequest({
      identityId: "identity-1",
      filename: "avatar.png",
      contentType: "image/png",
      size: 1024,
    });

    expect(authorizationClient.checkRelationship).toHaveBeenCalledWith({
      namespace: "profile",
      object: "profile-1",
      relation: "update",
      subject: "identity:identity-1",
    });
    expect(photoUploadRequestRepo.save).toHaveBeenCalledWith({
      profileId: "profile-1",
      status: "pending",
    });
    expect(attachmentClient.createUploadTarget).toHaveBeenCalledWith({
      input: {
        scopeType: ATTACHMENT_SCOPE_TYPE.IDENTITY,
        scopeId: "identity-1",
        filename: "avatar.png",
        contentType: "image/png",
        size: 1024,
        operationId: "req-1",
        metadata: {
          profileId: "profile-1",
          uploadRequestId: "req-1",
        },
      },
      identityId: "identity-1",
      authMethod: undefined,
    });
    expect(result).toEqual({
      uploadRequestId: "req-1",
      url: "http://data-gateway/attachments/upload/123",
      headers: { "Content-Type": "image/png" },
      expiresAt: "2026-08-23T18:00:00.000Z",
    });
  });

  it("updates profile photo and completes upload request", async () => {
    const updated = { ...existingProfile, photoUrl: "/attachments/att-1" };
    const profileRepository = {
      save: vi.fn(),
      findByIdentityId: vi.fn().mockResolvedValue(existingProfile),
      update: vi.fn().mockResolvedValue(updated),
      softDelete: vi.fn(),
      existsById: vi.fn(),
      findById: vi.fn(),
    };
    const photoUploadRequestRepo = createPhotoUploadRequestRepo();
    const authorizationClient = allowAuthorizationClient();
    const attachmentClient = createAttachmentClient();
    const outboxService = createOutbox();

    const service = new ProfileService(
      profileRepository,
      photoUploadRequestRepo,
      authorizationClient,
      attachmentClient,
      outboxService,
      createDb(),
    );

    const result = await service.updatePhoto({
      identityId: "identity-1",
      photoUrl: "/attachments/att-1",
      uploadRequestId: "req-1",
      attachmentId: "att-1",
    });

    expect(profileRepository.findByIdentityId).toHaveBeenCalledWith("identity-1", undefined);
    expect(profileRepository.update).toHaveBeenCalledWith(
      "profile-1",
      { photoUrl: "/attachments/att-1" },
      undefined,
    );
    expect(photoUploadRequestRepo.update).toHaveBeenCalledWith(
      "req-1",
      expect.objectContaining({
        status: "completed",
        attachmentId: "att-1",
      }),
      undefined,
    );
    expect(result).toEqual(updated);
  });
});
