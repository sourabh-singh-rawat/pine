import type { GraphRelationship } from "../types/GraphRelationship";
import type { NamespaceName, RelationFor } from "./__generated__/generated";

export type RelationshipInput<
  ObjectNamespace extends NamespaceName,
  SubjectNamespace extends NamespaceName = NamespaceName,
> =
  | {
      readonly object: RelationshipNode<ObjectNamespace>;
      readonly relation: RelationFor<ObjectNamespace>;
      readonly subject: RelationshipNode<SubjectNamespace>;
    }
  | {
      readonly object: RelationshipNode<ObjectNamespace>;
      readonly relation: RelationFor<ObjectNamespace>;
      readonly subjectSet: RelationshipSubjectSetNode<SubjectNamespace>;
    };

export const relationship = <
  ObjectNamespace extends NamespaceName,
  SubjectNamespace extends NamespaceName = NamespaceName,
>(
  input: RelationshipInput<ObjectNamespace, SubjectNamespace>,
): GraphRelationship => {
  if ("subjectSet" in input) {
    return {
      object: { namespace: input.object.namespace, id: input.object.id },
      relation: input.relation,
      subjectSet: {
        namespace: input.subjectSet.namespace,
        id: input.subjectSet.id,
        relation: input.subjectSet.relation,
      },
    };
  }

  return {
    object: { namespace: input.object.namespace, id: input.object.id },
    relation: input.relation,
    subject: { namespace: input.subject.namespace, id: input.subject.id },
  };
};

type RelationshipNode<Namespace extends NamespaceName> = {
  readonly namespace: Namespace;
  readonly id: string;
};

type RelationshipSubjectSetNode<Namespace extends NamespaceName> = {
  readonly namespace: Namespace;
  readonly id: string;
  readonly relation: RelationFor<Namespace>;
};
