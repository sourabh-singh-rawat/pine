import type { DbClient, Organization } from "@/db";

export type OrganizationRepositoryOptions = { tx?: DbClient };

export type UpsertOrganizationEntity = {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
};

export interface IOrganizationRepository {
  upsert: (
    entity: UpsertOrganizationEntity,
    options?: OrganizationRepositoryOptions,
  ) => Promise<Organization>;
  findById: (id: string, options?: OrganizationRepositoryOptions) => Promise<Organization | null>;
}
