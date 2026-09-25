export type { Resource, ResourceKey } from "./resources";
export { RESOURCES, isResource, parseResource, tryParseResource } from "./resources";

export type {
  Permission,
  PermissionKey,
  ProfilePermission,
  PlatformPermission,
  TenantPermission,
  WorkspacePermission,
  SpacePermission,
  ListPermission,
  ItemPermission,
  RolePermission,
  PermissionGrantPermission,
} from "./permissions";
export {
  permissionKey,
  parsePermission,
  tryParsePermission,
  PROFILE_PERMISSIONS,
  PLATFORM_PERMISSIONS,
  TENANT_PERMISSIONS,
  WORKSPACE_PERMISSIONS,
  SPACE_PERMISSIONS,
  LIST_PERMISSIONS,
  ITEM_PERMISSIONS,
  ROLE_PERMISSIONS,
  PERMISSION_GRANT_PERMISSIONS,
  ALL_PERMISSIONS,
} from "./permissions";

export {
  type RoleDefinition,
  ALL_PLATFORM_ROLES,
  PLATFORM_ROLES,
  type PlatformRoleKey,
  ALL_TENANT_ROLES,
  TENANT_ROLES,
  type TenantRoleKey,
  ALL_WORKSPACE_ROLES,
  WORKSPACE_ROLES,
  type WorkspaceRoleKey,
  ALL_SYSTEM_ROLES,
  findPlatformRoleDefinition,
  findTenantRoleDefinition,
  findWorkspaceRoleDefinition,
  findSystemRoleDefinition,
  platformRolePermissionKeys,
  tenantRolePermissionKeys,
  workspaceRolePermissionKeys,
  systemRolePermissionKeys,
} from "./roles";

export type { GraphNamespace, GraphResource, GraphRelationship, GraphSubjectSet } from "./types";
export { GRAPH_NAMESPACES, isGraphNamespace } from "./types";

export { IDENTITY, PROFILE } from "./identities";
export {
  ADMIN,
  ITEM_LIST,
  LIST_SPACE,
  MEMBER,
  OWNER,
  PERMISSION_HAS,
  PLATFORM_OBJECT_ID,
  PLATFORM_TENANT,
  ROLE_MEMBER,
  SPACE_WORKSPACE,
  TENANT_PLATFORM,
  WORKSPACE_TENANT,
  itemAdminRelationship,
  itemListRelationship,
  itemMemberRelationship,
  itemOwnerRelationship,
  listAdminRelationship,
  listMemberRelationship,
  listOwnerRelationship,
  listSpaceRelationship,
  platformAdminRelationship,
  platformMemberRelationship,
  platformTenantRelationship,
  spaceAdminRelationship,
  spaceMemberRelationship,
  spaceOwnerRelationship,
  spaceWorkspaceRelationship,
  tenantAdminRelationship,
  tenantMemberRelationship,
  tenantOwnerRelationship,
  tenantPlatformRelationship,
  workspaceAdminRelationship,
  workspaceMemberRelationship,
  workspaceOwnerRelationship,
  workspaceTenantRelationship,
} from "./relations";

export { permissionKeys, withoutActions, allPermissionKeys, readPermissionKeys } from "./utils";

export type { IAuthorizationClient } from "./client";
export { HttpAuthorizationClient, requirePermission } from "./client";
export type {
  CheckRelationshipInput,
  CheckRelationshipResponse,
  EnsureRelationshipResponse,
  DeleteRelationshipResponse,
  HttpAuthorizationClientOptions,
  ListRelationshipsInput,
} from "./client";

export {
  InsufficientPermissionError,
  InvalidPermissionKeyError,
  InvalidResourceKeyError,
} from "./errors";
