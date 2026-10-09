export type Resource =
  | "Profile"
  | "Platform"
  | "Tenant"
  | "Organization"
  | "Space"
  | "List"
  | "Item"
  | "Role"
  | "Permission";

export type ResourceKey = `${Resource}:${string}`;

export const RESOURCES: readonly Resource[] = [
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

export const isResource = (value: string): value is Resource => {
  for (const resource of RESOURCES) {
    if (resource === value) {
      return true;
    }
  }
  return false;
};
