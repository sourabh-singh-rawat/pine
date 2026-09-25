import { ALL_PERMISSIONS, permissionKey } from "../permissions";
import type { Resource } from "../resources";

export const permissionKeys = (namespace: Resource, permissions: readonly string[]): string[] => {
  const keys: string[] = [];
  const seen = new Set<string>();
  for (const permission of permissions) {
    const key = permissionKey(namespace, permission);
    if (!seen.has(key)) {
      seen.add(key);
      keys.push(key);
    }
  }
  return keys;
};

export const withoutActions = <T extends string>(
  permissions: readonly T[],
  ...actions: readonly T[]
): T[] => {
  const excluded = new Set(actions);
  return permissions.filter((permission) => !excluded.has(permission));
};

export const allPermissionKeys = (): readonly string[] =>
  ALL_PERMISSIONS.map((entry) => permissionKey(entry.namespace, entry.permission));

export const readPermissionKeys = (): readonly string[] =>
  ALL_PERMISSIONS.filter((entry) => entry.permission === "read").map((entry) =>
    permissionKey(entry.namespace, entry.permission),
  );
