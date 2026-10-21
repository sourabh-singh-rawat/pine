import type { Resource } from "../resources";

export type ProfilePermission = "read" | "update";

export type PlatformPermission =
  | "read"
  | "create_tenant"
  | "suspend_tenant"
  | "delete_tenant"
  | "manage_admins";

export type TenantPermission =
  | "read"
  | "read_list"
  | "configure"
  | "manage_members"
  | "create_organization"
  | "manage_organization_types"
  | "assign_admin"
  | "assign_owner";

export type OrganizationPermission =
  | "read"
  | "update"
  | "manage_members"
  | "create_space"
  | "create_list"
  | "delete";

export type SpacePermission = "read" | "update" | "manage_members" | "create_list" | "delete";

export type ListPermission = "read" | "update" | "manage_members" | "create_item" | "delete";

export type ItemPermission = "read" | "update" | "manage_members" | "delete";

export type RolePermission = "read" | "create" | "update" | "delete";

export type PermissionGrantPermission = "read" | "create" | "update" | "delete";

export type Permission =
  | ProfilePermission
  | PlatformPermission
  | TenantPermission
  | OrganizationPermission
  | SpacePermission
  | ListPermission
  | ItemPermission
  | RolePermission
  | PermissionGrantPermission;

export const PROFILE_PERMISSIONS: readonly ProfilePermission[] = ["read", "update"];

export const PLATFORM_PERMISSIONS: readonly PlatformPermission[] = [
  "read",
  "create_tenant",
  "suspend_tenant",
  "delete_tenant",
  "manage_admins",
];

export const TENANT_PERMISSIONS: readonly TenantPermission[] = [
  "read",
  "read_list",
  "configure",
  "manage_members",
  "create_organization",
  "manage_organization_types",
  "assign_admin",
  "assign_owner",
];

export const ORGANIZATION_PERMISSIONS: readonly OrganizationPermission[] = [
  "read",
  "update",
  "manage_members",
  "create_space",
  "create_list",
  "delete",
];

export const SPACE_PERMISSIONS: readonly SpacePermission[] = [
  "read",
  "update",
  "manage_members",
  "create_list",
  "delete",
];

export const LIST_PERMISSIONS: readonly ListPermission[] = [
  "read",
  "update",
  "manage_members",
  "create_item",
  "delete",
];

export const ITEM_PERMISSIONS: readonly ItemPermission[] = [
  "read",
  "update",
  "manage_members",
  "delete",
];

export const ROLE_PERMISSIONS: readonly RolePermission[] = ["read", "create", "update", "delete"];

export const PERMISSION_GRANT_PERMISSIONS: readonly PermissionGrantPermission[] = [
  "read",
  "create",
  "update",
  "delete",
];

const catalog = (
  namespace: Resource,
  permissions: readonly string[],
): readonly { namespace: Resource; permission: string }[] =>
  permissions.map((permission) => ({ namespace, permission }));

export const ALL_PERMISSIONS = [
  ...catalog("Profile", PROFILE_PERMISSIONS),
  ...catalog("Platform", PLATFORM_PERMISSIONS),
  ...catalog("Tenant", TENANT_PERMISSIONS),
  ...catalog("Organization", ORGANIZATION_PERMISSIONS),
  ...catalog("Space", SPACE_PERMISSIONS),
  ...catalog("List", LIST_PERMISSIONS),
  ...catalog("Item", ITEM_PERMISSIONS),
  ...catalog("Role", ROLE_PERMISSIONS),
  ...catalog("Permission", PERMISSION_GRANT_PERMISSIONS),
];
