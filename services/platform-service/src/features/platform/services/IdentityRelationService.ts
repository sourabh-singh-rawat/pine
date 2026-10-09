import {
  ADMIN,
  IDENTITY,
  MEMBER,
  OWNER,
  PLATFORM_OBJECT_ID,
  requirePermission,
  type GraphRelationship,
  type IAuthorizationClient,
} from "@pine/authorization";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import type {
  IdentityRelations,
  IIdentityRelationService,
} from "@/features/platform/services/IIdentityRelationService";
import type { OrganizationRelation } from "@/features/organizations/services/IOrganizationRelationService";
import type { PlatformRelation } from "@/features/platform/services/IPlatformRelationService";
import type { TenantRelation } from "@/features/tenants/services/ITenantRelationService";

const PLATFORM_MEMBERSHIP_RELATIONS = new Set([ADMIN, MEMBER]);
const TENANT_MEMBERSHIP_RELATIONS = new Set([OWNER, ADMIN, MEMBER]);
const ORGANIZATION_MEMBERSHIP_RELATIONS = new Set([OWNER, ADMIN, MEMBER]);

@injectable()
export class IdentityRelationService implements IIdentityRelationService {
  constructor(
    @inject(TYPES.AuthorizationClient)
    private readonly authorizationClient: IAuthorizationClient,
  ) {}

  async list(identityId: string, callerIdentityId: string): Promise<IdentityRelations> {
    await requirePermission(
      this.authorizationClient,
      callerIdentityId,
      "manage_admins",
      `Platform:${PLATFORM_OBJECT_ID}`,
    );

    const subject = { namespace: IDENTITY, id: identityId };
    const [platformRelationships, tenantRelationships, organizationRelationships] =
      await Promise.all([
        this.authorizationClient.listRelationships({
          namespace: "Platform",
          subject,
        }),
        this.authorizationClient.listRelationships({
          namespace: "Tenant",
          subject,
        }),
        this.authorizationClient.listRelationships({
          namespace: "Organization",
          subject,
        }),
      ]);

    return {
      identityId,
      platform: this.toPlatformRelations(identityId, platformRelationships),
      tenants: this.toTenantRelations(identityId, tenantRelationships),
      organizations: this.toOrganizationRelations(identityId, organizationRelationships),
    };
  }

  private toPlatformRelations(
    identityId: string,
    relationships: GraphRelationship[],
  ): PlatformRelation[] {
    const platformRelations: PlatformRelation[] = [];
    for (const relationship of relationships) {
      if (
        relationship.object.namespace !== "Platform" ||
        !PLATFORM_MEMBERSHIP_RELATIONS.has(relationship.relation) ||
        relationship.subject?.namespace !== IDENTITY ||
        relationship.subject.id !== identityId
      ) {
        continue;
      }
      platformRelations.push({
        id: `${relationship.object.id}:${relationship.relation}:${identityId}`,
        identityId,
        relation: relationship.relation,
      });
    }
    return platformRelations;
  }

  private toTenantRelations(
    identityId: string,
    relationships: GraphRelationship[],
  ): TenantRelation[] {
    const tenantRelations: TenantRelation[] = [];
    for (const relationship of relationships) {
      if (
        relationship.object.namespace !== "Tenant" ||
        !TENANT_MEMBERSHIP_RELATIONS.has(relationship.relation) ||
        relationship.subject?.namespace !== IDENTITY ||
        relationship.subject.id !== identityId
      ) {
        continue;
      }
      tenantRelations.push({
        id: `${relationship.object.id}:${relationship.relation}:${identityId}`,
        tenantId: relationship.object.id,
        identityId,
        relation: relationship.relation,
      });
    }
    return tenantRelations;
  }

  private toOrganizationRelations(
    identityId: string,
    relationships: GraphRelationship[],
  ): OrganizationRelation[] {
    const organizationRelations: OrganizationRelation[] = [];
    for (const relationship of relationships) {
      if (
        relationship.object.namespace !== "Organization" ||
        !ORGANIZATION_MEMBERSHIP_RELATIONS.has(relationship.relation) ||
        relationship.subject?.namespace !== IDENTITY ||
        relationship.subject.id !== identityId
      ) {
        continue;
      }
      organizationRelations.push({
        id: `${relationship.object.id}:${relationship.relation}:${identityId}`,
        organizationId: relationship.object.id,
        identityId,
        relation: relationship.relation,
      });
    }
    return organizationRelations;
  }
}
