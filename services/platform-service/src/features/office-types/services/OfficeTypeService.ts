import { requirePermission, type IAuthorizationClient } from "@pine/authorization";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import type { OrganizationOfficeType } from "@/db";
import {
  InvalidParentOfficeTypeError,
  OfficeTypeConflictError,
  OfficeTypeInUseError,
  OfficeTypeNotFoundError,
} from "@/features/office-types/errors";
import type { IOfficeTypeRepository } from "@/features/office-types/repositories/IOfficeTypeRepository";
import type {
  CreateOfficeTypeInput,
  IOfficeTypeService,
} from "@/features/office-types/services/IOfficeTypeService";
import { TenantNotFoundError } from "@/features/tenants/errors";
import type { ITenantRepository } from "@/features/tenants/repositories";

@injectable()
export class OfficeTypeService implements IOfficeTypeService {
  constructor(
    @inject(TYPES.OfficeTypeRepository)
    private readonly officeTypeRepository: IOfficeTypeRepository,
    @inject(TYPES.TenantRepository)
    private readonly tenantRepository: ITenantRepository,
    @inject(TYPES.AuthorizationClient)
    private readonly authorizationClient: IAuthorizationClient,
  ) {}

  async create(input: CreateOfficeTypeInput, identityId: string): Promise<OrganizationOfficeType> {
    await requirePermission(
      this.authorizationClient,
      identityId,
      "manage_office_types",
      `Tenant:${input.tenantId}`,
    );

    const tenant = await this.tenantRepository.findById(input.tenantId);
    if (!tenant) {
      throw new TenantNotFoundError(`Tenant not found: ${input.tenantId}`);
    }

    if (input.parentOfficeTypeId) {
      const parent = await this.officeTypeRepository.findById(input.parentOfficeTypeId);
      if (!parent || parent.tenantId !== input.tenantId) {
        throw new InvalidParentOfficeTypeError(
          `Parent office type not found in tenant: ${input.parentOfficeTypeId}`,
        );
      }
    }

    if (await this.officeTypeRepository.existsBySlugInTenant(input.tenantId, input.slug)) {
      throw new OfficeTypeConflictError(`Office type slug already exists in tenant: ${input.slug}`);
    }

    if (await this.officeTypeRepository.existsByNameInTenant(input.tenantId, input.name)) {
      throw new OfficeTypeConflictError(`Office type name already exists in tenant: ${input.name}`);
    }

    return this.officeTypeRepository.save({
      tenantId: input.tenantId,
      parentOfficeTypeId: input.parentOfficeTypeId,
      name: input.name,
      slug: input.slug,
      description: input.description,
      isActive: input.isActive,
    });
  }

  async getById(id: string, identityId: string): Promise<OrganizationOfficeType> {
    const officeType = await this.officeTypeRepository.findById(id);
    if (!officeType) {
      throw new OfficeTypeNotFoundError(`Office type not found: ${id}`);
    }

    await requirePermission(
      this.authorizationClient,
      identityId,
      "read",
      `Tenant:${officeType.tenantId}`,
    );

    return officeType;
  }

  async list(tenantId: string, identityId: string): Promise<OrganizationOfficeType[]> {
    await requirePermission(this.authorizationClient, identityId, "read", `Tenant:${tenantId}`);

    return this.officeTypeRepository.findManyByTenant(tenantId);
  }

  async delete(id: string, identityId: string): Promise<void> {
    const officeType = await this.officeTypeRepository.findById(id);
    if (!officeType) {
      throw new OfficeTypeNotFoundError(`Office type not found: ${id}`);
    }

    await requirePermission(
      this.authorizationClient,
      identityId,
      "manage_office_types",
      `Tenant:${officeType.tenantId}`,
    );

    if (await this.officeTypeRepository.existsByParentOfficeTypeId(id)) {
      throw new OfficeTypeInUseError(`Office type is used as a parent: ${id}`);
    }

    await this.officeTypeRepository.softDelete(id);
  }
}
