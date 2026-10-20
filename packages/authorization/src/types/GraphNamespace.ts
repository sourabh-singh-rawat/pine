import { NAMESPACES, type NamespaceName } from "../relations/__generated__/generated";

export type GraphNamespace = NamespaceName;

export const GRAPH_NAMESPACES: readonly GraphNamespace[] = NAMESPACES;

export const isGraphNamespace = (value: string): value is GraphNamespace => {
  for (const namespace of GRAPH_NAMESPACES) {
    if (namespace === value) {
      return true;
    }
  }
  return false;
};
