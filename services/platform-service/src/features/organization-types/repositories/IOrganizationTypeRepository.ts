import type { DbClient, OrganizationType } from "@/db";

export type OrganizationTypeRepositoryOptions = { tx: DbClient };

export type CreateOrganizationTypeEntity = {
  tenantId: string;
  parentOrganizationTypeId?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  isActive?: boolean;
};

export interface IOrganizationTypeRepository {
  save: (
    entity: CreateOrganizationTypeEntity,
    options?: OrganizationTypeRepositoryOptions,
  ) => Promise<OrganizationType>;
  findById: (id: string) => Promise<OrganizationType | null>;
  findManyByTenant: (tenantId: string) => Promise<OrganizationType[]>;
  existsBySlugInTenant: (tenantId: string, slug: string) => Promise<boolean>;
  existsByNameInTenant: (tenantId: string, name: string) => Promise<boolean>;
  existsByParentOrganizationTypeId: (parentOrganizationTypeId: string) => Promise<boolean>;
  softDelete: (id: string, options?: OrganizationTypeRepositoryOptions) => Promise<boolean>;
}
