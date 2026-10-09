import type { Tenant, Organization } from "@/db";

export type PersonalOrganizationProvision = {
  tenant: Tenant;
  organization: Organization;
  created: boolean;
};

export interface IOnboardingService {
  provisionPersonalOrganization: (identityId: string) => Promise<PersonalOrganizationProvision>;
}
