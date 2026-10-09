import type { OrganizationRelation } from "@/features/organizations/services/IOrganizationRelationService";
import type { PlatformRelation } from "@/features/platform/services/IPlatformRelationService";
import type { TenantRelation } from "@/features/tenants/services/ITenantRelationService";

export type IdentityRelations = {
  identityId: string;
  platform: PlatformRelation[];
  tenants: TenantRelation[];
  organizations: OrganizationRelation[];
};

export interface IIdentityRelationService {
  list: (identityId: string, callerIdentityId: string) => Promise<IdentityRelations>;
}
