import { requirePermission, type IAuthorizationClient } from "@pine/authorization";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import type { OrganizationType } from "@/db";
import {
  InvalidParentOrganizationTypeError,
  OrganizationTypeConflictError,
  OrganizationTypeInUseError,
  OrganizationTypeNotFoundError,
} from "@/features/organization-types/errors";
import type { IOrganizationTypeRepository } from "@/features/organization-types/repositories/IOrganizationTypeRepository";
import type {
  CreateOrganizationTypeInput,
  IOrganizationTypeService,
} from "@/features/organization-types/services/IOrganizationTypeService";
import { TenantNotFoundError } from "@/features/tenants/errors";
import type { ITenantRepository } from "@/features/tenants/repositories";

@injectable()
export class OrganizationTypeService implements IOrganizationTypeService {
  constructor(
    @inject(TYPES.OrganizationTypeRepository)
    private readonly organizationTypeRepository: IOrganizationTypeRepository,
    @inject(TYPES.TenantRepository)
    private readonly tenantRepository: ITenantRepository,
    @inject(TYPES.AuthorizationClient)
    private readonly authorizationClient: IAuthorizationClient,
  ) {}

  async create(input: CreateOrganizationTypeInput, identityId: string): Promise<OrganizationType> {
    await requirePermission(
      this.authorizationClient,
      identityId,
      "manage_organization_types",
      `Tenant:${input.tenantId}`,
    );

    const tenant = await this.tenantRepository.findById(input.tenantId);
    if (!tenant) {
      throw new TenantNotFoundError(`Tenant not found: ${input.tenantId}`);
    }

    if (input.parentOrganizationTypeId) {
      const parent = await this.organizationTypeRepository.findById(input.parentOrganizationTypeId);
      if (!parent || parent.tenantId !== input.tenantId) {
        throw new InvalidParentOrganizationTypeError(
          `Parent organization type not found in tenant: ${input.parentOrganizationTypeId}`,
        );
      }
    }

    if (await this.organizationTypeRepository.existsBySlugInTenant(input.tenantId, input.slug)) {
      throw new OrganizationTypeConflictError(
        `Organization type slug already exists in tenant: ${input.slug}`,
      );
    }

    if (await this.organizationTypeRepository.existsByNameInTenant(input.tenantId, input.name)) {
      throw new OrganizationTypeConflictError(
        `Organization type name already exists in tenant: ${input.name}`,
      );
    }

    return this.organizationTypeRepository.save({
      tenantId: input.tenantId,
      parentOrganizationTypeId: input.parentOrganizationTypeId,
      name: input.name,
      slug: input.slug,
      description: input.description,
      isActive: input.isActive,
    });
  }

  async getById(id: string, identityId: string): Promise<OrganizationType> {
    const organizationType = await this.organizationTypeRepository.findById(id);
    if (!organizationType) {
      throw new OrganizationTypeNotFoundError(`Organization type not found: ${id}`);
    }

    await requirePermission(
      this.authorizationClient,
      identityId,
      "read",
      `Tenant:${organizationType.tenantId}`,
    );

    return organizationType;
  }

  async list(tenantId: string, identityId: string): Promise<OrganizationType[]> {
    await requirePermission(this.authorizationClient, identityId, "read", `Tenant:${tenantId}`);

    return this.organizationTypeRepository.findManyByTenant(tenantId);
  }

  async delete(id: string, identityId: string): Promise<void> {
    const organizationType = await this.organizationTypeRepository.findById(id);
    if (!organizationType) {
      throw new OrganizationTypeNotFoundError(`Organization type not found: ${id}`);
    }

    await requirePermission(
      this.authorizationClient,
      identityId,
      "manage_organization_types",
      `Tenant:${organizationType.tenantId}`,
    );

    if (await this.organizationTypeRepository.existsByParentOrganizationTypeId(id)) {
      throw new OrganizationTypeInUseError(`Organization type is used as a parent: ${id}`);
    }

    await this.organizationTypeRepository.softDelete(id);
  }
}
