import {
  ITEM_PERMISSIONS,
  PERMISSION_GRANT_PERMISSIONS,
  PLATFORM_PERMISSIONS,
  LIST_PERMISSIONS,
  ROLE_PERMISSIONS,
  SPACE_PERMISSIONS,
  TENANT_PERMISSIONS,
  WORKSPACE_PERMISSIONS,
} from "../permissions";
import { permissionKeys, withoutActions } from "../utils";
import type { RoleDefinition } from "./RoleDefinition";

export const PLATFORM_ROLES: Record<string, RoleDefinition> = {
  PLATFORM_ADMIN: {
    id: "01900000-0000-7000-8000-000000000001",
    key: "platform.admin",
    name: "Platform Admin",
    description:
      "Platform administrator with tenant and platform role management permissions",
    relation: "admin",
    permissionKeys: [
      ...permissionKeys("platform", PLATFORM_PERMISSIONS),
      ...permissionKeys("tenant", TENANT_PERMISSIONS),
    ],
  },
  PLATFORM_MEMBER: {
    id: "01900000-0000-7000-8000-000000000008",
    key: "platform.member",
    name: "Platform Member",
    description: "Read access to the platform and its tenants",
    relation: "member",
    permissionKeys: [
      ...permissionKeys("platform", ["read"]),
      ...permissionKeys("tenant", ["read", "read_list"]),
    ],
  },
};

export const TENANT_ROLES: Record<string, RoleDefinition> = {
  TENANT_OWNER: {
    id: "01900000-0000-7000-8000-000000000005",
    key: "tenant.owner",
    name: "Tenant Owner",
    description:
      "Full control of a tenant, including workspaces, roles, grants, and membership",
    relation: "owner",
    permissionKeys: [
      ...permissionKeys("tenant", TENANT_PERMISSIONS),
      ...permissionKeys("workspace", WORKSPACE_PERMISSIONS),
      ...permissionKeys("space", SPACE_PERMISSIONS),
      ...permissionKeys("list", LIST_PERMISSIONS),
      ...permissionKeys("item", ITEM_PERMISSIONS),
      ...permissionKeys("role", ROLE_PERMISSIONS),
      ...permissionKeys("permission", PERMISSION_GRANT_PERMISSIONS),
    ],
  },
  TENANT_ADMIN: {
    id: "01900000-0000-7000-8000-000000000006",
    key: "tenant.admin",
    name: "Tenant Admin",
    description:
      "Manages tenant settings, membership, workspaces, and grants without suspending the tenant or defining roles",
    relation: "admin",
    permissionKeys: [
      ...permissionKeys(
        "tenant",
        withoutActions(TENANT_PERMISSIONS, "suspend", "delete", "assign_owner"),
      ),
      ...permissionKeys("workspace", withoutActions(WORKSPACE_PERMISSIONS, "delete")),
      ...permissionKeys("space", withoutActions(SPACE_PERMISSIONS, "delete")),
      ...permissionKeys("list", withoutActions(LIST_PERMISSIONS, "delete")),
      ...permissionKeys("item", withoutActions(ITEM_PERMISSIONS, "delete")),
      ...permissionKeys("role", ["read"]),
      ...permissionKeys("permission", PERMISSION_GRANT_PERMISSIONS),
    ],
  },
  TENANT_MEMBER: {
    id: "01900000-0000-7000-8000-000000000007",
    key: "tenant.member",
    name: "Tenant Member",
    description: "Read access to tenant resources, workspaces, and roles",
    relation: "member",
    permissionKeys: [
      ...permissionKeys("tenant", ["read", "read_list"]),
      ...permissionKeys("workspace", ["read"]),
      ...permissionKeys("space", ["read"]),
      ...permissionKeys("list", ["read"]),
      ...permissionKeys("item", ["read"]),
      ...permissionKeys("role", ["read"]),
    ],
  },
};

export const WORKSPACE_ROLES: Record<string, RoleDefinition> = {
  WORKSPACE_OWNER: {
    id: "01900000-0000-7000-8000-000000000002",
    key: "workspace.owner",
    name: "Workspace Owner",
    description: "Full control of an workspace, including roles and grants",
    relation: "owner",
    permissionKeys: [
      ...permissionKeys("workspace", WORKSPACE_PERMISSIONS),
      ...permissionKeys("space", SPACE_PERMISSIONS),
      ...permissionKeys("list", LIST_PERMISSIONS),
      ...permissionKeys("item", ITEM_PERMISSIONS),
      ...permissionKeys("role", ROLE_PERMISSIONS),
      ...permissionKeys("permission", PERMISSION_GRANT_PERMISSIONS),
    ],
  },
  WORKSPACE_ADMIN: {
    id: "01900000-0000-7000-8000-000000000003",
    key: "workspace.admin",
    name: "Workspace Admin",
    description:
      "Manages workspace settings and grants without deleting the workspace or defining roles",
    relation: "admin",
    permissionKeys: [
      ...permissionKeys(
        "workspace",
        withoutActions(WORKSPACE_PERMISSIONS, "delete"),
      ),
      ...permissionKeys("space", withoutActions(SPACE_PERMISSIONS, "delete")),
      ...permissionKeys("list", withoutActions(LIST_PERMISSIONS, "delete")),
      ...permissionKeys("item", withoutActions(ITEM_PERMISSIONS, "delete")),
      ...permissionKeys("role", ["read"]),
      ...permissionKeys("permission", PERMISSION_GRANT_PERMISSIONS),
    ],
  },
  WORKSPACE_MEMBER: {
    id: "01900000-0000-7000-8000-000000000004",
    key: "workspace.member",
    name: "Workspace Member",
    description: "Read access to workspace resources and roles; can create spaces and lists",
    relation: "member",
    permissionKeys: [
      ...permissionKeys("workspace", ["read", "create_space", "create_list"]),
      ...permissionKeys("space", ["read", "create_list"]),
      ...permissionKeys("list", ["read", "create_item"]),
      ...permissionKeys("item", ["read", "update"]),
      ...permissionKeys("role", ["read"]),
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

export const ALL_WORKSPACE_ROLES: readonly RoleDefinition[] = [
  WORKSPACE_ROLES.WORKSPACE_OWNER,
  WORKSPACE_ROLES.WORKSPACE_ADMIN,
  WORKSPACE_ROLES.WORKSPACE_MEMBER,
];

export const ALL_SYSTEM_ROLES: readonly RoleDefinition[] = [
  ...ALL_PLATFORM_ROLES,
  ...ALL_TENANT_ROLES,
  ...ALL_WORKSPACE_ROLES,
];

export type PlatformRoleKey = "platform.admin" | "platform.member";
export type TenantRoleKey = "tenant.owner" | "tenant.admin" | "tenant.member";
export type WorkspaceRoleKey =
  | "workspace.owner"
  | "workspace.admin"
  | "workspace.member";
