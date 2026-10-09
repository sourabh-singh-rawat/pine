import { IDENTITY } from "../identities";
import type { GraphRelationship } from "../types/GraphRelationship";
import {
  ADMIN,
  ITEM_LIST,
  LIST_SPACE,
  MEMBER,
  OWNER,
  PLATFORM_OBJECT_ID,
  PLATFORM_TENANT,
  SPACE_ORGANIZATION,
  TENANT_PLATFORM,
  ORGANIZATION_PARENTS,
  ORGANIZATION_TENANT,
} from "./names";

export const platformAdminRelationship = (identityId: string): GraphRelationship => ({
  object: { namespace: "Platform", id: PLATFORM_OBJECT_ID },
  relation: ADMIN,
  subject: { namespace: IDENTITY, id: identityId },
});

export const platformMemberRelationship = (identityId: string): GraphRelationship => ({
  object: { namespace: "Platform", id: PLATFORM_OBJECT_ID },
  relation: MEMBER,
  subject: { namespace: IDENTITY, id: identityId },
});

export const tenantOwnerRelationship = (
  tenantId: string,
  identityId: string,
): GraphRelationship => ({
  object: { namespace: "Tenant", id: tenantId },
  relation: OWNER,
  subject: { namespace: IDENTITY, id: identityId },
});

export const tenantAdminRelationship = (
  tenantId: string,
  identityId: string,
): GraphRelationship => ({
  object: { namespace: "Tenant", id: tenantId },
  relation: ADMIN,
  subject: { namespace: IDENTITY, id: identityId },
});

export const tenantMemberRelationship = (
  tenantId: string,
  identityId: string,
): GraphRelationship => ({
  object: { namespace: "Tenant", id: tenantId },
  relation: MEMBER,
  subject: { namespace: IDENTITY, id: identityId },
});

export const organizationOwnerRelationship = (
  organizationId: string,
  identityId: string,
): GraphRelationship => ({
  object: { namespace: "Organization", id: organizationId },
  relation: OWNER,
  subject: { namespace: IDENTITY, id: identityId },
});

export const organizationAdminRelationship = (
  organizationId: string,
  identityId: string,
): GraphRelationship => ({
  object: { namespace: "Organization", id: organizationId },
  relation: ADMIN,
  subject: { namespace: IDENTITY, id: identityId },
});

export const organizationMemberRelationship = (
  organizationId: string,
  identityId: string,
): GraphRelationship => ({
  object: { namespace: "Organization", id: organizationId },
  relation: MEMBER,
  subject: { namespace: IDENTITY, id: identityId },
});

export const platformTenantRelationship = (tenantId: string): GraphRelationship => ({
  object: { namespace: "Platform", id: PLATFORM_OBJECT_ID },
  relation: PLATFORM_TENANT,
  subject: { namespace: "Tenant", id: tenantId },
});

export const tenantPlatformRelationship = (tenantId: string): GraphRelationship => ({
  object: { namespace: "Tenant", id: tenantId },
  relation: TENANT_PLATFORM,
  subject: { namespace: "Platform", id: PLATFORM_OBJECT_ID },
});

export const organizationTenantRelationship = (
  organizationId: string,
  tenantId: string,
): GraphRelationship => ({
  object: { namespace: "Organization", id: organizationId },
  relation: ORGANIZATION_TENANT,
  subject: { namespace: "Tenant", id: tenantId },
});

export const organizationParentsRelationship = (
  organizationId: string,
  parentOrganizationId: string,
): GraphRelationship => ({
  object: { namespace: "Organization", id: organizationId },
  relation: ORGANIZATION_PARENTS,
  subject: { namespace: "Organization", id: parentOrganizationId },
});

export const spaceOwnerRelationship = (spaceId: string, identityId: string): GraphRelationship => ({
  object: { namespace: "Space", id: spaceId },
  relation: OWNER,
  subject: { namespace: IDENTITY, id: identityId },
});

export const spaceAdminRelationship = (spaceId: string, identityId: string): GraphRelationship => ({
  object: { namespace: "Space", id: spaceId },
  relation: ADMIN,
  subject: { namespace: IDENTITY, id: identityId },
});

export const spaceMemberRelationship = (
  spaceId: string,
  identityId: string,
): GraphRelationship => ({
  object: { namespace: "Space", id: spaceId },
  relation: MEMBER,
  subject: { namespace: IDENTITY, id: identityId },
});

export const spaceOrganizationRelationship = (
  spaceId: string,
  organizationId: string,
): GraphRelationship => ({
  object: { namespace: "Space", id: spaceId },
  relation: SPACE_ORGANIZATION,
  subject: { namespace: "Organization", id: organizationId },
});

export const listOwnerRelationship = (listId: string, identityId: string): GraphRelationship => ({
  object: { namespace: "List", id: listId },
  relation: OWNER,
  subject: { namespace: IDENTITY, id: identityId },
});

export const listAdminRelationship = (listId: string, identityId: string): GraphRelationship => ({
  object: { namespace: "List", id: listId },
  relation: ADMIN,
  subject: { namespace: IDENTITY, id: identityId },
});

export const listMemberRelationship = (listId: string, identityId: string): GraphRelationship => ({
  object: { namespace: "List", id: listId },
  relation: MEMBER,
  subject: { namespace: IDENTITY, id: identityId },
});

export const listSpaceRelationship = (listId: string, spaceId: string): GraphRelationship => ({
  object: { namespace: "List", id: listId },
  relation: LIST_SPACE,
  subject: { namespace: "Space", id: spaceId },
});

export const itemOwnerRelationship = (itemId: string, identityId: string): GraphRelationship => ({
  object: { namespace: "Item", id: itemId },
  relation: OWNER,
  subject: { namespace: IDENTITY, id: identityId },
});

export const itemAdminRelationship = (itemId: string, identityId: string): GraphRelationship => ({
  object: { namespace: "Item", id: itemId },
  relation: ADMIN,
  subject: { namespace: IDENTITY, id: identityId },
});

export const itemMemberRelationship = (itemId: string, identityId: string): GraphRelationship => ({
  object: { namespace: "Item", id: itemId },
  relation: MEMBER,
  subject: { namespace: IDENTITY, id: identityId },
});

export const itemListRelationship = (itemId: string, listId: string): GraphRelationship => ({
  object: { namespace: "Item", id: itemId },
  relation: ITEM_LIST,
  subject: { namespace: "List", id: listId },
});
