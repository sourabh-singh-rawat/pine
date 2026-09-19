import { PLATFORM_OBJECT_ID } from "@pine/authorization";
import {
  TenantCreatedEvent,
  WorkspaceCreatedEvent,
  WorkspaceRelationCreatedEvent,
} from "@pine/events";
import { describe, expect, it, vi } from "vitest";
import { OnboardingService } from "@/features/onboarding/services/OnboardingService";

const identityId = "01900000-0000-7000-8000-000000000001";

const tenant = {
  id: "tenant-1",
  name: "Personal",
  slug: `personal-${identityId}`,
  description: "Personal tenant",
  isActive: true,
  version: 1,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: null,
  deletedAt: null,
};

const workspace = {
  id: "workspace-1",
  tenantId: tenant.id,
  parentWorkspaceId: null,
  name: "Personal workspace",
  slug: "default",
  description: "Default personal workspace",
  isActive: true,
  version: 1,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: null,
  deletedAt: null,
};

const createDbMock = (tx: unknown = {}) => ({
  transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb(tx)),
});

const createService = (deps: {
  identityRepository?: unknown;
  tenantRepository?: unknown;
  workspaceRepository?: unknown;
  workspacePreferenceRepository?: unknown;
  authorizationClient?: unknown;
  outboxService?: unknown;
  db?: unknown;
}) =>
  new OnboardingService(
    (deps.identityRepository ?? {
      upsert: vi.fn().mockResolvedValue({ id: identityId }),
    }) as never,
    (deps.tenantRepository ?? {
      findBySlug: vi.fn().mockResolvedValue(null),
      save: vi.fn().mockResolvedValue(tenant),
    }) as never,
    (deps.workspaceRepository ?? {
      findMany: vi.fn().mockResolvedValue([]),
      save: vi.fn().mockResolvedValue(workspace),
    }) as never,
    (deps.workspacePreferenceRepository ?? {
      upsert: vi.fn().mockResolvedValue({ id: "pref-1" }),
    }) as never,
    (deps.authorizationClient ?? {
      ensureRelationship: vi.fn().mockResolvedValue({ created: true }),
    }) as never,
    (deps.outboxService ?? {
      schedule: vi.fn().mockResolvedValue({ id: "outbox-1" }),
    }) as never,
    (deps.db ?? createDbMock()) as never,
  );

