import type { DbClient, Organization } from "@/db";

export type OrganizationRepositoryOptions = { tx: DbClient };

export type CreateOrganizationEntity = {
  tenantId: string;
  parentOrganizationId?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  isActive?: boolean;
};

export type UpdateOrganizationEntity = {
  parentOrganizationId?: string | null;
};

export type ListOrganizationsFilter = {
  tenantId: string;
  parentOrganizationId?: string | null;
};

export interface IOrganizationRepository {
  save(
    entity: CreateOrganizationEntity,
    options?: OrganizationRepositoryOptions,
  ): Promise<Organization>;
  update(
    id: string,
    entity: UpdateOrganizationEntity,
    options?: OrganizationRepositoryOptions,
  ): Promise<Organization | null>;
  findById(id: string): Promise<Organization | null>;
  findByIds(ids: string[]): Promise<Organization[]>;
  existsBySlugInTenant(tenantId: string, slug: string): Promise<boolean>;
  existsByNameInTenant(tenantId: string, name: string): Promise<boolean>;
  findMany(filter: ListOrganizationsFilter): Promise<Organization[]>;
  softDelete(id: string, options?: OrganizationRepositoryOptions): Promise<boolean>;
}
