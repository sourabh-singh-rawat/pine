import { InsufficientPermissionError } from "@pine/authorization";
import { WorkspaceCreatedEvent, WorkspaceRelationCreatedEvent } from "@pine/events";
import { describe, expect, it, vi } from "vitest";
import {
  InvalidParentWorkspaceError,
  WorkspaceNameConflictError,
  WorkspaceNotFoundError,
  WorkspaceSlugConflictError,
} from "@/features/workspaces/errors";
import { WorkspaceService } from "@/features/workspaces/services/WorkspaceService";
import { TenantNotFoundError } from "@/features/tenants/errors";

const tenant = {
  id: "tenant-1",
  name: "Acme Tenant",
  slug: "acme-tenant",
  description: null,
  isActive: true,
  version: 1,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: null,
  deletedAt: null,
};

const workspace = {
  id: "org-1",
  tenantId: "tenant-1",
  parentWorkspaceId: null,
  name: "Acme Corp",
  slug: "acme",
  description: "Primary workspace",
  isActive: true,
  version: 1,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: null,
  deletedAt: null,
};

const childWorkspace = {
  ...workspace,
  id: "org-2",
  parentWorkspaceId: "org-1",
  name: "Acme Division",
  slug: "acme-division",
};

const identityId = "user-1";

const createService = (deps: {
  workspaceRepository?: unknown;
  tenantRepository?: unknown;
  authorizationClient?: unknown;
  outboxService?: unknown;
  db?: unknown;
}) =>
  new WorkspaceService(
    (deps.workspaceRepository ?? {}) as never,
    (deps.tenantRepository ?? {
      findById: vi.fn().mockResolvedValue(tenant),
    }) as never,
    (deps.authorizationClient ?? {
      checkRelationship: vi.fn().mockResolvedValue(true),
      ensureRelationship: vi.fn().mockResolvedValue(undefined),
      deleteRelationship: vi.fn().mockResolvedValue(undefined),
      listRelationships: vi.fn().mockResolvedValue([]),
    }) as never,
    (deps.outboxService ?? {
      schedule: vi.fn().mockResolvedValue({ id: "outbox-1" }),
    }) as never,
    (deps.db ?? {
      transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn({})),
    }) as never,
  );

