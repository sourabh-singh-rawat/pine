export type { Resource, ResourceKey } from "./resources";
export { RESOURCES, isResource, parseResource, tryParseResource } from "./resources";

export type {
  Permission,
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

export type { GraphNamespace, GraphResource, GraphRelationship, GraphSubjectSet } from "./types";
export { GRAPH_NAMESPACES, isGraphNamespace } from "./types";

export { IDENTITY, PROFILE } from "./identities";
export {
  PLATFORM_OBJECT_ID,
  relationship,
  type RelationshipInput,
  NAMESPACES,
  PROFILE_RELATIONS,
  PLATFORM_RELATIONS,
  TENANT_RELATIONS,
  ORGANIZATION_RELATIONS,
  SPACE_RELATIONS,
  LIST_RELATIONS,
  ITEM_RELATIONS,
  ROLE_RELATIONS,
  PERMISSION_RELATIONS,
  type NamespaceName,
  type RelationFor,
  type ProfileRelation,
  type PlatformRelation,
  type TenantRelation,
  type OrganizationRelation,
  type SpaceRelation,
  type ListRelation,
  type ItemRelation,
  type RoleRelation,
  type PermissionRelation,
} from "./relations";

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
