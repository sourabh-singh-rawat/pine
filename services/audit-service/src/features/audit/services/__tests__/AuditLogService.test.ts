import { InsufficientPermissionError, type IAuthorizationClient } from "@pine/authorization";
import { describe, expect, it, vi } from "vitest";
import type { AuditLog, Identity } from "@/db";
import type { IAuditLogRepository } from "@/features/audit/repositories";
import { AuditLogService } from "@/features/audit/services/AuditLogService";
import type { IIdentityRepository } from "@/features/identities/repositories";

const identityId = "viewer-1";
const organizationId = "organization-1";

const createdAt = new Date("2026-01-01T00:00:00.000Z");

const logWithActor: AuditLog = {
  id: "log-1",
  entityType: "item",
  entityId: "item-1",
  action: "created",
  actorId: "user-1",
  organizationId,
  tenantId: null,
  payload: null,
  createdAt,
  updatedAt: null,
  deletedAt: null,
  version: 1,
};

const logWithoutActor: AuditLog = {
  ...logWithActor,
  id: "log-2",
  action: "updated",
  actorId: null,
};

const logMissingProjection: AuditLog = {
  ...logWithActor,
  id: "log-3",
  action: "updated",
  actorId: "user-missing",
};

const actorIdentity: Identity = {
  id: "user-1",
  identityId: "user-1",
  fullName: "Ada Lovelace",
  firstName: "Ada",
  middleName: null,
  lastName: "Lovelace",
  createdAt,
  updatedAt: null,
  deletedAt: null,
  version: 1,
};

const createAuditLogRepository = (
  overrides: Partial<IAuditLogRepository> = {},
): IAuditLogRepository => ({
  save: vi.fn(),
  findMany: vi.fn().mockResolvedValue([]),
  ...overrides,
});

const createIdentityRepository = (
  overrides: Partial<IIdentityRepository> = {},
): IIdentityRepository => ({
  upsert: vi.fn(),
  findById: vi.fn().mockResolvedValue(null),
  findByIdentityId: vi.fn().mockResolvedValue(null),
  findByIdentityIds: vi.fn().mockResolvedValue([]),
  ...overrides,
});

const createAuthorizationClient = (
  overrides: Partial<IAuthorizationClient> = {},
): IAuthorizationClient => ({
  checkRelationship: vi.fn().mockResolvedValue(true),
  ensureRelationship: vi.fn().mockResolvedValue({ created: true }),
  deleteRelationship: vi.fn().mockResolvedValue({ deleted: true }),
  listRelationships: vi.fn().mockResolvedValue([]),
  ...overrides,
});

describe("AuditLogService", () => {
  it("lists audit logs enriched with actors from the local identity projection", async () => {
    const auditLogRepository = createAuditLogRepository({
      findMany: vi.fn().mockResolvedValue([logWithActor, logWithoutActor, logMissingProjection]),
    });
    const identityRepository = createIdentityRepository({
      findByIdentityIds: vi.fn().mockResolvedValue([actorIdentity]),
    });
    const authorizationClient = createAuthorizationClient();
    const service = new AuditLogService(
      auditLogRepository,
      identityRepository,
      authorizationClient,
    );

    await expect(
      service.list({ entityType: "item", entityId: "item-1", organizationId }, identityId),
    ).resolves.toEqual([
      { ...logWithActor, actor: actorIdentity },
      { ...logWithoutActor, actor: null },
      { ...logMissingProjection, actor: null },
    ]);

    expect(authorizationClient.checkRelationship).toHaveBeenCalledWith({
      namespace: "organization",
      object: organizationId,
      relation: "read",
      subject: `identity:${identityId}`,
    });
    expect(auditLogRepository.findMany).toHaveBeenCalledWith({
      entityType: "item",
      entityId: "item-1",
    });
    expect(identityRepository.findByIdentityIds).toHaveBeenCalledWith(["user-1", "user-missing"]);
  });

  it("dedupes actor ids before batch loading identities", async () => {
    const duplicateActorLog: AuditLog = {
      ...logWithActor,
      id: "log-4",
      action: "updated",
    };
    const identityRepository = createIdentityRepository({
      findByIdentityIds: vi.fn().mockResolvedValue([actorIdentity]),
    });
    const service = new AuditLogService(
      createAuditLogRepository({
        findMany: vi.fn().mockResolvedValue([logWithActor, duplicateActorLog]),
      }),
      identityRepository,
      createAuthorizationClient(),
    );

    await service.list({ entityType: "item", entityId: "item-1", organizationId }, identityId);

    expect(identityRepository.findByIdentityIds).toHaveBeenCalledTimes(1);
    expect(identityRepository.findByIdentityIds).toHaveBeenCalledWith(["user-1"]);
  });

  it("skips identity lookup when no actor ids are present", async () => {
    const identityRepository = createIdentityRepository();
    const service = new AuditLogService(
      createAuditLogRepository({
        findMany: vi.fn().mockResolvedValue([logWithoutActor]),
      }),
      identityRepository,
      createAuthorizationClient(),
    );

    await expect(
      service.list({ entityType: "item", entityId: "item-1", organizationId }, identityId),
    ).resolves.toEqual([{ ...logWithoutActor, actor: null }]);

    expect(identityRepository.findByIdentityIds).toHaveBeenCalledWith([]);
  });

  it("rejects when the caller lacks organization read permission", async () => {
    const authorizationClient = createAuthorizationClient({
      checkRelationship: vi.fn().mockResolvedValue(false),
    });
    const auditLogRepository = createAuditLogRepository();
    const identityRepository = createIdentityRepository();
    const service = new AuditLogService(
      auditLogRepository,
      identityRepository,
      authorizationClient,
    );

    await expect(
      service.list({ entityType: "item", entityId: "item-1", organizationId }, identityId),
    ).rejects.toBeInstanceOf(InsufficientPermissionError);

    expect(auditLogRepository.findMany).not.toHaveBeenCalled();
    expect(identityRepository.findByIdentityIds).not.toHaveBeenCalled();
  });
});
