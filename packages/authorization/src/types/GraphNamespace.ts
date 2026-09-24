export type GraphNamespace =
  | "identity"
  | "profile"
  | "platform"
  | "tenant"
  | "workspace"
  | "space"
  | "list"
  | "item"
  | "role"
  | "permission";

export const GRAPH_NAMESPACES: readonly GraphNamespace[] = [
  "identity",
  "profile",
  "platform",
  "tenant",
  "workspace",
  "space",
  "list",
  "item",
  "role",
  "permission",
];

export const isGraphNamespace = (value: string): value is GraphNamespace => {
  for (const namespace of GRAPH_NAMESPACES) {
    if (namespace === value) {
      return true;
    }
  }
  return false;
};
