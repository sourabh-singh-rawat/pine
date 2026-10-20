import { InsufficientPermissionError, type IAuthorizationClient } from "@pine/authorization";
import { describe, expect, it, vi } from "vitest";
import type { OrganizationType, Tenant } from "@/db";
import {
  InvalidParentOrganizationTypeError,
  OrganizationTypeConflictError,
  OrganizationTypeInUseError,
  OrganizationTypeNotFoundError,
} from "@/features/organization-types/errors";
import type { IOrganizationTypeRepository } from "@/features/organization-types/repositories/IOrganizationTypeRepository";
import { OrganizationTypeService } from "@/features/organization-types/services/OrganizationTypeService";
import { TenantNotFoundError } from "@/features/tenants/errors";
import type { ITenantRepository } from "@/features/tenants/repositories";

const tenant: Tenant = {
  id: "tenant-1",
  name: "LDA",
  slug: "lda",
  description: null,
  isActive: true,
  version: 1,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: null,
  deletedAt: null,
};

const organizationType: OrganizationType = {
  id: "type-1",
  tenantId: tenant.id,
  parentOrganizationTypeId: null,
  name: "Head office",
  slug: "head-office",
  description: null,
  isActive: true,
  version: 1,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: null,
  deletedAt: null,
};

const identityId = "user-1";

const createAuthorizationClient = (
  overrides: Partial<IAuthorizationClient> = {},
): IAuthorizationClient => ({
  checkRelationship: vi.fn().mockResolvedValue(true),
  ensureRelationship: vi.fn().mockResolvedValue({ created: true }),
  deleteRelationship: vi.fn().mockResolvedValue({ deleted: true }),
  listRelationships: vi.fn().mockResolvedValue([]),
  ...overrides,
});

const createTenantRepository = (overrides: Partial<ITenantRepository> = {}): ITenantRepository => ({
  save: vi.fn(),
  findById: vi.fn().mockResolvedValue(tenant),
  findByIds: vi.fn().mockResolvedValue([]),
  findBySlug: vi.fn(),
  existsBySlug: vi.fn(),
  existsByName: vi.fn(),
  findAll: vi.fn().mockResolvedValue([]),
  softDelete: vi.fn(),
  ...overrides,
});

const createOrganizationTypeRepository = (
  overrides: Partial<IOrganizationTypeRepository> = {},
): IOrganizationTypeRepository => ({
  save: vi.fn().mockResolvedValue(organizationType),
  findById: vi.fn().mockResolvedValue(organizationType),
  findManyByTenant: vi.fn().mockResolvedValue([organizationType]),
  existsBySlugInTenant: vi.fn().mockResolvedValue(false),
  existsByNameInTenant: vi.fn().mockResolvedValue(false),
  existsByParentOrganizationTypeId: vi.fn().mockResolvedValue(false),
  softDelete: vi.fn().mockResolvedValue(true),
  ...overrides,
});

const createService = (deps: {
  organizationTypeRepository?: IOrganizationTypeRepository;
  tenantRepository?: ITenantRepository;
  authorizationClient?: IAuthorizationClient;
}) =>
  new OrganizationTypeService(
    deps.organizationTypeRepository ?? createOrganizationTypeRepository(),
    deps.tenantRepository ?? createTenantRepository(),
    deps.authorizationClient ?? createAuthorizationClient(),
  );

describe("OrganizationTypeService", () => {
  it("creates a root organization type in the tenant", async () => {
    const organizationTypeRepository = createOrganizationTypeRepository();
    const service = createService({ organizationTypeRepository });

    const created = await service.create(
      {
        tenantId: tenant.id,
        name: "Head office",
        slug: "head-office",
      },
      identityId,
    );

    expect(created).toBe(organizationType);
    expect(organizationTypeRepository.save).toHaveBeenCalledWith({
      tenantId: tenant.id,
      parentOrganizationTypeId: undefined,
      name: "Head office",
      slug: "head-office",
      description: undefined,
      isActive: undefined,
    });
  });

  it("rejects a parent organization type from another tenant", async () => {
    const service = createService({
      organizationTypeRepository: createOrganizationTypeRepository({
        findById: vi.fn().mockResolvedValue({ ...organizationType, tenantId: "other-tenant" }),
      }),
    });

    await expect(
      service.create(
        {
          tenantId: tenant.id,
          parentOrganizationTypeId: organizationType.id,
          name: "Zonal office",
          slug: "zonal-office",
        },
        identityId,
      ),
    ).rejects.toBeInstanceOf(InvalidParentOrganizationTypeError);
  });

  it("rejects a duplicate slug", async () => {
    const service = createService({
      organizationTypeRepository: createOrganizationTypeRepository({
        existsBySlugInTenant: vi.fn().mockResolvedValue(true),
      }),
    });

    await expect(
      service.create(
        {
          tenantId: tenant.id,
          name: "Head office",
          slug: "head-office",
        },
        identityId,
      ),
    ).rejects.toBeInstanceOf(OrganizationTypeConflictError);
  });

  it("rejects a missing tenant", async () => {
    const service = createService({
      tenantRepository: createTenantRepository({ findById: vi.fn().mockResolvedValue(null) }),
    });

    await expect(
      service.create(
        {
          tenantId: tenant.id,
          name: "Head office",
          slug: "head-office",
        },
        identityId,
      ),
    ).rejects.toBeInstanceOf(TenantNotFoundError);
  });

  it("rejects delete when a child type still points at it", async () => {
    const service = createService({
      organizationTypeRepository: createOrganizationTypeRepository({
        existsByParentOrganizationTypeId: vi.fn().mockResolvedValue(true),
      }),
    });

    await expect(service.delete(organizationType.id, identityId)).rejects.toBeInstanceOf(
      OrganizationTypeInUseError,
    );
  });

  it("rejects delete when the organization type does not exist", async () => {
    const service = createService({
      organizationTypeRepository: createOrganizationTypeRepository({
        findById: vi.fn().mockResolvedValue(null),
      }),
    });

    await expect(service.delete(organizationType.id, identityId)).rejects.toBeInstanceOf(
      OrganizationTypeNotFoundError,
    );
  });

  it("rejects create without manage_organization_types", async () => {
    const service = createService({
      authorizationClient: createAuthorizationClient({
        checkRelationship: vi.fn().mockResolvedValue(false),
      }),
    });

    await expect(
      service.create(
        {
          tenantId: tenant.id,
          name: "Head office",
          slug: "head-office",
        },
        identityId,
      ),
    ).rejects.toBeInstanceOf(InsufficientPermissionError);
  });
});
