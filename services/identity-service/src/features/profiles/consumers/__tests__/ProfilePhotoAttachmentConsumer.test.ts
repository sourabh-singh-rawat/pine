import { AttachmentCreatedEvent, createCloudEvent } from "@pine/events";
import { describe, expect, it, vi } from "vitest";
import { env } from "@/bootstrap/env";
import type { IProfileService } from "@/features/profiles/services";
import { ProfilePhotoAttachmentConsumer } from "../ProfilePhotoAttachmentConsumer";

const createBroker = () => ({
  client: { jetstream: vi.fn() },
  init: vi.fn(),
  getConfig: vi.fn(),
});

describe("ProfilePhotoAttachmentConsumer", () => {
  it("updates profile photoUrl and completes upload request when clean identity attachment is created", async () => {
    const profileService = {
      create: vi.fn(),
      getByIdentityId: vi.fn(),
      updateName: vi.fn(),
      updateGender: vi.fn(),
      updatePhoto: vi.fn().mockResolvedValue({}),
      delete: vi.fn(),
      createPhotoUploadRequest: vi.fn(),
    };

    const consumer = new ProfilePhotoAttachmentConsumer(
      createBroker() as unknown as Parameters<typeof ProfilePhotoAttachmentConsumer.prototype.constructor>[0],
      profileService as unknown as IProfileService,
    );

    const message = { ack: vi.fn() };
    const event = createCloudEvent({
      type: AttachmentCreatedEvent.type,
      version: AttachmentCreatedEvent.version,
      schema: AttachmentCreatedEvent.schema,
      source: "pine/attachment-service",
      subject: "att-1",
      data: {
        id: "att-1",
        scopeType: "IDENTITY",
        scopeId: "user-1",
        operationId: "upload-req-1",
        status: "AVAILABLE",
        securityStatus: "CLEAN",
        createdBy: "user-1",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });

    await consumer.onMessage(
      message as unknown as Parameters<typeof consumer.onMessage>[0],
      event,
    );

    expect(profileService.updatePhoto).toHaveBeenCalledWith({
      identityId: "user-1",
      photoUrl: `${env.DATA_GATEWAY_URL}/attachments/att-1`,
      uploadRequestId: "upload-req-1",
      attachmentId: "att-1",
    });
    expect(message.ack).toHaveBeenCalled();
  });

  it("skips processing when scopeType is not IDENTITY", async () => {
    const profileService = {
      create: vi.fn(),
      getByIdentityId: vi.fn(),
      updateName: vi.fn(),
      updateGender: vi.fn(),
      updatePhoto: vi.fn(),
      delete: vi.fn(),
      createPhotoUploadRequest: vi.fn(),
    };

    const consumer = new ProfilePhotoAttachmentConsumer(
      createBroker() as unknown as Parameters<typeof ProfilePhotoAttachmentConsumer.prototype.constructor>[0],
      profileService as unknown as IProfileService,
    );

    const message = { ack: vi.fn() };
    const event = createCloudEvent({
      type: AttachmentCreatedEvent.type,
      version: AttachmentCreatedEvent.version,
      schema: AttachmentCreatedEvent.schema,
      source: "pine/attachment-service",
      subject: "att-2",
      data: {
        id: "att-2",
        scopeType: "WORKSPACE",
        scopeId: "org-1",
        status: "AVAILABLE",
        securityStatus: "CLEAN",
        createdBy: "user-1",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });

    await consumer.onMessage(
      message as unknown as Parameters<typeof consumer.onMessage>[0],
      event,
    );

    expect(profileService.updatePhoto).not.toHaveBeenCalled();
    expect(message.ack).toHaveBeenCalled();
  });
});
