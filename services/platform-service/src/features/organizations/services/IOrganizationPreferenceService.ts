import type { IdentityOrganizationPreference } from "@/db";

export interface IOrganizationPreferenceService {
  get: (identityId: string) => Promise<IdentityOrganizationPreference | null>;
  set: (organizationId: string, identityId: string) => Promise<IdentityOrganizationPreference>;
}
