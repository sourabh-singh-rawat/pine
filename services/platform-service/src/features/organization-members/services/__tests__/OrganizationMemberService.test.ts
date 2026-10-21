import { InsufficientPermissionError } from "@pine/authorization";
import { OrganizationMemberCreatedEvent, OrganizationMemberDeletedEvent } from "@pine/events";
import { describe, expect, it, vi } from "vitest";
import { OrganizationNotFoundError } from "@/features/organizations/errors";
import {
  InvalidOrganizationMemberRoleError,
  OrganizationMemberConflictError,
  OrganizationMemberNotFoundError,
} from "@/features/organization-members/errors";
import { OrganizationMemberService } from "@/features/organization-members/services/OrganizationMemberService";

const organization = {
  id: "org-1",
  tenantId: "tenant-1",
  parentOrganizationId: null,
  organizationTypeId: "type-root",
  name: "Acme Corp",
  slug: "acme",
  description: null,
  isActive: true,
  version: 1,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: null,
  deletedAt: null,
};

const member = {
  id: "member-1",
  organizationId: "org-1",
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
  organizationMemberRepository?: unknown;
  organizationRepository?: unknown;
  authorizationClient?: unknown;
  outboxService?: unknown;
  db?: unknown;
}) =>
  new OrganizationMemberService(
    (deps.organizationMemberRepository ?? {
      findOrganizationMemberById: vi.fn().mockResolvedValue(member),
      findOrganizationMemberByOrganizationAndIdentity: vi.fn().mockResolvedValue(null),
      listOrganizationMembersByOrganizationId: vi.fn().mockResolvedValue([member]),
      saveOrganizationMember: vi.fn().mockResolvedValue(member),
      updateOrganizationMemberRole: vi.fn().mockResolvedValue({ ...member, role: "admins" }),
      deleteOrganizationMember: vi.fn().mockResolvedValue(true),
    }) as never,
    (deps.organizationRepository ?? {
      findById: vi.fn().mockResolvedValue(organization),
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

describe("OrganizationMemberService", () => {
  it("creates an organization member and schedules outbox event", async () => {
    const tx = { tx: true };
    const db = createDbMock(tx);
    const organizationMemberRepository = {
      findOrganizationMemberByOrganizationAndIdentity: vi.fn().mockResolvedValue(null),
      saveOrganizationMember: vi.fn().mockResolvedValue(member),
    };
    const authorizationClient = {
      checkRelationship: vi.fn().mockResolvedValue(true),
    };
    const outboxService = {
      schedule: vi.fn().mockResolvedValue({ id: "outbox-1" }),
    };

    const service = createService({
      organizationMemberRepository,
      authorizationClient,
      outboxService,
      db,
    });

    const result = await service.createOrganizationMember(
      {
        organizationId: "org-1",
        identityId: "user-2",
        role: "member",
      },
      actorId,
    );

    expect(result).toEqual(member);
    expect(authorizationClient.checkRelationship).toHaveBeenCalledWith({
      namespace: "Organization",
      object: "org-1",
      relation: "manage_members",
      subject: `Identity:${actorId}`,
    });
    expect(organizationMemberRepository.saveOrganizationMember).toHaveBeenCalledWith(
      {
        organizationId: "org-1",
        identityId: "user-2",
        role: "members",
      },
      { tx },
    );
    expect(outboxService.schedule).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: OrganizationMemberCreatedEvent.type,
        aggregateType: "organization-member",
        aggregateId: "org-1",
      }),
      { tx },
    );
  });

  it("rejects createOrganizationMember when caller lacks permission", async () => {
    const authorizationClient = {
      checkRelationship: vi.fn().mockResolvedValue(false),
    };

    const service = createService({ authorizationClient });

    await expect(
      service.createOrganizationMember(
        {
          organizationId: "org-1",
          identityId: "user-2",
          role: "members",
        },
        actorId,
      ),
    ).rejects.toBeInstanceOf(InsufficientPermissionError);
  });

  it("throws InvalidOrganizationMemberRoleError when role is unrecognized", async () => {
    const service = createService({});

    await expect(
      service.createOrganizationMember(
        {
          organizationId: "org-1",
          identityId: "user-2",
          role: "viewer",
        },
        actorId,
      ),
    ).rejects.toBeInstanceOf(InvalidOrganizationMemberRoleError);
  });

  it("throws OrganizationMemberConflictError when member already exists", async () => {
    const organizationMemberRepository = {
      findOrganizationMemberByOrganizationAndIdentity: vi.fn().mockResolvedValue(member),
    };

    const service = createService({ organizationMemberRepository });

    await expect(
      service.createOrganizationMember(
        {
          organizationId: "org-1",
          identityId: "user-2",
          role: "members",
        },
        actorId,
      ),
    ).rejects.toBeInstanceOf(OrganizationMemberConflictError);
  });

  it("throws OrganizationNotFoundError when organization is missing", async () => {
    const organizationRepository = {
      findById: vi.fn().mockResolvedValue(null),
    };

    const service = createService({ organizationRepository });

    await expect(
      service.createOrganizationMember(
        {
          organizationId: "missing",
          identityId: "user-2",
          role: "members",
        },
        actorId,
      ),
    ).rejects.toBeInstanceOf(OrganizationNotFoundError);
  });

  it("gets an organization member by id", async () => {
    const service = createService({});

    const result = await service.getOrganizationMemberById("member-1", actorId);

    expect(result).toEqual(member);
  });

  it("throws OrganizationMemberNotFoundError when member is missing", async () => {
    const organizationMemberRepository = {
      findOrganizationMemberById: vi.fn().mockResolvedValue(null),
    };

    const service = createService({ organizationMemberRepository });

    await expect(service.getOrganizationMemberById("missing-id", actorId)).rejects.toBeInstanceOf(
      OrganizationMemberNotFoundError,
    );
  });

  it("lists organization members", async () => {
    const service = createService({});

    const result = await service.listOrganizationMembers("org-1", actorId);

    expect(result).toEqual([member]);
  });

  it("updates organization member role and schedules delete then create events", async () => {
    const updatedMember = { ...member, role: "admins" };
    const organizationMemberRepository = {
      findOrganizationMemberById: vi.fn().mockResolvedValue(member),
      updateOrganizationMemberRole: vi.fn().mockResolvedValue(updatedMember),
    };
    const outboxService = {
      schedule: vi.fn().mockResolvedValue({ id: "outbox-1" }),
    };

    const service = createService({ organizationMemberRepository, outboxService });

    const result = await service.updateOrganizationMemberRole("member-1", "admin", actorId);

    expect(result).toEqual(updatedMember);
    expect(outboxService.schedule).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: OrganizationMemberDeletedEvent.type }),
      expect.anything(),
    );
    expect(outboxService.schedule).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: OrganizationMemberCreatedEvent.type }),
      expect.anything(),
    );
  });

  it("deletes an organization member and schedules outbox event", async () => {
    const outboxService = {
      schedule: vi.fn().mockResolvedValue({ id: "outbox-1" }),
    };

    const service = createService({ outboxService });

    await service.deleteOrganizationMember("member-1", actorId);

    expect(outboxService.schedule).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: OrganizationMemberDeletedEvent.type,
      }),
      expect.anything(),
    );
  });
});
