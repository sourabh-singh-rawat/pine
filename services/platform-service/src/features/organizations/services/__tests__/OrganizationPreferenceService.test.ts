import { InsufficientPermissionError } from "@pine/authorization";
import { describe, expect, it, vi } from "vitest";
import { OrganizationNotFoundError } from "@/features/organizations/errors";
import { OrganizationPreferenceService } from "@/features/organizations/services/OrganizationPreferenceService";

const identityId = "user-1";

const organization = {
  id: "org-1",
  tenantId: "tenant-1",
  parentOrganizationId: null,
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
  organizationId: organization.id,
  tenantId: organization.tenantId,
  version: 1,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: null,
  deletedAt: null,
};

const createService = (deps: {
  preferenceRepository?: unknown;
  organizationRepository?: unknown;
  authorizationClient?: unknown;
}) =>
  new OrganizationPreferenceService(
    (deps.preferenceRepository ?? {}) as never,
    (deps.organizationRepository ?? {}) as never,
    (deps.authorizationClient ?? {
      checkRelationship: vi.fn().mockResolvedValue(true),
    }) as never,
  );

describe("OrganizationPreferenceService", () => {
  it("returns preference for identity", async () => {
    const preferenceRepository = {
      findByIdentityId: vi.fn().mockResolvedValue(preference),
    };
    const service = createService({ preferenceRepository });

    await expect(service.get(identityId)).resolves.toEqual(preference);
    expect(preferenceRepository.findByIdentityId).toHaveBeenCalledWith(identityId);
  });

  it("sets preference when organization exists and identity can read it", async () => {
    const organizationRepository = {
      findById: vi.fn().mockResolvedValue(organization),
    };
    const preferenceRepository = {
      upsert: vi.fn().mockResolvedValue(preference),
    };
    const authorizationClient = {
      checkRelationship: vi.fn().mockResolvedValue(true),
    };
    const service = createService({
      preferenceRepository,
      organizationRepository,
      authorizationClient,
    });

    await expect(service.set(organization.id, identityId)).resolves.toEqual(preference);
    expect(authorizationClient.checkRelationship).toHaveBeenCalledWith({
      namespace: "organization",
      object: organization.id,
      relation: "read",
      subject: `identity:${identityId}`,
    });
    expect(preferenceRepository.upsert).toHaveBeenCalledWith({
      identityId,
      organizationId: organization.id,
      tenantId: organization.tenantId,
    });
  });

  it("rejects set when organization is missing", async () => {
    const organizationRepository = {
      findById: vi.fn().mockResolvedValue(null),
    };
    const service = createService({ organizationRepository });

    await expect(service.set("missing", identityId)).rejects.toBeInstanceOf(
      OrganizationNotFoundError,
    );
  });

  it("rejects set when organization is inactive", async () => {
    const organizationRepository = {
      findById: vi.fn().mockResolvedValue({ ...organization, isActive: false }),
    };
    const service = createService({ organizationRepository });

    await expect(service.set(organization.id, identityId)).rejects.toBeInstanceOf(
      OrganizationNotFoundError,
    );
  });

  it("rejects set when identity lacks read permission", async () => {
    const organizationRepository = {
      findById: vi.fn().mockResolvedValue(organization),
    };
    const authorizationClient = {
      checkRelationship: vi.fn().mockResolvedValue(false),
    };
    const service = createService({
      organizationRepository,
      authorizationClient,
    });

    await expect(service.set(organization.id, identityId)).rejects.toBeInstanceOf(
      InsufficientPermissionError,
    );
  });
});
