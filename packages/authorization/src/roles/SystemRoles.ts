import {
  ITEM_PERMISSIONS,
  PERMISSION_GRANT_PERMISSIONS,
  PLATFORM_PERMISSIONS,
  LIST_PERMISSIONS,
  ROLE_PERMISSIONS,
  SPACE_PERMISSIONS,
  TENANT_PERMISSIONS,
  ORGANIZATION_PERMISSIONS,
} from "../permissions";
import { permissionKeys, withoutActions } from "../utils";
import type { RoleDefinition } from "./RoleDefinition";

export const PLATFORM_ROLES: Record<string, RoleDefinition> = {
  PLATFORM_ADMIN: {
    id: "01900000-0000-7000-8000-000000000001",
    key: "platform.admin",
    name: "Platform Admin",
    description: "Platform administrator with tenant and platform role management permissions",
    relation: "admin",
    permissionKeys: [
      ...permissionKeys("Platform", PLATFORM_PERMISSIONS),
      ...permissionKeys("Tenant", TENANT_PERMISSIONS),
    ],
  },
  PLATFORM_MEMBER: {
    id: "01900000-0000-7000-8000-000000000008",
    key: "platform.member",
    name: "Platform Member",
    description: "Read access to the platform and its tenants",
    relation: "member",
    permissionKeys: [
      ...permissionKeys("Platform", ["read"]),
      ...permissionKeys("Tenant", ["read", "read_list"]),
    ],
  },
};

export const TENANT_ROLES: Record<string, RoleDefinition> = {
  TENANT_OWNER: {
    id: "01900000-0000-7000-8000-000000000005",
    key: "tenant.owner",
    name: "Tenant Owner",
    description: "Full control of a tenant, including organizations, roles, grants, and membership",
    relation: "owner",
    permissionKeys: [
      ...permissionKeys("Tenant", TENANT_PERMISSIONS),
      ...permissionKeys("Organization", ORGANIZATION_PERMISSIONS),
      ...permissionKeys("Space", SPACE_PERMISSIONS),
      ...permissionKeys("List", LIST_PERMISSIONS),
      ...permissionKeys("Item", ITEM_PERMISSIONS),
      ...permissionKeys("Role", ROLE_PERMISSIONS),
      ...permissionKeys("Permission", PERMISSION_GRANT_PERMISSIONS),
    ],
  },
  TENANT_ADMIN: {
    id: "01900000-0000-7000-8000-000000000006",
    key: "tenant.admin",
    name: "Tenant Admin",
    description:
      "Manages tenant settings, membership, organizations, and grants without suspending the tenant or defining roles",
    relation: "admin",
    permissionKeys: [
      ...permissionKeys(
        "Tenant",
        withoutActions(TENANT_PERMISSIONS, "suspend", "delete", "assign_owner"),
      ),
      ...permissionKeys("Organization", withoutActions(ORGANIZATION_PERMISSIONS, "delete")),
      ...permissionKeys("Space", withoutActions(SPACE_PERMISSIONS, "delete")),
      ...permissionKeys("List", withoutActions(LIST_PERMISSIONS, "delete")),
      ...permissionKeys("Item", withoutActions(ITEM_PERMISSIONS, "delete")),
      ...permissionKeys("Role", ["read"]),
      ...permissionKeys("Permission", PERMISSION_GRANT_PERMISSIONS),
    ],
  },
  TENANT_MEMBER: {
    id: "01900000-0000-7000-8000-000000000007",
    key: "tenant.member",
    name: "Tenant Member",
    description: "Read access to tenant resources, organizations, and roles",
    relation: "member",
    permissionKeys: [
      ...permissionKeys("Tenant", ["read", "read_list"]),
      ...permissionKeys("Organization", ["read"]),
      ...permissionKeys("Space", ["read"]),
      ...permissionKeys("List", ["read"]),
      ...permissionKeys("Item", ["read"]),
      ...permissionKeys("Role", ["read"]),
    ],
  },
};

export const ORGANIZATION_ROLES: Record<string, RoleDefinition> = {
  ORGANIZATION_OWNER: {
    id: "01900000-0000-7000-8000-000000000002",
    key: "organization.owner",
    name: "Organization Owner",
    description: "Full control of an organization, including roles and grants",
    relation: "owner",
    permissionKeys: [
      ...permissionKeys("Organization", ORGANIZATION_PERMISSIONS),
      ...permissionKeys("Space", SPACE_PERMISSIONS),
      ...permissionKeys("List", LIST_PERMISSIONS),
      ...permissionKeys("Item", ITEM_PERMISSIONS),
      ...permissionKeys("Role", ROLE_PERMISSIONS),
      ...permissionKeys("Permission", PERMISSION_GRANT_PERMISSIONS),
    ],
  },
  ORGANIZATION_ADMIN: {
    id: "01900000-0000-7000-8000-000000000003",
    key: "organization.admin",
    name: "Organization Admin",
    description:
      "Manages organization settings and grants without deleting the organization or defining roles",
    relation: "admin",
    permissionKeys: [
      ...permissionKeys("Organization", withoutActions(ORGANIZATION_PERMISSIONS, "delete")),
      ...permissionKeys("Space", withoutActions(SPACE_PERMISSIONS, "delete")),
      ...permissionKeys("List", withoutActions(LIST_PERMISSIONS, "delete")),
      ...permissionKeys("Item", withoutActions(ITEM_PERMISSIONS, "delete")),
      ...permissionKeys("Role", ["read"]),
      ...permissionKeys("Permission", PERMISSION_GRANT_PERMISSIONS),
    ],
  },
  ORGANIZATION_MEMBER: {
    id: "01900000-0000-7000-8000-000000000004",
    key: "organization.member",
    name: "Organization Member",
    description: "Read access to organization resources and roles; can create spaces and lists",
    relation: "member",
    permissionKeys: [
      ...permissionKeys("Organization", ["read", "create_space", "create_list"]),
      ...permissionKeys("Space", ["read", "create_list"]),
      ...permissionKeys("List", ["read", "create_item"]),
      ...permissionKeys("Item", ["read", "update"]),
      ...permissionKeys("Role", ["read"]),
    ],
  },
};

export const ALL_PLATFORM_ROLES: readonly RoleDefinition[] = [
  PLATFORM_ROLES.PLATFORM_ADMIN,
  PLATFORM_ROLES.PLATFORM_MEMBER,
];

export const ALL_TENANT_ROLES: readonly RoleDefinition[] = [
  TENANT_ROLES.TENANT_OWNER,
  TENANT_ROLES.TENANT_ADMIN,
  TENANT_ROLES.TENANT_MEMBER,
];

export const ALL_ORGANIZATION_ROLES: readonly RoleDefinition[] = [
  ORGANIZATION_ROLES.ORGANIZATION_OWNER,
  ORGANIZATION_ROLES.ORGANIZATION_ADMIN,
  ORGANIZATION_ROLES.ORGANIZATION_MEMBER,
];

export const ALL_SYSTEM_ROLES: readonly RoleDefinition[] = [
  ...ALL_PLATFORM_ROLES,
  ...ALL_TENANT_ROLES,
  ...ALL_ORGANIZATION_ROLES,
];

export type PlatformRoleKey = "platform.admin" | "platform.member";
export type TenantRoleKey = "tenant.owner" | "tenant.admin" | "tenant.member";
export type OrganizationRoleKey =
  | "organization.owner"
  | "organization.admin"
  | "organization.member";
