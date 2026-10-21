import type { Tenant, Organization } from "@/db";

export type PersonalOrganizationProvision = {
  tenant: Tenant;
  organization: Organization;
};

export interface IPersonalOnboardingService {
  provisionPersonalOrganization: (identityId: string) => Promise<PersonalOrganizationProvision>;
}
