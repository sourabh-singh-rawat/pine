export type ProfileRelation = "identity";

export type PlatformRelation = "owners" | "admins" | "members";

export type TenantRelation = "owners" | "admins" | "members" | "platform";

export type OrganizationRelation = "owners" | "admins" | "members" | "tenant" | "parents";

export type SpaceRelation = "owners" | "admins" | "members" | "organization";

export type ListRelation = "owners" | "admins" | "members" | "space";

export type ItemRelation = "owners" | "admins" | "members" | "list";

export type RoleRelation = "members";

export type PermissionRelation = "has";

export type NamespaceName =
  | "Identity"
  | "Profile"
  | "Platform"
  | "Tenant"
  | "Organization"
  | "Space"
  | "List"
  | "Item"
  | "Role"
  | "Permission";

export const NAMESPACES: readonly NamespaceName[] = [
  "Identity",
  "Profile",
  "Platform",
  "Tenant",
  "Organization",
  "Space",
  "List",
  "Item",
  "Role",
  "Permission",
];

export type RelationFor<N extends NamespaceName> = N extends "Identity"
  ? never
  : N extends "Profile"
    ? ProfileRelation
    : N extends "Platform"
      ? PlatformRelation
      : N extends "Tenant"
        ? TenantRelation
        : N extends "Organization"
          ? OrganizationRelation
          : N extends "Space"
            ? SpaceRelation
            : N extends "List"
              ? ListRelation
              : N extends "Item"
                ? ItemRelation
                : N extends "Role"
                  ? RoleRelation
                  : N extends "Permission"
                    ? PermissionRelation
                    : never;

export const PROFILE_RELATIONS: readonly ProfileRelation[] = ["identity"];

export const PLATFORM_RELATIONS: readonly PlatformRelation[] = ["owners", "admins", "members"];

export const TENANT_RELATIONS: readonly TenantRelation[] = [
  "owners",
  "admins",
  "members",
  "platform",
];

export const ORGANIZATION_RELATIONS: readonly OrganizationRelation[] = [
  "owners",
  "admins",
  "members",
  "tenant",
  "parents",
];

export const SPACE_RELATIONS: readonly SpaceRelation[] = [
  "owners",
  "admins",
  "members",
  "organization",
];

export const LIST_RELATIONS: readonly ListRelation[] = ["owners", "admins", "members", "space"];

export const ITEM_RELATIONS: readonly ItemRelation[] = ["owners", "admins", "members", "list"];

export const ROLE_RELATIONS: readonly RoleRelation[] = ["members"];

export const PERMISSION_RELATIONS: readonly PermissionRelation[] = ["has"];
