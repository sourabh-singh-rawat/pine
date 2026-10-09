import { InsufficientPermissionError } from "@pine/authorization";
import { OrganizationCreatedEvent, OrganizationRelationCreatedEvent } from "@pine/events";
import { describe, expect, it, vi } from "vitest";
import {
  InvalidParentOrganizationError,
  OrganizationNameConflictError,
  OrganizationNotFoundError,
  OrganizationSlugConflictError,
} from "@/features/organizations/errors";
import { OrganizationService } from "@/features/organizations/services/OrganizationService";
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

const organization = {
  id: "org-1",
  tenantId: "tenant-1",
  parentOrganizationId: null,
  officeTypeId: "type-root",
  name: "Acme Corp",
  slug: "acme",
  description: "Primary organization",
  isActive: true,
  version: 1,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: null,
  deletedAt: null,
};

const childOrganization = {
  ...organization,
  id: "org-2",
  parentOrganizationId: "org-1",
  officeTypeId: "type-child",
  name: "Acme Division",
  slug: "acme-division",
};

const identityId = "user-1";

const createService = (deps: {
  organizationRepository?: unknown;
  tenantRepository?: unknown;
  officeTypeRepository?: unknown;
  authorizationClient?: unknown;
  outboxService?: unknown;
  db?: unknown;
}) =>
  new OrganizationService(
    (deps.organizationRepository ?? {}) as never,
    (deps.tenantRepository ?? {
      findById: vi.fn().mockResolvedValue(tenant),
    }) as never,
    (deps.officeTypeRepository ?? {
      findById: vi.fn().mockImplementation(async (id: string) => ({
        id,
        tenantId: "tenant-1",
        parentOfficeTypeId:
          id === "type-child" ? "type-root" : id === "type-under-child" ? "type-child" : null,
      })),
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

describe("OrganizationService", () => {
  it("lists organizations for a tenant", async () => {
    const organizationRepository = {
      findMany: vi.fn().mockResolvedValue([organization]),
    };
    const authorizationClient = {
      checkRelationship: vi.fn().mockResolvedValue(true),
      ensureRelationship: vi.fn().mockResolvedValue(undefined),
      deleteRelationship: vi.fn().mockResolvedValue(undefined),
    };

    const service = createService({ organizationRepository, authorizationClient });

    await expect(service.list({ tenantId: "tenant-1" }, identityId)).resolves.toEqual([
      organization,
    ]);
    expect(authorizationClient.checkRelationship).toHaveBeenCalledWith({
      namespace: "tenant",
      object: "tenant-1",
      relation: "read_list",
      subject: `identity:${identityId}`,
    });
    expect(organizationRepository.findMany).toHaveBeenCalledWith({
      tenantId: "tenant-1",
      parentOrganizationId: undefined,
    });
  });

  it("gets an organization by id", async () => {
    const organizationRepository = {
      findById: vi.fn().mockResolvedValue(organization),
    };
    const authorizationClient = {
      checkRelationship: vi.fn().mockResolvedValue(true),
      ensureRelationship: vi.fn().mockResolvedValue(undefined),
      deleteRelationship: vi.fn().mockResolvedValue(undefined),
    };

    const service = createService({ organizationRepository, authorizationClient });

    await expect(service.getById(organization.id, identityId)).resolves.toEqual(organization);
    expect(authorizationClient.checkRelationship).toHaveBeenCalledWith({
      namespace: "organization",
      object: organization.id,
      relation: "read",
      subject: `identity:${identityId}`,
    });
    expect(organizationRepository.findById).toHaveBeenCalledWith(organization.id);
  });

  it("rejects get when the caller lacks permission", async () => {
    const organizationRepository = {
      findById: vi.fn(),
    };
    const authorizationClient = {
      checkRelationship: vi.fn().mockResolvedValue(false),
      ensureRelationship: vi.fn().mockResolvedValue(undefined),
      deleteRelationship: vi.fn().mockResolvedValue(undefined),
    };

    const service = createService({ organizationRepository, authorizationClient });

    await expect(service.getById(organization.id, identityId)).rejects.toBeInstanceOf(
      InsufficientPermissionError,
    );
    expect(organizationRepository.findById).not.toHaveBeenCalled();
  });

  it("rejects get when organization is missing", async () => {
    const organizationRepository = {
      findById: vi.fn().mockResolvedValue(null),
    };

    const service = createService({ organizationRepository });

    await expect(service.getById("missing", identityId)).rejects.toBeInstanceOf(
      OrganizationNotFoundError,
    );
  });

  it("rejects list when the caller lacks permission", async () => {
    const organizationRepository = {
      findMany: vi.fn(),
    };
    const authorizationClient = {
      checkRelationship: vi.fn().mockResolvedValue(false),
      ensureRelationship: vi.fn().mockResolvedValue(undefined),
      deleteRelationship: vi.fn().mockResolvedValue(undefined),
    };

    const service = createService({ organizationRepository, authorizationClient });

    await expect(service.list({ tenantId: "tenant-1" }, identityId)).rejects.toBeInstanceOf(
      InsufficientPermissionError,
    );
    expect(organizationRepository.findMany).not.toHaveBeenCalled();
  });

  it("rejects list when tenant is missing", async () => {
    const organizationRepository = {
      findMany: vi.fn(),
    };
    const tenantRepository = {
      findById: vi.fn().mockResolvedValue(null),
    };

    const service = createService({ organizationRepository, tenantRepository });

    await expect(service.list({ tenantId: "missing" }, identityId)).rejects.toBeInstanceOf(
      TenantNotFoundError,
    );
    expect(organizationRepository.findMany).not.toHaveBeenCalled();
  });

  it("creates a root organization and assigns creator as catalog owner", async () => {
    const organizationRepository = {
      existsBySlugInTenant: vi.fn().mockResolvedValue(false),
      existsByNameInTenant: vi.fn().mockResolvedValue(false),
      save: vi.fn().mockResolvedValue(organization),
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
      organizationRepository,
      authorizationClient,
      outboxService,
    });

    await expect(
      service.create(
        {
          tenantId: "tenant-1",
          officeTypeId: "type-root",
          name: "Acme Corp",
          slug: "acme",
          description: "Primary organization",
        },
        identityId,
      ),
    ).resolves.toEqual(organization);

    expect(authorizationClient.checkRelationship).toHaveBeenCalledWith({
      namespace: "tenant",
      object: "tenant-1",
      relation: "create_organization",
      subject: `identity:${identityId}`,
    });
    expect(organizationRepository.save).toHaveBeenCalledWith(
      {
        tenantId: "tenant-1",
        parentOrganizationId: undefined,
        officeTypeId: "type-root",
        name: "Acme Corp",
        slug: "acme",
        description: "Primary organization",
        isActive: undefined,
      },
      { tx: {} },
    );
    expect(authorizationClient.ensureRelationship).not.toHaveBeenCalled();
    expect(outboxService.schedule).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: OrganizationCreatedEvent.type,
        eventVersion: OrganizationCreatedEvent.version,
        aggregateType: "organization",
        aggregateId: organization.id,
        payload: expect.objectContaining({
          type: OrganizationCreatedEvent.type,
          subject: organization.id,
          data: expect.objectContaining({
            id: organization.id,
            tenantId: organization.tenantId,
            name: organization.name,
            slug: organization.slug,
          }),
        }),
      }),
      { tx: {} },
    );
    expect(outboxService.schedule).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: OrganizationRelationCreatedEvent.type,
        eventVersion: OrganizationRelationCreatedEvent.version,
        aggregateType: "organization-relation",
        aggregateId: organization.id,
        payload: expect.objectContaining({
          type: OrganizationRelationCreatedEvent.type,
          subject: `${organization.id}:owner:${identityId}`,
          data: expect.objectContaining({
            organizationId: organization.id,
            identityId,
            relation: "owner",
          }),
        }),
      }),
      { tx: {} },
    );
  });

  it("creates a child organization when parent is in the same tenant", async () => {
    const organizationRepository = {
      findById: vi.fn().mockResolvedValue(organization),
      existsBySlugInTenant: vi.fn().mockResolvedValue(false),
      existsByNameInTenant: vi.fn().mockResolvedValue(false),
      save: vi.fn().mockResolvedValue(childOrganization),
    };
    const authorizationClient = {
      checkRelationship: vi.fn().mockResolvedValue(true),
      ensureRelationship: vi.fn().mockResolvedValue(undefined),
      deleteRelationship: vi.fn().mockResolvedValue(undefined),
      listRelationships: vi.fn().mockResolvedValue([]),
    };

    const service = createService({
      organizationRepository,
      authorizationClient,
    });

    await expect(
      service.create(
        {
          tenantId: "tenant-1",
          parentOrganizationId: "org-1",
          officeTypeId: "type-child",
          name: "Acme Division",
          slug: "acme-division",
        },
        identityId,
      ),
    ).resolves.toEqual(childOrganization);

    expect(organizationRepository.findById).toHaveBeenCalledWith("org-1");
    expect(organizationRepository.save).toHaveBeenCalledWith(
      {
        tenantId: "tenant-1",
        parentOrganizationId: "org-1",
        officeTypeId: "type-child",
        name: "Acme Division",
        slug: "acme-division",
        description: undefined,
        isActive: undefined,
      },
      { tx: {} },
    );
    expect(authorizationClient.ensureRelationship).not.toHaveBeenCalled();
  });

  it("rejects create when parent organization is missing or in another tenant", async () => {
    const organizationRepository = {
      findById: vi.fn().mockResolvedValue({ ...organization, tenantId: "other-tenant" }),
      existsBySlugInTenant: vi.fn(),
      save: vi.fn(),
    };

    const service = createService({ organizationRepository });

    await expect(
      service.create(
        {
          tenantId: "tenant-1",
          parentOrganizationId: "org-1",
          officeTypeId: "type-child",
          name: "Acme Division",
          slug: "acme-division",
        },
        identityId,
      ),
    ).rejects.toBeInstanceOf(InvalidParentOrganizationError);
    expect(organizationRepository.save).not.toHaveBeenCalled();
  });

  it("rejects create when tenant is missing", async () => {
    const organizationRepository = {
      save: vi.fn(),
    };
    const tenantRepository = {
      findById: vi.fn().mockResolvedValue(null),
    };

    const service = createService({ organizationRepository, tenantRepository });

    await expect(
      service.create(
        { tenantId: "missing", officeTypeId: "type-root", name: "Acme Corp", slug: "acme" },
        identityId,
      ),
    ).rejects.toBeInstanceOf(TenantNotFoundError);
    expect(organizationRepository.save).not.toHaveBeenCalled();
  });

  it("rejects create when slug already exists in the tenant", async () => {
    const organizationRepository = {
      existsBySlugInTenant: vi.fn().mockResolvedValue(true),
      existsByNameInTenant: vi.fn(),
      save: vi.fn(),
    };

    const service = createService({ organizationRepository });

    await expect(
      service.create(
        { tenantId: "tenant-1", officeTypeId: "type-root", name: "Acme Corp", slug: "acme" },
        identityId,
      ),
    ).rejects.toBeInstanceOf(OrganizationSlugConflictError);
    expect(organizationRepository.existsByNameInTenant).not.toHaveBeenCalled();
    expect(organizationRepository.save).not.toHaveBeenCalled();
  });

  it("rejects create when name already exists in the tenant", async () => {
    const organizationRepository = {
      existsBySlugInTenant: vi.fn().mockResolvedValue(false),
      existsByNameInTenant: vi.fn().mockResolvedValue(true),
      save: vi.fn(),
    };

    const service = createService({ organizationRepository });

    await expect(
      service.create(
        { tenantId: "tenant-1", officeTypeId: "type-root", name: "Acme Corp", slug: "acme" },
        identityId,
      ),
    ).rejects.toBeInstanceOf(OrganizationNameConflictError);
    expect(organizationRepository.save).not.toHaveBeenCalled();
  });

  it("updates the parent organization", async () => {
    const updated = { ...childOrganization, parentOrganizationId: null };
    const organizationRepository = {
      findById: vi.fn().mockResolvedValue({ ...childOrganization, officeTypeId: "type-root" }),
      update: vi.fn().mockResolvedValue(updated),
    };
    const authorizationClient = {
      checkRelationship: vi.fn().mockResolvedValue(true),
      ensureRelationship: vi.fn().mockResolvedValue(undefined),
      deleteRelationship: vi.fn().mockResolvedValue(undefined),
    };

    const service = createService({ organizationRepository, authorizationClient });

    await expect(
      service.update("org-2", { parentOrganizationId: null }, identityId),
    ).resolves.toEqual(updated);
    expect(authorizationClient.checkRelationship).toHaveBeenCalledWith({
      namespace: "organization",
      object: "org-2",
      relation: "update",
      subject: `identity:${identityId}`,
    });
    expect(organizationRepository.update).toHaveBeenCalledWith("org-2", {
      parentOrganizationId: null,
    });
  });

  it("rejects update when the parent would create a cycle", async () => {
    const organizationRepository = {
      findById: vi
        .fn()
        .mockResolvedValueOnce({ ...organization, officeTypeId: "type-under-child" })
        .mockResolvedValueOnce(childOrganization),
      update: vi.fn(),
    };

    const service = createService({ organizationRepository });

    await expect(
      service.update("org-1", { parentOrganizationId: "org-2" }, identityId),
    ).rejects.toBeInstanceOf(InvalidParentOrganizationError);
    expect(organizationRepository.update).not.toHaveBeenCalled();
  });

  it("rejects update when the organization is missing", async () => {
    const organizationRepository = {
      findById: vi.fn().mockResolvedValue(null),
      update: vi.fn(),
    };

    const service = createService({ organizationRepository });

    await expect(
      service.update("missing", { parentOrganizationId: null }, identityId),
    ).rejects.toBeInstanceOf(OrganizationNotFoundError);
    expect(organizationRepository.update).not.toHaveBeenCalled();
  });

  it("soft-deletes an organization", async () => {
    const organizationRepository = {
      softDelete: vi.fn().mockResolvedValue(true),
    };
    const authorizationClient = {
      checkRelationship: vi.fn().mockResolvedValue(true),
      ensureRelationship: vi.fn().mockResolvedValue(undefined),
      deleteRelationship: vi.fn().mockResolvedValue(undefined),
    };

    const service = createService({ organizationRepository, authorizationClient });

    await expect(service.delete("org-1", identityId)).resolves.toBeUndefined();
    expect(authorizationClient.checkRelationship).toHaveBeenCalledWith({
      namespace: "organization",
      object: "org-1",
      relation: "delete",
      subject: `identity:${identityId}`,
    });
    expect(organizationRepository.softDelete).toHaveBeenCalledWith("org-1");
  });

  it("throws OrganizationNotFoundError when deleting a missing organization", async () => {
    const organizationRepository = {
      softDelete: vi.fn().mockResolvedValue(false),
    };

    const service = createService({ organizationRepository });

    await expect(service.delete("missing", identityId)).rejects.toBeInstanceOf(
      OrganizationNotFoundError,
    );
  });

  it("lists my organizations for identity as a forest", async () => {
    const organizationRepository = {
      findByIds: vi.fn().mockResolvedValue([organization, childOrganization]),
    };
    const authorizationClient = {
      listRelationships: vi.fn().mockResolvedValue([
        {
          object: { namespace: "organization", id: organization.id },
          relation: "member",
          subject: { namespace: "identity", id: identityId },
        },
        {
          object: { namespace: "organization", id: childOrganization.id },
          relation: "member",
          subject: { namespace: "identity", id: identityId },
        },
      ]),
    };

    const service = createService({ organizationRepository, authorizationClient });

    await expect(service.listMyOrganizations(identityId)).resolves.toEqual([
      {
        ...organization,
        children: [
          {
            ...childOrganization,
            children: [],
          },
        ],
      },
    ]);
    expect(authorizationClient.listRelationships).toHaveBeenCalledWith({
      namespace: "organization",
      subject: { namespace: "identity", id: identityId },
    });
    expect(organizationRepository.findByIds).toHaveBeenCalledWith([
      organization.id,
      childOrganization.id,
    ]);
  });

  it("returns empty list if identity has no organization relationships", async () => {
    const organizationRepository = {
      findByIds: vi.fn().mockResolvedValue([]),
    };
    const authorizationClient = {
      listRelationships: vi.fn().mockResolvedValue([]),
    };

    const service = createService({ organizationRepository, authorizationClient });

    await expect(service.listMyOrganizations(identityId)).resolves.toEqual([]);
    expect(organizationRepository.findByIds).not.toHaveBeenCalled();
  });
});
