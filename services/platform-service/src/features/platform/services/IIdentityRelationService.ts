import type { OrganizationRelation } from "@/features/organizations/services/IOrganizationRelationService";
import type { PlatformRelation } from "@/features/platform/services/IPlatformRelationService";

export type IdentityTenantRelation = {
  id: string;
  tenantId: string;
  identityId: string;
  relation: string;
};

export type IdentityRelations = {
  identityId: string;
  platform: PlatformRelation[];
  tenants: IdentityTenantRelation[];
  organizations: OrganizationRelation[];
};

export interface IIdentityRelationService {
  list: (identityId: string, callerIdentityId: string) => Promise<IdentityRelations>;
}
