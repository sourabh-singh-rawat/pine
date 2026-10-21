import { InsufficientPermissionError, type IAuthorizationClient } from "@pine/authorization";
import { describe, expect, it, vi } from "vitest";
import type { Organization, Section } from "@/db";
import { OrganizationNotFoundError } from "@/features/organizations/errors";
import type { IOrganizationRepository } from "@/features/organizations/repositories";
import { SectionConflictError, SectionNotFoundError } from "@/features/sections/errors";
import type { ISectionRepository } from "@/features/sections/repositories/ISectionRepository";
import { SectionService } from "@/features/sections/services/SectionService";

const organization: Organization = {
  id: "org-1",
  tenantId: "tenant-1",
  parentOrganizationId: null,
  organizationTypeId: "type-1",
  name: "LDA Planning",
  slug: "lda-planning",
  description: null,
  isActive: true,
  version: 1,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: null,
  deletedAt: null,
};

const section: Section = {
  id: "section-1",
  tenantId: organization.tenantId,
  organizationId: organization.id,
  name: "Property",
  slug: "property",
  description: null,
  isActive: true,
  version: 1,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: null,
  deletedAt: null,
};

const actorId = "user-1";

const createAuthorizationClient = (
  overrides: Partial<IAuthorizationClient> = {},
): IAuthorizationClient => ({
  checkRelationship: vi.fn().mockResolvedValue(true),
  ensureRelationship: vi.fn().mockResolvedValue({ created: true }),
  deleteRelationship: vi.fn().mockResolvedValue({ deleted: true }),
  listRelationships: vi.fn().mockResolvedValue([]),
  ...overrides,
});

const createOrganizationRepository = (
  overrides: Partial<IOrganizationRepository> = {},
): IOrganizationRepository => ({
  save: vi.fn(),
  update: vi.fn(),
  findById: vi.fn().mockResolvedValue(organization),
  findByIds: vi.fn().mockResolvedValue([]),
  existsBySlugInTenant: vi.fn(),
  existsByNameInTenant: vi.fn(),
  findMany: vi.fn().mockResolvedValue([]),
  softDelete: vi.fn(),
  ...overrides,
});

const createSectionRepository = (
  overrides: Partial<ISectionRepository> = {},
): ISectionRepository => ({
  saveSection: vi.fn().mockResolvedValue(section),
  findSectionById: vi.fn().mockResolvedValue(section),
  listSectionsByOrganizationId: vi.fn().mockResolvedValue([section]),
  existsSectionBySlugInOrganization: vi.fn().mockResolvedValue(false),
  existsSectionByNameInOrganization: vi.fn().mockResolvedValue(false),
  updateSection: vi.fn().mockResolvedValue(section),
  softDeleteSection: vi.fn().mockResolvedValue(true),
  ...overrides,
});

const createService = (deps: {
  sectionRepository?: ISectionRepository;
  organizationRepository?: IOrganizationRepository;
  authorizationClient?: IAuthorizationClient;
}) =>
  new SectionService(
    deps.sectionRepository ?? createSectionRepository(),
    deps.organizationRepository ?? createOrganizationRepository(),
    deps.authorizationClient ?? createAuthorizationClient(),
  );

describe("SectionService", () => {
  it("creates a section in the organization", async () => {
    const sectionRepository = createSectionRepository();
    const service = createService({ sectionRepository });

    const created = await service.createSection(
      {
        tenantId: organization.tenantId,
        organizationId: organization.id,
        name: "Property",
        slug: "property",
      },
      actorId,
    );

    expect(created).toBe(section);
    expect(sectionRepository.saveSection).toHaveBeenCalledWith({
      tenantId: organization.tenantId,
      organizationId: organization.id,
      name: "Property",
      slug: "property",
      description: undefined,
      isActive: undefined,
    });
  });

  it("rejects create when the organization is missing", async () => {
    const service = createService({
      organizationRepository: createOrganizationRepository({
        findById: vi.fn().mockResolvedValue(null),
      }),
    });

    await expect(
      service.createSection(
        {
          tenantId: organization.tenantId,
          organizationId: organization.id,
          name: "Property",
          slug: "property",
        },
        actorId,
      ),
    ).rejects.toBeInstanceOf(OrganizationNotFoundError);
  });

  it("rejects create when the organization belongs to another tenant", async () => {
    const service = createService({
      organizationRepository: createOrganizationRepository({
        findById: vi.fn().mockResolvedValue({ ...organization, tenantId: "other-tenant" }),
      }),
    });

    await expect(
      service.createSection(
        {
          tenantId: organization.tenantId,
          organizationId: organization.id,
          name: "Property",
          slug: "property",
        },
        actorId,
      ),
    ).rejects.toBeInstanceOf(OrganizationNotFoundError);
  });

  it("rejects a duplicate slug", async () => {
    const service = createService({
      sectionRepository: createSectionRepository({
        existsSectionBySlugInOrganization: vi.fn().mockResolvedValue(true),
      }),
    });

    await expect(
      service.createSection(
        {
          tenantId: organization.tenantId,
          organizationId: organization.id,
          name: "Property",
          slug: "property",
        },
        actorId,
      ),
    ).rejects.toBeInstanceOf(SectionConflictError);
  });

  it("rejects create without manage_sections", async () => {
    const service = createService({
      authorizationClient: createAuthorizationClient({
        checkRelationship: vi.fn().mockResolvedValue(false),
      }),
    });

    await expect(
      service.createSection(
        {
          tenantId: organization.tenantId,
          organizationId: organization.id,
          name: "Property",
          slug: "property",
        },
        actorId,
      ),
    ).rejects.toBeInstanceOf(InsufficientPermissionError);
  });

  it("updates a section", async () => {
    const sectionRepository = createSectionRepository();
    const service = createService({ sectionRepository });

    const updated = await service.updateSection(
      section.id,
      { name: "Legal", slug: "legal" },
      actorId,
    );

    expect(updated).toBe(section);
    expect(sectionRepository.updateSection).toHaveBeenCalledWith(section.id, {
      name: "Legal",
      slug: "legal",
      description: undefined,
      isActive: undefined,
    });
  });

  it("rejects update when the section does not exist", async () => {
    const service = createService({
      sectionRepository: createSectionRepository({
        findSectionById: vi.fn().mockResolvedValue(null),
      }),
    });

    await expect(
      service.updateSection(section.id, { name: "Legal" }, actorId),
    ).rejects.toBeInstanceOf(SectionNotFoundError);
  });

  it("rejects delete when the section does not exist", async () => {
    const service = createService({
      sectionRepository: createSectionRepository({
        findSectionById: vi.fn().mockResolvedValue(null),
      }),
    });

    await expect(service.deleteSection(section.id, actorId)).rejects.toBeInstanceOf(
      SectionNotFoundError,
    );
  });

  it("lists sections for an organization", async () => {
    const sectionRepository = createSectionRepository();
    const service = createService({ sectionRepository });

    const sections = await service.listSections(organization.id, actorId);

    expect(sections).toEqual([section]);
    expect(sectionRepository.listSectionsByOrganizationId).toHaveBeenCalledWith(organization.id);
  });
});