describe("OnboardingService", () => {
  it("provisions a personal tenant, workspace, owner relation, and preference", async () => {
    const identityRepository = {
      upsert: vi.fn().mockResolvedValue({ id: identityId }),
    };
    const tenantRepository = {
      findBySlug: vi.fn().mockResolvedValue(null),
      save: vi.fn().mockResolvedValue(tenant),
    };
    const workspaceRepository = {
      findMany: vi.fn().mockResolvedValue([]),
      save: vi.fn().mockResolvedValue(workspace),
    };
    const workspacePreferenceRepository = {
      upsert: vi.fn().mockResolvedValue({ id: "pref-1" }),
    };
    const authorizationClient = {
      ensureRelationship: vi.fn().mockResolvedValue({ created: true }),
    };
    const outboxService = {
      schedule: vi.fn().mockResolvedValue({ id: "outbox-1" }),
    };

    const service = createService({
      identityRepository,
      tenantRepository,
      workspaceRepository,
      workspacePreferenceRepository,
      authorizationClient,
      outboxService,
    });

    await expect(service.provisionPersonalWorkspace(identityId)).resolves.toEqual({
      tenant,
      workspace,
      created: true,
    });

    expect(identityRepository.upsert).toHaveBeenCalledWith({ id: identityId }, { tx: {} });
    expect(tenantRepository.save).toHaveBeenCalledWith(
      {
        name: "Personal",
        slug: `personal-${identityId}`,
        description: "Personal tenant",
        isActive: true,
      },
      { tx: {} },
    );
    expect(authorizationClient.ensureRelationship).toHaveBeenCalledWith({
      object: { namespace: "tenant", id: tenant.id },
      relation: "owner",
      subject: { namespace: "identity", id: identityId },
    });
    expect(workspaceRepository.save).toHaveBeenCalledWith(
      {
        tenantId: tenant.id,
        name: "Personal workspace",
        slug: "default",
        description: "Default personal workspace",
        isActive: true,
      },
      { tx: {} },
    );
    expect(workspacePreferenceRepository.upsert).toHaveBeenCalledWith(
      {
        identityId,
        workspaceId: workspace.id,
        tenantId: tenant.id,
      },
      { tx: {} },
    );
    expect(outboxService.schedule).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: TenantCreatedEvent.type,
        aggregateType: "tenant",
        aggregateId: tenant.id,
        payload: expect.objectContaining({
          type: TenantCreatedEvent.type,
          data: expect.objectContaining({
            id: tenant.id,
            platformId: PLATFORM_OBJECT_ID,
            slug: tenant.slug,
          }),
        }),
      }),
      { tx: {} },
    );
    expect(outboxService.schedule).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: WorkspaceCreatedEvent.type,
        aggregateType: "workspace",
        aggregateId: workspace.id,
      }),
      { tx: {} },
    );
    expect(outboxService.schedule).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: WorkspaceRelationCreatedEvent.type,
        aggregateType: "workspace-relation",
        payload: expect.objectContaining({
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

  it("is idempotent when the personal tenant and workspace already exist", async () => {
    const identityRepository = {
      upsert: vi.fn().mockResolvedValue({ id: identityId }),
    };
    const tenantRepository = {
      findBySlug: vi.fn().mockResolvedValue(tenant),
      save: vi.fn(),
    };
    const workspaceRepository = {
      findMany: vi.fn().mockResolvedValue([workspace]),
      save: vi.fn(),
    };
    const workspacePreferenceRepository = {
      upsert: vi.fn().mockResolvedValue({ id: "pref-1" }),
    };
    const authorizationClient = {
      ensureRelationship: vi.fn(),
    };
    const outboxService = {
      schedule: vi.fn(),
    };

    const service = createService({
      identityRepository,
      tenantRepository,
      workspaceRepository,
      workspacePreferenceRepository,
      authorizationClient,
      outboxService,
    });

    await expect(service.provisionPersonalWorkspace(identityId)).resolves.toEqual({
      tenant,
      workspace,
      created: false,
    });

    expect(identityRepository.upsert).toHaveBeenCalledWith({ id: identityId }, { tx: {} });
    expect(tenantRepository.save).not.toHaveBeenCalled();
    expect(workspaceRepository.save).not.toHaveBeenCalled();
    expect(authorizationClient.ensureRelationship).not.toHaveBeenCalled();
    expect(outboxService.schedule).not.toHaveBeenCalled();
    expect(workspacePreferenceRepository.upsert).toHaveBeenCalledWith(
      {
        identityId,
        workspaceId: workspace.id,
        tenantId: tenant.id,
      },
      { tx: {} },
    );
  });

  it("creates the default workspace when the personal tenant already exists", async () => {
    const tenantRepository = {
      findBySlug: vi.fn().mockResolvedValue(tenant),
      save: vi.fn(),
    };
    const workspaceRepository = {
      findMany: vi.fn().mockResolvedValue([]),
      save: vi.fn().mockResolvedValue(workspace),
    };
    const outboxService = {
      schedule: vi.fn().mockResolvedValue({ id: "outbox-1" }),
    };

    const service = createService({
      identityRepository: {
        upsert: vi.fn().mockResolvedValue({ id: identityId }),
      },
      tenantRepository,
      workspaceRepository,
      outboxService,
    });

    await expect(service.provisionPersonalWorkspace(identityId)).resolves.toEqual({
      tenant,
      workspace,
      created: false,
    });

    expect(tenantRepository.save).not.toHaveBeenCalled();
    expect(workspaceRepository.save).toHaveBeenCalledOnce();
    expect(outboxService.schedule).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: WorkspaceCreatedEvent.type }),
      { tx: {} },
    );
    expect(outboxService.schedule).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: WorkspaceRelationCreatedEvent.type }),
      { tx: {} },
    );
  });
});
