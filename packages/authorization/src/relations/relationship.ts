import type { GraphRelationship } from "../types/GraphRelationship";
import type { NamespaceName, RelationFor } from "./__generated__/generated";

export type RelationshipInput<ObjectNamespace extends NamespaceName> = {
  readonly object: RelationshipNode<ObjectNamespace>;
  readonly relation: RelationFor<ObjectNamespace>;
  readonly subject: RelationshipNode<NamespaceName>;
};

export const relationship = <ObjectNamespace extends NamespaceName>(
  input: RelationshipInput<ObjectNamespace>,
): GraphRelationship => ({
  object: { namespace: input.object.namespace, id: input.object.id },
  relation: input.relation,
  subject: { namespace: input.subject.namespace, id: input.subject.id },
});

type RelationshipNode<Namespace extends NamespaceName> = {
  readonly namespace: Namespace;
  readonly id: string;
};
