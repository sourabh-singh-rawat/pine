import { InsufficientPermissionError } from "@pine/authorization";
import { TenantMemberCreatedEvent, TenantMemberDeletedEvent } from "@pine/events";
import { describe, expect, it, vi } from "vitest";
import { TenantNotFoundError } from "@/features/tenants/errors";
import {
  InvalidTenantMemberRoleError,
  TenantMemberConflictError,
  TenantMemberNotFoundError,
} from "@/features/tenant-members/errors";
import { TenantMemberService } from "@/features/tenant-members/services/TenantMemberService";

const tenant = {
  id: "tenant-1",
  name: "Acme Corp",
  slug: "acme",
  description: "Primary tenant",
  isActive: true,
  suspendedAt: null,
  version: 1,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: null,
  deletedAt: null,
};

const member = {
  id: "member-1",
  tenantId: "tenant-1",
  identityId: "user-2",
  role: "members",
  version: 1,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: null,
  deletedAt: null,
};

const actorId = "user-1";

const createDbMock = (tx: unknown = { tx: true }) => ({
  transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb(tx)),
});

const createService = (deps: {
  tenantMemberRepository?: unknown;
  tenantRepository?: unknown;
  authorizationClient?: unknown;
  outboxService?: unknown;
  db?: unknown;
}) =>
  new TenantMemberService(
    (deps.tenantMemberRepository ?? {
      findTenantMemberById: vi.fn().mockResolvedValue(member),
      findTenantMemberByTenantAndIdentity: vi.fn().mockResolvedValue(null),
      listTenantMembersByTenantId: vi.fn().mockResolvedValue([member]),
      saveTenantMember: vi.fn().mockResolvedValue(member),
      updateTenantMemberRole: vi.fn().mockResolvedValue({ ...member, role: "admins" }),
      deleteTenantMember: vi.fn().mockResolvedValue(true),
    }) as never,
    (deps.tenantRepository ?? {
      findById: vi.fn().mockResolvedValue(tenant),
    }) as never,
    (deps.authorizationClient ?? {
      checkRelationship: vi.fn().mockResolvedValue(true),
      ensureRelationship: vi.fn().mockResolvedValue(undefined),
      deleteRelationship: vi.fn().mockResolvedValue(undefined),
    }) as never,
    (deps.outboxService ?? {
      schedule: vi.fn().mockResolvedValue({ id: "outbox-1" }),
    }) as never,
    (deps.db ?? createDbMock()) as never,
  );

describe("TenantMemberService", () => {
  it("creates a tenant member and schedules outbox event", async () => {
    const tx = { tx: true };
    const db = createDbMock(tx);
    const tenantMemberRepository = {
      findTenantMemberByTenantAndIdentity: vi.fn().mockResolvedValue(null),
      saveTenantMember: vi.fn().mockResolvedValue(member),
    };
    const authorizationClient = {
      checkRelationship: vi.fn().mockResolvedValue(true),
    };
    const outboxService = {
      schedule: vi.fn().mockResolvedValue({ id: "outbox-1" }),
    };

    const service = createService({
      tenantMemberRepository,
      authorizationClient,
      outboxService,
      db,
    });

    const result = await service.createTenantMember(
      {
        tenantId: "tenant-1",
        identityId: "user-2",
        role: "member",
      },
      actorId,
    );

    expect(result).toEqual(member);
    expect(authorizationClient.checkRelationship).toHaveBeenCalledWith({
      namespace: "Tenant",
      object: "tenant-1",
      relation: "manage_members",
      subject: `Identity:${actorId}`,
    });
    expect(tenantMemberRepository.saveTenantMember).toHaveBeenCalledWith(
      {
        tenantId: "tenant-1",
        identityId: "user-2",
        role: "members",
      },
      { tx },
    );
    expect(outboxService.schedule).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: TenantMemberCreatedEvent.type,
        aggregateType: "tenant-member",
        aggregateId: "tenant-1",
      }),
      { tx },
    );
  });

  it("rejects createTenantMember when caller lacks permission", async () => {
    const authorizationClient = {
      checkRelationship: vi.fn().mockResolvedValue(false),
    };
    const service = createService({ authorizationClient });

    await expect(
      service.createTenantMember(
        {
          tenantId: "tenant-1",
          identityId: "user-2",
          role: "member",
        },
        actorId,
      ),
    ).rejects.toBeInstanceOf(InsufficientPermissionError);
  });

  it("throws InvalidTenantMemberRoleError when role is unrecognized", async () => {
    const service = createService({});

    await expect(
      service.createTenantMember(
        {
          tenantId: "tenant-1",
          identityId: "user-2",
          role: "superhero",
        },
        actorId,
      ),
    ).rejects.toBeInstanceOf(InvalidTenantMemberRoleError);
  });

  it("throws TenantMemberConflictError when member already exists", async () => {
    const tenantMemberRepository = {
      findTenantMemberByTenantAndIdentity: vi.fn().mockResolvedValue(member),
    };
    const service = createService({ tenantMemberRepository });

    await expect(
      service.createTenantMember(
        {
          tenantId: "tenant-1",
          identityId: "user-2",
          role: "member",
        },
        actorId,
      ),
    ).rejects.toBeInstanceOf(TenantMemberConflictError);
  });

  it("throws TenantNotFoundError when creating member for nonexistent tenant", async () => {
    const tenantRepository = {
      findById: vi.fn().mockResolvedValue(null),
    };
    const service = createService({ tenantRepository });

    await expect(
      service.createTenantMember(
        {
          tenantId: "tenant-missing",
          identityId: "user-2",
          role: "member",
        },
        actorId,
      ),
    ).rejects.toBeInstanceOf(TenantNotFoundError);
  });

  it("gets tenant member by id", async () => {
    const service = createService({});
    const result = await service.getTenantMemberById("member-1", actorId);

    expect(result).toEqual(member);
  });

  it("throws TenantMemberNotFoundError when member is missing", async () => {
    const tenantMemberRepository = {
      findTenantMemberById: vi.fn().mockResolvedValue(null),
    };
    const service = createService({ tenantMemberRepository });

    await expect(service.getTenantMemberById("missing-id", actorId)).rejects.toBeInstanceOf(
      TenantMemberNotFoundError,
    );
  });

  it("lists tenant members", async () => {
    const service = createService({});
    const result = await service.listTenantMembers("tenant-1", actorId);

    expect(result).toEqual([member]);
  });

  it("updates tenant member role", async () => {
    const updatedMember = { ...member, role: "admins" };
    const tenantMemberRepository = {
      findTenantMemberById: vi.fn().mockResolvedValue(member),
      updateTenantMemberRole: vi.fn().mockResolvedValue(updatedMember),
    };
    const outboxService = {
      schedule: vi.fn().mockResolvedValue({ id: "outbox-1" }),
    };

    const service = createService({ tenantMemberRepository, outboxService });
    const result = await service.updateTenantMemberRole("member-1", "admin", actorId);

    expect(result.role).toBe("admins");
    expect(outboxService.schedule).toHaveBeenCalledTimes(2);
  });

  it("deletes tenant member and schedules outbox deletion event", async () => {
    const outboxService = {
      schedule: vi.fn().mockResolvedValue({ id: "outbox-1" }),
    };
    const service = createService({ outboxService });

    await service.deleteTenantMember("member-1", actorId);

    expect(outboxService.schedule).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: TenantMemberDeletedEvent.type,
      }),
      expect.anything(),
    );
  });
});
