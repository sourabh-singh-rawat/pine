import { InsufficientPermissionError, type IAuthorizationClient } from "@pine/authorization";
import { describe, expect, it, vi } from "vitest";
import type { OrganizationOfficeType, Tenant } from "@/db";
import {
  InvalidParentOfficeTypeError,
  OfficeTypeConflictError,
  OfficeTypeInUseError,
  OfficeTypeNotFoundError,
} from "@/features/office-types/errors";
import type { IOfficeTypeRepository } from "@/features/office-types/repositories/IOfficeTypeRepository";
import { OfficeTypeService } from "@/features/office-types/services/OfficeTypeService";
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

const officeType: OrganizationOfficeType = {
  id: "type-1",
  tenantId: tenant.id,
  parentOfficeTypeId: null,
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

const createOfficeTypeRepository = (
  overrides: Partial<IOfficeTypeRepository> = {},
): IOfficeTypeRepository => ({
  save: vi.fn().mockResolvedValue(officeType),
  findById: vi.fn().mockResolvedValue(officeType),
  findManyByTenant: vi.fn().mockResolvedValue([officeType]),
  existsBySlugInTenant: vi.fn().mockResolvedValue(false),
  existsByNameInTenant: vi.fn().mockResolvedValue(false),
  existsByParentOfficeTypeId: vi.fn().mockResolvedValue(false),
  softDelete: vi.fn().mockResolvedValue(true),
  ...overrides,
});

const createService = (deps: {
  officeTypeRepository?: IOfficeTypeRepository;
  tenantRepository?: ITenantRepository;
  authorizationClient?: IAuthorizationClient;
}) =>
  new OfficeTypeService(
    deps.officeTypeRepository ?? createOfficeTypeRepository(),
    deps.tenantRepository ?? createTenantRepository(),
    deps.authorizationClient ?? createAuthorizationClient(),
  );

describe("OfficeTypeService", () => {
  it("creates a root office type in the tenant", async () => {
    const officeTypeRepository = createOfficeTypeRepository();
    const service = createService({ officeTypeRepository });

    const created = await service.create(
      {
        tenantId: tenant.id,
        name: "Head office",
        slug: "head-office",
      },
      identityId,
    );

    expect(created).toBe(officeType);
    expect(officeTypeRepository.save).toHaveBeenCalledWith({
      tenantId: tenant.id,
      parentOfficeTypeId: undefined,
      name: "Head office",
      slug: "head-office",
      description: undefined,
      isActive: undefined,
    });
  });

  it("rejects a parent office type from another tenant", async () => {
    const service = createService({
      officeTypeRepository: createOfficeTypeRepository({
        findById: vi.fn().mockResolvedValue({ ...officeType, tenantId: "other-tenant" }),
      }),
    });

    await expect(
      service.create(
        {
          tenantId: tenant.id,
          parentOfficeTypeId: officeType.id,
          name: "Zonal office",
          slug: "zonal-office",
        },
        identityId,
      ),
    ).rejects.toBeInstanceOf(InvalidParentOfficeTypeError);
  });

  it("rejects a duplicate slug", async () => {
    const service = createService({
      officeTypeRepository: createOfficeTypeRepository({
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
    ).rejects.toBeInstanceOf(OfficeTypeConflictError);
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
      officeTypeRepository: createOfficeTypeRepository({
        existsByParentOfficeTypeId: vi.fn().mockResolvedValue(true),
      }),
    });

    await expect(service.delete(officeType.id, identityId)).rejects.toBeInstanceOf(
      OfficeTypeInUseError,
    );
  });

  it("rejects delete when the office type does not exist", async () => {
    const service = createService({
      officeTypeRepository: createOfficeTypeRepository({
        findById: vi.fn().mockResolvedValue(null),
      }),
    });

    await expect(service.delete(officeType.id, identityId)).rejects.toBeInstanceOf(
      OfficeTypeNotFoundError,
    );
  });

  it("rejects create without manage_office_types", async () => {
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
