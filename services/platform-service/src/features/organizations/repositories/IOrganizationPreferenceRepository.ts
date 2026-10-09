import type { DbClient, IdentityOrganizationPreference } from "@/db";

export type OrganizationPreferenceRepositoryOptions = { tx: DbClient };

export type UpsertOrganizationPreferenceEntity = {
  identityId: string;
  organizationId: string;
  tenantId: string;
};

export interface IOrganizationPreferenceRepository {
  findByIdentityId: (
    identityId: string,
    options?: OrganizationPreferenceRepositoryOptions,
  ) => Promise<IdentityOrganizationPreference | null>;
  upsert: (
    entity: UpsertOrganizationPreferenceEntity,
    options?: OrganizationPreferenceRepositoryOptions,
  ) => Promise<IdentityOrganizationPreference>;
}
