import { ALL_WORKSPACE_ROLES, ALL_PLATFORM_ROLES, ALL_TENANT_ROLES } from "./SystemRoles";
import type { RoleDefinition } from "./RoleDefinition";

const matchesRole = (
  role: RoleDefinition,
  match: { id?: string | null; key?: string | null },
): boolean =>
  (match.id != null && role.id === match.id) || (match.key != null && role.key === match.key);

export const findPlatformRoleDefinition = (match: {
  id?: string | null;
  key?: string | null;
}): RoleDefinition | undefined => {
  if (!match.id && !match.key) {
    return undefined;
  }

  for (const role of ALL_PLATFORM_ROLES) {
    if (matchesRole(role, match)) {
      return role;
    }
  }

  return undefined;
};

export const findTenantRoleDefinition = (match: {
  id?: string | null;
  key?: string | null;
}): RoleDefinition | undefined => {
  if (!match.id && !match.key) {
    return undefined;
  }

  for (const role of ALL_TENANT_ROLES) {
    if (matchesRole(role, match)) {
      return role;
    }
  }

  return undefined;
};

export const findWorkspaceRoleDefinition = (match: {
  id?: string | null;
  key?: string | null;
}): RoleDefinition | undefined => {
  if (!match.id && !match.key) {
    return undefined;
  }

  for (const role of ALL_WORKSPACE_ROLES) {
    if (matchesRole(role, match)) {
      return role;
    }
  }

  return undefined;
};

export const findSystemRoleDefinition = (match: {
  id?: string | null;
  key?: string | null;
}): RoleDefinition | undefined =>
  findPlatformRoleDefinition(match) ??
  findTenantRoleDefinition(match) ??
  findWorkspaceRoleDefinition(match);

export const platformRolePermissionKeys = (match: {
  id?: string | null;
  key?: string | null;
}): readonly string[] => findPlatformRoleDefinition(match)?.permissionKeys ?? [];

export const tenantRolePermissionKeys = (match: {
  id?: string | null;
  key?: string | null;
}): readonly string[] => findTenantRoleDefinition(match)?.permissionKeys ?? [];

export const workspaceRolePermissionKeys = (match: {
  id?: string | null;
  key?: string | null;
}): readonly string[] => findWorkspaceRoleDefinition(match)?.permissionKeys ?? [];

export const systemRolePermissionKeys = (match: {
  id?: string | null;
  key?: string | null;
}): readonly string[] => findSystemRoleDefinition(match)?.permissionKeys ?? [];
