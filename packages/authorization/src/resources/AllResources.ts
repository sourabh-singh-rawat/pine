export type Resource =
  | "profile"
  | "platform"
  | "tenant"
  | "workspace"
  | "space"
  | "list"
  | "item"
  | "role"
  | "permission";

export type ResourceKey = `${Resource}:${string}`;

export const RESOURCES: readonly Resource[] = [
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

export const isResource = (value: string): value is Resource => {
  for (const resource of RESOURCES) {
    if (resource === value) {
      return true;
    }
  }
  return false;
};
