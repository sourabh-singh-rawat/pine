import { InsufficientPermissionError } from "@pine/authorization";
import { describe, expect, it, vi } from "vitest";
import { WorkspaceNotFoundError } from "@/features/workspaces/errors";
import { WorkspacePreferenceService } from "@/features/workspaces/services/WorkspacePreferenceService";

const identityId = "user-1";

const workspace = {
  id: "org-1",
  tenantId: "tenant-1",
  parentWorkspaceId: null,
  name: "Acme Corp",
  slug: "acme",
  description: null,
  isActive: true,
  version: 1,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: null,
  deletedAt: null,
};

const preference = {
  id: "pref-1",
  identityId,
  workspaceId: workspace.id,
  tenantId: workspace.tenantId,
  version: 1,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: null,
  deletedAt: null,
};

const createService = (deps: {
  preferenceRepository?: unknown;
  workspaceRepository?: unknown;
  authorizationClient?: unknown;
}) =>
  new WorkspacePreferenceService(
    (deps.preferenceRepository ?? {}) as never,
    (deps.workspaceRepository ?? {}) as never,
    (deps.authorizationClient ?? {
      checkRelationship: vi.fn().mockResolvedValue(true),
    }) as never,
  );

describe("WorkspacePreferenceService", () => {
  it("returns preference for identity", async () => {
    const preferenceRepository = {
      findByIdentityId: vi.fn().mockResolvedValue(preference),
    };
    const service = createService({ preferenceRepository });

    await expect(service.get(identityId)).resolves.toEqual(preference);
    expect(preferenceRepository.findByIdentityId).toHaveBeenCalledWith(identityId);
  });

  it("sets preference when workspace exists and identity can read it", async () => {
    const workspaceRepository = {
      findById: vi.fn().mockResolvedValue(workspace),
    };
    const preferenceRepository = {
      upsert: vi.fn().mockResolvedValue(preference),
    };
    const authorizationClient = {
      checkRelationship: vi.fn().mockResolvedValue(true),
    };
    const service = createService({
      preferenceRepository,
      workspaceRepository,
      authorizationClient,
    });

    await expect(service.set(workspace.id, identityId)).resolves.toEqual(preference);
    expect(authorizationClient.checkRelationship).toHaveBeenCalledWith({
      namespace: "workspace",
      object: workspace.id,
      relation: "read",
      subject: `identity:${identityId}`,
    });
    expect(preferenceRepository.upsert).toHaveBeenCalledWith({
      identityId,
      workspaceId: workspace.id,
      tenantId: workspace.tenantId,
    });
  });

  it("rejects set when workspace is missing", async () => {
    const workspaceRepository = {
      findById: vi.fn().mockResolvedValue(null),
    };
    const service = createService({ workspaceRepository });

    await expect(service.set("missing", identityId)).rejects.toBeInstanceOf(
      WorkspaceNotFoundError,
    );
  });

  it("rejects set when workspace is inactive", async () => {
    const workspaceRepository = {
      findById: vi.fn().mockResolvedValue({ ...workspace, isActive: false }),
    };
    const service = createService({ workspaceRepository });

    await expect(service.set(workspace.id, identityId)).rejects.toBeInstanceOf(
      WorkspaceNotFoundError,
    );
  });

  it("rejects set when identity lacks read permission", async () => {
    const workspaceRepository = {
      findById: vi.fn().mockResolvedValue(workspace),
    };
    const authorizationClient = {
      checkRelationship: vi.fn().mockResolvedValue(false),
    };
    const service = createService({
      workspaceRepository,
      authorizationClient,
    });

    await expect(service.set(workspace.id, identityId)).rejects.toBeInstanceOf(
      InsufficientPermissionError,
    );
  });
});
