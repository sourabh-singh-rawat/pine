import type { DbClient, OrganizationOfficeType } from "@/db";

export type OfficeTypeRepositoryOptions = { tx: DbClient };

export type CreateOfficeTypeEntity = {
  tenantId: string;
  parentOfficeTypeId?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  isActive?: boolean;
};

export interface IOfficeTypeRepository {
  save: (
    entity: CreateOfficeTypeEntity,
    options?: OfficeTypeRepositoryOptions,
  ) => Promise<OrganizationOfficeType>;
  findById: (id: string) => Promise<OrganizationOfficeType | null>;
  findManyByTenant: (tenantId: string) => Promise<OrganizationOfficeType[]>;
  existsBySlugInTenant: (tenantId: string, slug: string) => Promise<boolean>;
  existsByNameInTenant: (tenantId: string, name: string) => Promise<boolean>;
  existsByParentOfficeTypeId: (parentOfficeTypeId: string) => Promise<boolean>;
  softDelete: (id: string, options?: OfficeTypeRepositoryOptions) => Promise<boolean>;
}
