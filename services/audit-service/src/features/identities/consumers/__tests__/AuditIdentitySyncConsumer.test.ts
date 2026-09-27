import { createCloudEvent, IdentityEmailVerifiedEvent } from "@pine/events";
import { describe, expect, it, vi } from "vitest";
import type { IAuditLogRepository } from "@/features/audit";
import { AuditIdentitySyncConsumer } from "@/features/identities/consumers/AuditIdentitySyncConsumer";
import type { IIdentityRepository } from "@/features/identities/repositories";

const createBroker = () => ({
  client: { jetstream: vi.fn() },
  init: vi.fn(),
  getConfig: vi.fn(),
});

const createDb = () => ({
  transaction: vi.fn(async (callback: (tx: object) => Promise<unknown>) => callback({})),
});

const createIdentityRepository = (
  overrides: Partial<IIdentityRepository> = {},
): IIdentityRepository => ({
  upsert: vi.fn().mockResolvedValue({ id: "user-1", displayName: "Ada Lovelace" }),
  findById: vi.fn().mockResolvedValue(null),
  ...overrides,
});

const createAuditLogRepository = (
  overrides: Partial<IAuditLogRepository> = {},
): IAuditLogRepository => ({
  save: vi.fn().mockResolvedValue({ id: "log-1" }),
  findMany: vi.fn().mockResolvedValue([]),
  ...overrides,
});

describe("AuditIdentitySyncConsumer", () => {
  it("upserts identity and logs email_verified audit log on IdentityEmailVerifiedEvent", async () => {
    const db = createDb();
    const identityRepository = createIdentityRepository();
    const auditLogRepository = createAuditLogRepository();
    const consumer = new AuditIdentitySyncConsumer(
      createBroker(),
      db,
      identityRepository,
      auditLogRepository,
    );

    const message = { ack: vi.fn() };
    const event = createCloudEvent({
      type: IdentityEmailVerifiedEvent.type,
      version: IdentityEmailVerifiedEvent.version,
      schema: IdentityEmailVerifiedEvent.schema,
      source: "pine/identity-service",
      subject: "user-1",
      data: {
        userId: "user-1",
        displayName: "Ada Lovelace",
        emailVerificationStatus: "Verified",
      },
    });

    await consumer.onMessage(message, event);

    expect(identityRepository.upsert).toHaveBeenCalledWith(
      {
        identityId: "user-1",
        fullName: "Ada Lovelace",
        firstName: "Ada",
        middleName: null,
        lastName: "Lovelace",
      },
      { tx: expect.anything() },
    );
    expect(auditLogRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: "identity",
        entityId: "user-1",
        action: "email_verified",
        actorId: "user-1",
      }),
      { tx: expect.anything() },
    );
    expect(message.ack).toHaveBeenCalled();
  });
});
