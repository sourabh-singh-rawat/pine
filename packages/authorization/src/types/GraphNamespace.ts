export type GraphNamespace =
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

export const GRAPH_NAMESPACES: readonly GraphNamespace[] = [
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

export const isGraphNamespace = (value: string): value is GraphNamespace => {
  for (const namespace of GRAPH_NAMESPACES) {
    if (namespace === value) {
      return true;
    }
  }
  return false;
};