describe("WorkspaceService", () => {
  it("lists workspaces for a tenant", async () => {
    const workspaceRepository = {
      findMany: vi.fn().mockResolvedValue([workspace]),
    };
    const authorizationClient = {
      checkRelationship: vi.fn().mockResolvedValue(true),
      ensureRelationship: vi.fn().mockResolvedValue(undefined),
      deleteRelationship: vi.fn().mockResolvedValue(undefined),
    };

    const service = createService({ workspaceRepository, authorizationClient });

    await expect(
      service.list({ tenantId: "tenant-1" }, identityId),
    ).resolves.toEqual([workspace]);
    expect(authorizationClient.checkRelationship).toHaveBeenCalledWith({
      namespace: "tenant",
      object: "tenant-1",
      relation: "read_list",
      subject: `identity:${identityId}`,
    });
    expect(workspaceRepository.findMany).toHaveBeenCalledWith({
      tenantId: "tenant-1",
      parentWorkspaceId: undefined,
    });
  });

  it("gets an workspace by id", async () => {
    const workspaceRepository = {
      findById: vi.fn().mockResolvedValue(workspace),
    };
    const authorizationClient = {
      checkRelationship: vi.fn().mockResolvedValue(true),
      ensureRelationship: vi.fn().mockResolvedValue(undefined),
      deleteRelationship: vi.fn().mockResolvedValue(undefined),
    };

    const service = createService({ workspaceRepository, authorizationClient });

    await expect(service.getById(workspace.id, identityId)).resolves.toEqual(
      workspace,
    );
    expect(authorizationClient.checkRelationship).toHaveBeenCalledWith({
      namespace: "workspace",
      object: workspace.id,
      relation: "read",
      subject: `identity:${identityId}`,
    });
    expect(workspaceRepository.findById).toHaveBeenCalledWith(workspace.id);
  });

  it("rejects get when the caller lacks permission", async () => {
    const workspaceRepository = {
      findById: vi.fn(),
    };
    const authorizationClient = {
      checkRelationship: vi.fn().mockResolvedValue(false),
      ensureRelationship: vi.fn().mockResolvedValue(undefined),
      deleteRelationship: vi.fn().mockResolvedValue(undefined),
    };

    const service = createService({ workspaceRepository, authorizationClient });

    await expect(service.getById(workspace.id, identityId)).rejects.toBeInstanceOf(
      InsufficientPermissionError,
    );
    expect(workspaceRepository.findById).not.toHaveBeenCalled();
  });

  it("rejects get when workspace is missing", async () => {
    const workspaceRepository = {
      findById: vi.fn().mockResolvedValue(null),
    };

    const service = createService({ workspaceRepository });

    await expect(service.getById("missing", identityId)).rejects.toBeInstanceOf(
      WorkspaceNotFoundError,
    );
  });

  it("rejects list when the caller lacks permission", async () => {
    const workspaceRepository = {
      findMany: vi.fn(),
    };
    const authorizationClient = {
      checkRelationship: vi.fn().mockResolvedValue(false),
      ensureRelationship: vi.fn().mockResolvedValue(undefined),
      deleteRelationship: vi.fn().mockResolvedValue(undefined),
    };

    const service = createService({ workspaceRepository, authorizationClient });

    await expect(
      service.list({ tenantId: "tenant-1" }, identityId),
    ).rejects.toBeInstanceOf(InsufficientPermissionError);
    expect(workspaceRepository.findMany).not.toHaveBeenCalled();
  });

  it("rejects list when tenant is missing", async () => {
    const workspaceRepository = {
      findMany: vi.fn(),
    };
    const tenantRepository = {
      findById: vi.fn().mockResolvedValue(null),
    };

    const service = createService({ workspaceRepository, tenantRepository });

    await expect(
      service.list({ tenantId: "missing" }, identityId),
    ).rejects.toBeInstanceOf(TenantNotFoundError);
    expect(workspaceRepository.findMany).not.toHaveBeenCalled();
  });

  it("creates a root workspace and assigns creator as catalog owner", async () => {
    const workspaceRepository = {
      existsBySlugInTenant: vi.fn().mockResolvedValue(false),
      existsByNameInTenant: vi.fn().mockResolvedValue(false),
      save: vi.fn().mockResolvedValue(workspace),
    };
    const authorizationClient = {
      checkRelationship: vi.fn().mockResolvedValue(true),
      ensureRelationship: vi.fn().mockResolvedValue(undefined),
      deleteRelationship: vi.fn().mockResolvedValue(undefined),
      listRelationships: vi.fn().mockResolvedValue([]),
    };
    const outboxService = {
      schedule: vi.fn().mockResolvedValue({ id: "outbox-1" }),
    };

    const service = createService({
      workspaceRepository,
      authorizationClient,
      outboxService,
    });

    await expect(
      service.create(
        {
          tenantId: "tenant-1",
          name: "Acme Corp",
          slug: "acme",
          description: "Primary workspace",
        },
        identityId,
      ),
    ).resolves.toEqual(workspace);

    expect(authorizationClient.checkRelationship).toHaveBeenCalledWith({
      namespace: "tenant",
      object: "tenant-1",
      relation: "create_workspace",
      subject: `identity:${identityId}`,
    });
    expect(workspaceRepository.save).toHaveBeenCalledWith(
      {
        tenantId: "tenant-1",
        parentWorkspaceId: undefined,
        name: "Acme Corp",
        slug: "acme",
        description: "Primary workspace",
        isActive: undefined,
      },
      { tx: {} },
    );
    expect(authorizationClient.ensureRelationship).not.toHaveBeenCalled();
    expect(outboxService.schedule).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: WorkspaceCreatedEvent.type,
        eventVersion: WorkspaceCreatedEvent.version,
        aggregateType: "workspace",
        aggregateId: workspace.id,
        payload: expect.objectContaining({
          type: WorkspaceCreatedEvent.type,
          subject: workspace.id,
          data: expect.objectContaining({
            id: workspace.id,
            tenantId: workspace.tenantId,
            name: workspace.name,
            slug: workspace.slug,
          }),
        }),
      }),
      { tx: {} },
    );
    expect(outboxService.schedule).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: WorkspaceRelationCreatedEvent.type,
        eventVersion: WorkspaceRelationCreatedEvent.version,
        aggregateType: "workspace-relation",
        aggregateId: workspace.id,
        payload: expect.objectContaining({
          type: WorkspaceRelationCreatedEvent.type,
          subject: `${workspace.id}:owner:${identityId}`,
          data: expect.objectContaining({
            workspaceId: workspace.id,
            identityId,
            relation: "owner",
          }),
        }),
      }),
      { tx: {} },
    );
  });

  it("creates a child workspace when parent is in the same tenant", async () => {
    const workspaceRepository = {
      findById: vi.fn().mockResolvedValue(workspace),
      existsBySlugInTenant: vi.fn().mockResolvedValue(false),
      existsByNameInTenant: vi.fn().mockResolvedValue(false),
      save: vi.fn().mockResolvedValue(childWorkspace),
    };
    const authorizationClient = {
      checkRelationship: vi.fn().mockResolvedValue(true),
      ensureRelationship: vi.fn().mockResolvedValue(undefined),
      deleteRelationship: vi.fn().mockResolvedValue(undefined),
      listRelationships: vi.fn().mockResolvedValue([]),
    };

    const service = createService({
      workspaceRepository,
      authorizationClient,
    });

    await expect(
      service.create(
        {
          tenantId: "tenant-1",
          parentWorkspaceId: "org-1",
          name: "Acme Division",
          slug: "acme-division",
        },
        identityId,
      ),
    ).resolves.toEqual(childWorkspace);

    expect(workspaceRepository.findById).toHaveBeenCalledWith("org-1");
    expect(workspaceRepository.save).toHaveBeenCalledWith(
      {
        tenantId: "tenant-1",
        parentWorkspaceId: "org-1",
        name: "Acme Division",
        slug: "acme-division",
        description: undefined,
        isActive: undefined,
      },
      { tx: {} },
    );
    expect(authorizationClient.ensureRelationship).not.toHaveBeenCalled();
  });

  it("rejects create when parent workspace is missing or in another tenant", async () => {
    const workspaceRepository = {
      findById: vi.fn().mockResolvedValue({ ...workspace, tenantId: "other-tenant" }),
      existsBySlugInTenant: vi.fn(),
      save: vi.fn(),
    };

    const service = createService({ workspaceRepository });

    await expect(
      service.create(
        {
          tenantId: "tenant-1",
          parentWorkspaceId: "org-1",
          name: "Acme Division",
          slug: "acme-division",
        },
        identityId,
      ),
    ).rejects.toBeInstanceOf(InvalidParentWorkspaceError);
    expect(workspaceRepository.save).not.toHaveBeenCalled();
  });

  it("rejects create when tenant is missing", async () => {
    const workspaceRepository = {
      save: vi.fn(),
    };
    const tenantRepository = {
      findById: vi.fn().mockResolvedValue(null),
    };

    const service = createService({ workspaceRepository, tenantRepository });

    await expect(
      service.create(
        { tenantId: "missing", name: "Acme Corp", slug: "acme" },
        identityId,
      ),
    ).rejects.toBeInstanceOf(TenantNotFoundError);
    expect(workspaceRepository.save).not.toHaveBeenCalled();
  });

  it("rejects create when slug already exists in the tenant", async () => {
    const workspaceRepository = {
      existsBySlugInTenant: vi.fn().mockResolvedValue(true),
      existsByNameInTenant: vi.fn(),
      save: vi.fn(),
    };

    const service = createService({ workspaceRepository });

    await expect(
      service.create(
        { tenantId: "tenant-1", name: "Acme Corp", slug: "acme" },
        identityId,
      ),
    ).rejects.toBeInstanceOf(WorkspaceSlugConflictError);
    expect(workspaceRepository.existsByNameInTenant).not.toHaveBeenCalled();
    expect(workspaceRepository.save).not.toHaveBeenCalled();
  });

  it("rejects create when name already exists in the tenant", async () => {
    const workspaceRepository = {
      existsBySlugInTenant: vi.fn().mockResolvedValue(false),
      existsByNameInTenant: vi.fn().mockResolvedValue(true),
      save: vi.fn(),
    };

    const service = createService({ workspaceRepository });

    await expect(
      service.create(
        { tenantId: "tenant-1", name: "Acme Corp", slug: "acme" },
        identityId,
      ),
    ).rejects.toBeInstanceOf(WorkspaceNameConflictError);
    expect(workspaceRepository.save).not.toHaveBeenCalled();
  });

  it("updates the parent workspace", async () => {
    const updated = { ...childWorkspace, parentWorkspaceId: null };
    const workspaceRepository = {
      findById: vi.fn().mockResolvedValue(childWorkspace),
      update: vi.fn().mockResolvedValue(updated),
    };
    const authorizationClient = {
      checkRelationship: vi.fn().mockResolvedValue(true),
      ensureRelationship: vi.fn().mockResolvedValue(undefined),
      deleteRelationship: vi.fn().mockResolvedValue(undefined),
    };

    const service = createService({ workspaceRepository, authorizationClient });

    await expect(
      service.update("org-2", { parentWorkspaceId: null }, identityId),
    ).resolves.toEqual(updated);
    expect(authorizationClient.checkRelationship).toHaveBeenCalledWith({
      namespace: "workspace",
      object: "org-2",
      relation: "update",
      subject: `identity:${identityId}`,
    });
    expect(workspaceRepository.update).toHaveBeenCalledWith("org-2", {
      parentWorkspaceId: null,
    });
  });

  it("rejects update when the parent would create a cycle", async () => {
    const workspaceRepository = {
      findById: vi
        .fn()
        .mockResolvedValueOnce(workspace)
        .mockResolvedValueOnce(childWorkspace),
      update: vi.fn(),
    };

    const service = createService({ workspaceRepository });

    await expect(
      service.update("org-1", { parentWorkspaceId: "org-2" }, identityId),
    ).rejects.toBeInstanceOf(InvalidParentWorkspaceError);
    expect(workspaceRepository.update).not.toHaveBeenCalled();
  });

  it("rejects update when the workspace is missing", async () => {
    const workspaceRepository = {
      findById: vi.fn().mockResolvedValue(null),
      update: vi.fn(),
    };

    const service = createService({ workspaceRepository });

    await expect(
      service.update("missing", { parentWorkspaceId: null }, identityId),
    ).rejects.toBeInstanceOf(WorkspaceNotFoundError);
    expect(workspaceRepository.update).not.toHaveBeenCalled();
  });

  it("soft-deletes an workspace", async () => {
    const workspaceRepository = {
      softDelete: vi.fn().mockResolvedValue(true),
    };
    const authorizationClient = {
      checkRelationship: vi.fn().mockResolvedValue(true),
      ensureRelationship: vi.fn().mockResolvedValue(undefined),
      deleteRelationship: vi.fn().mockResolvedValue(undefined),
    };

    const service = createService({ workspaceRepository, authorizationClient });

    await expect(service.delete("org-1", identityId)).resolves.toBeUndefined();
    expect(authorizationClient.checkRelationship).toHaveBeenCalledWith({
      namespace: "workspace",
      object: "org-1",
      relation: "delete",
      subject: `identity:${identityId}`,
    });
    expect(workspaceRepository.softDelete).toHaveBeenCalledWith("org-1");
  });

  it("throws WorkspaceNotFoundError when deleting a missing workspace", async () => {
    const workspaceRepository = {
      softDelete: vi.fn().mockResolvedValue(false),
    };

    const service = createService({ workspaceRepository });

    await expect(service.delete("missing", identityId)).rejects.toBeInstanceOf(
      WorkspaceNotFoundError,
    );
  });

  it("lists my workspaces for identity as a forest", async () => {
    const workspaceRepository = {
      findByIds: vi.fn().mockResolvedValue([workspace, childWorkspace]),
    };
    const authorizationClient = {
      listRelationships: vi.fn().mockResolvedValue([
        {
          object: { namespace: "workspace", id: workspace.id },
          relation: "member",
          subject: { namespace: "identity", id: identityId },
        },
        {
          object: { namespace: "workspace", id: childWorkspace.id },
          relation: "member",
          subject: { namespace: "identity", id: identityId },
        },
      ]),
    };

    const service = createService({ workspaceRepository, authorizationClient });

    await expect(service.listMyWorkspaces(identityId)).resolves.toEqual([
      {
        ...workspace,
        children: [
          {
            ...childWorkspace,
            children: [],
          },
        ],
      },
    ]);
    expect(authorizationClient.listRelationships).toHaveBeenCalledWith({
      namespace: "workspace",
      subject: { namespace: "identity", id: identityId },
    });
    expect(workspaceRepository.findByIds).toHaveBeenCalledWith([
      workspace.id,
      childWorkspace.id,
    ]);
  });

  it("returns empty list if identity has no workspace relationships", async () => {
    const workspaceRepository = {
      findByIds: vi.fn().mockResolvedValue([]),
    };
    const authorizationClient = {
      listRelationships: vi.fn().mockResolvedValue([]),
    };

    const service = createService({ workspaceRepository, authorizationClient });

    await expect(service.listMyWorkspaces(identityId)).resolves.toEqual([]);
    expect(workspaceRepository.findByIds).not.toHaveBeenCalled();
  });
});
