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
  SPACE_WORKSPACE,
  TENANT_PLATFORM,
  WORKSPACE_TENANT,
} from "./names";

export const platformAdminRelationship = (identityId: string): GraphRelationship => ({
  object: { namespace: "platform", id: PLATFORM_OBJECT_ID },
  relation: ADMIN,
  subject: { namespace: IDENTITY, id: identityId },
});

export const platformMemberRelationship = (identityId: string): GraphRelationship => ({
  object: { namespace: "platform", id: PLATFORM_OBJECT_ID },
  relation: MEMBER,
  subject: { namespace: IDENTITY, id: identityId },
});

export const tenantOwnerRelationship = (
  tenantId: string,
  identityId: string,
): GraphRelationship => ({
  object: { namespace: "tenant", id: tenantId },
  relation: OWNER,
  subject: { namespace: IDENTITY, id: identityId },
});

export const tenantAdminRelationship = (
  tenantId: string,
  identityId: string,
): GraphRelationship => ({
  object: { namespace: "tenant", id: tenantId },
  relation: ADMIN,
  subject: { namespace: IDENTITY, id: identityId },
});

export const tenantMemberRelationship = (
  tenantId: string,
  identityId: string,
): GraphRelationship => ({
  object: { namespace: "tenant", id: tenantId },
  relation: MEMBER,
  subject: { namespace: IDENTITY, id: identityId },
});

export const workspaceOwnerRelationship = (
  workspaceId: string,
  identityId: string,
): GraphRelationship => ({
  object: { namespace: "workspace", id: workspaceId },
  relation: OWNER,
  subject: { namespace: IDENTITY, id: identityId },
});

export const workspaceAdminRelationship = (
  workspaceId: string,
  identityId: string,
): GraphRelationship => ({
  object: { namespace: "workspace", id: workspaceId },
  relation: ADMIN,
  subject: { namespace: IDENTITY, id: identityId },
});

export const workspaceMemberRelationship = (
  workspaceId: string,
  identityId: string,
): GraphRelationship => ({
  object: { namespace: "workspace", id: workspaceId },
  relation: MEMBER,
  subject: { namespace: IDENTITY, id: identityId },
});

export const platformTenantRelationship = (tenantId: string): GraphRelationship => ({
  object: { namespace: "platform", id: PLATFORM_OBJECT_ID },
  relation: PLATFORM_TENANT,
  subject: { namespace: "tenant", id: tenantId },
});

export const tenantPlatformRelationship = (tenantId: string): GraphRelationship => ({
  object: { namespace: "tenant", id: tenantId },
  relation: TENANT_PLATFORM,
  subject: { namespace: "platform", id: PLATFORM_OBJECT_ID },
});

export const workspaceTenantRelationship = (
  workspaceId: string,
  tenantId: string,
): GraphRelationship => ({
  object: { namespace: "workspace", id: workspaceId },
  relation: WORKSPACE_TENANT,
  subject: { namespace: "tenant", id: tenantId },
});

export const spaceOwnerRelationship = (spaceId: string, identityId: string): GraphRelationship => ({
  object: { namespace: "space", id: spaceId },
  relation: OWNER,
  subject: { namespace: IDENTITY, id: identityId },
});

export const spaceAdminRelationship = (spaceId: string, identityId: string): GraphRelationship => ({
  object: { namespace: "space", id: spaceId },
  relation: ADMIN,
  subject: { namespace: IDENTITY, id: identityId },
});

export const spaceMemberRelationship = (
  spaceId: string,
  identityId: string,
): GraphRelationship => ({
  object: { namespace: "space", id: spaceId },
  relation: MEMBER,
  subject: { namespace: IDENTITY, id: identityId },
});

export const spaceWorkspaceRelationship = (
  spaceId: string,
  workspaceId: string,
): GraphRelationship => ({
  object: { namespace: "space", id: spaceId },
  relation: SPACE_WORKSPACE,
  subject: { namespace: "workspace", id: workspaceId },
});

export const listOwnerRelationship = (listId: string, identityId: string): GraphRelationship => ({
  object: { namespace: "list", id: listId },
  relation: OWNER,
  subject: { namespace: IDENTITY, id: identityId },
});

export const listAdminRelationship = (listId: string, identityId: string): GraphRelationship => ({
  object: { namespace: "list", id: listId },
  relation: ADMIN,
  subject: { namespace: IDENTITY, id: identityId },
});

export const listMemberRelationship = (listId: string, identityId: string): GraphRelationship => ({
  object: { namespace: "list", id: listId },
  relation: MEMBER,
  subject: { namespace: IDENTITY, id: identityId },
});

export const listSpaceRelationship = (listId: string, spaceId: string): GraphRelationship => ({
  object: { namespace: "list", id: listId },
  relation: LIST_SPACE,
  subject: { namespace: "space", id: spaceId },
});

export const itemOwnerRelationship = (itemId: string, identityId: string): GraphRelationship => ({
  object: { namespace: "item", id: itemId },
  relation: OWNER,
  subject: { namespace: IDENTITY, id: identityId },
});

export const itemAdminRelationship = (itemId: string, identityId: string): GraphRelationship => ({
  object: { namespace: "item", id: itemId },
  relation: ADMIN,
  subject: { namespace: IDENTITY, id: identityId },
});

export const itemMemberRelationship = (itemId: string, identityId: string): GraphRelationship => ({
  object: { namespace: "item", id: itemId },
  relation: MEMBER,
  subject: { namespace: IDENTITY, id: identityId },
});

export const itemListRelationship = (itemId: string, listId: string): GraphRelationship => ({
  object: { namespace: "item", id: itemId },
  relation: ITEM_LIST,
  subject: { namespace: "list", id: listId },
});
