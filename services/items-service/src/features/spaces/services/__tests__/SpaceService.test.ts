import { InsufficientPermissionError, type IAuthorizationClient } from "@pine/authorization";
import { SpaceUpdatedEvent } from "@pine/events";
import type { IOutboxService } from "@pine/outbox";
import { describe, expect, it, vi } from "vitest";
import type { DbClient, Identity, Space } from "@/db";
import type { IIdentityRepository } from "@/features/identities/repositories";
import { SpaceNotFoundError } from "@/features/spaces/errors";
import type { ISpaceRepository } from "@/features/spaces/repositories";
import { type SpaceDatabase, SpaceService } from "@/features/spaces/services/SpaceService";

const space: Space = {
  id: "space-1",
  workspaceId: "workspace-1",
  name: "Engineering",
  createdById: "user-1",
  version: 1,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: null,
  deletedAt: null,
};

const updatedSpace: Space = {
  ...space,
  name: "Platform",
  version: 2,
  updatedAt: new Date("2026-01-02T00:00:00.000Z"),
};

const identity: Identity = {
  id: "user-1",
  version: 1,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: null,
  deletedAt: null,
};

const createSpaceRepository = (overrides: Partial<ISpaceRepository> = {}): ISpaceRepository => ({
  save: vi.fn().mockResolvedValue(space),
  update: vi.fn().mockResolvedValue(updatedSpace),
  findById: vi.fn().mockResolvedValue(space),
  findMany: vi.fn().mockResolvedValue([space]),
  ...overrides,
});

const createIdentityRepository = (
  overrides: Partial<IIdentityRepository> = {},
): IIdentityRepository => ({
  save: vi.fn().mockResolvedValue(identity),
  findById: vi.fn().mockResolvedValue(identity),
  existsById: vi.fn().mockResolvedValue(true),
  ...overrides,
});

const createOutboxService = (overrides: Partial<IOutboxService> = {}): IOutboxService => ({
  schedule: vi.fn().mockResolvedValue({ id: "outbox-1" }),
  claimBatch: vi.fn().mockResolvedValue([]),
  complete: vi.fn().mockResolvedValue({ id: "outbox-1" }),
  failed: vi.fn().mockResolvedValue({ id: "outbox-1" }),
  get: vi.fn().mockResolvedValue(null),
  getByEventId: vi.fn().mockResolvedValue(null),
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

const isDbClient = (_value: unknown): _value is DbClient => true;
const mockTxValue: unknown = {};
const mockTx = isDbClient(mockTxValue) ? mockTxValue : undefined;

const createDatabase = (): SpaceDatabase => ({
  transaction: vi.fn(async (callback) => {
    if (!mockTx) {
      throw new Error("mockTx not defined");
    }
    return callback(mockTx);
  }),
});

const createService = (
  deps: {
    spaceRepository?: ISpaceRepository;
    identityRepository?: IIdentityRepository;
    authorizationClient?: IAuthorizationClient;
    outboxService?: IOutboxService;
    db?: SpaceDatabase;
  } = {},
) =>
  new SpaceService(
    deps.spaceRepository ?? createSpaceRepository(),
    deps.identityRepository ?? createIdentityRepository(),
    deps.authorizationClient ?? createAuthorizationClient(),
    deps.outboxService ?? createOutboxService(),
    deps.db ?? createDatabase(),
  );

describe("SpaceService", () => {
  it("updates a space name and schedules SpaceUpdatedEvent", async () => {
    const spaceRepository = createSpaceRepository();
    const outboxService = createOutboxService();
    const authorizationClient = createAuthorizationClient();
    const service = createService({ spaceRepository, outboxService, authorizationClient });

    await expect(
      service.update({
        id: "space-1",
        name: "Platform",
        identityId: "user-1",
      }),
    ).resolves.toBeUndefined();

    expect(authorizationClient.checkRelationship).toHaveBeenCalledWith({
      namespace: "workspace",
      object: "workspace-1",
      relation: "update",
      subject: "identity:user-1",
    });
    expect(spaceRepository.update).toHaveBeenCalledWith(
      "space-1",
      { name: "Platform" },
      { tx: {} },
    );
    expect(outboxService.schedule).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: SpaceUpdatedEvent.type,
        eventVersion: SpaceUpdatedEvent.version,
        aggregateType: "space",
        aggregateId: "space-1",
        payload: expect.objectContaining({
          type: SpaceUpdatedEvent.type,
          subject: "space-1",
          data: expect.objectContaining({
            id: "space-1",
            workspaceId: "workspace-1",
            name: "Platform",
          }),
        }),
      }),
      { tx: {} },
    );
  });

  it("throws SpaceNotFoundError when the space is missing", async () => {
    const spaceRepository = createSpaceRepository({
      findById: vi.fn().mockResolvedValue(null),
    });
    const outboxService = createOutboxService();
    const service = createService({ spaceRepository, outboxService });

    await expect(
      service.update({
        id: "missing",
        name: "Platform",
        identityId: "user-1",
      }),
    ).rejects.toBeInstanceOf(SpaceNotFoundError);

    expect(spaceRepository.update).not.toHaveBeenCalled();
    expect(outboxService.schedule).not.toHaveBeenCalled();
  });

  it("throws InsufficientPermissionError when workspace update is denied", async () => {
    const authorizationClient = createAuthorizationClient({
      checkRelationship: vi.fn().mockResolvedValue(false),
    });
    const spaceRepository = createSpaceRepository();
    const outboxService = createOutboxService();
    const service = createService({ authorizationClient, spaceRepository, outboxService });

    await expect(
      service.update({
        id: "space-1",
        name: "Platform",
        identityId: "user-1",
      }),
    ).rejects.toBeInstanceOf(InsufficientPermissionError);

    expect(spaceRepository.update).not.toHaveBeenCalled();
    expect(outboxService.schedule).not.toHaveBeenCalled();
  });
});
