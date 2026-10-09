export type { Resource, ResourceKey } from "./resources";
export { RESOURCES, isResource, parseResource, tryParseResource } from "./resources";

export type {
  Permission,
  PermissionKey,
  ProfilePermission,
  PlatformPermission,
  TenantPermission,
  OrganizationPermission,
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
  ORGANIZATION_PERMISSIONS,
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
  ALL_ORGANIZATION_ROLES,
  ORGANIZATION_ROLES,
  type OrganizationRoleKey,
  ALL_SYSTEM_ROLES,
  findPlatformRoleDefinition,
  findTenantRoleDefinition,
  findOrganizationRoleDefinition,
  findSystemRoleDefinition,
  platformRolePermissionKeys,
  tenantRolePermissionKeys,
  organizationRolePermissionKeys,
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
  SPACE_ORGANIZATION,
  TENANT_PLATFORM,
  ORGANIZATION_TENANT,
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
  spaceOrganizationRelationship,
  tenantAdminRelationship,
  tenantMemberRelationship,
  tenantOwnerRelationship,
  tenantPlatformRelationship,
  organizationAdminRelationship,
  organizationMemberRelationship,
  organizationOwnerRelationship,
  organizationTenantRelationship,
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
