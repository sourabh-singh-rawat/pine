import type { NamespaceRelations } from "./relation-catalog.ts";

export const renderRelations = (shapes: readonly NamespaceRelations[]): string => {
  if (shapes.length === 0) {
    throw new Error("No namespace classes found");
  }
  const withRelations = shapes.filter((shape) => shape.relations.length > 0);
  const parts = [
    withRelations.map((shape) => renderRelationType(shape)).join("\n\n"),
    renderNamespaceName(shapes),
    renderNamespaces(shapes),
    renderRelationFor(shapes),
    withRelations.map((shape) => renderRelationConstant(shape)).join("\n\n"),
  ].filter((part) => part.length > 0);
  return `${parts.join("\n\n")}\n`;
};

const renderRelationType = (shape: NamespaceRelations): string =>
  `export type ${shape.namespace}Relation = ${union(shape.relations)};`;

const renderNamespaceName = (shapes: readonly NamespaceRelations[]): string => {
  const members = shapes.map((shape) => `  | ${JSON.stringify(shape.namespace)}`).join("\n");
  return `export type NamespaceName =\n${members};`;
};

const renderNamespaces = (shapes: readonly NamespaceRelations[]): string => {
  const members = shapes.map((shape) => `  ${JSON.stringify(shape.namespace)},`).join("\n");
  return `export const NAMESPACES: readonly NamespaceName[] = [\n${members}\n];`;
};

const renderRelationFor = (shapes: readonly NamespaceRelations[]): string => {
  const lines: string[] = [];
  for (let index = 0; index < shapes.length; index += 1) {
    const shape = shapes[index];
    if (!shape) {
      continue;
    }
    const indent = "  ".repeat(index);
    const resolved = shape.relations.length > 0 ? `${shape.namespace}Relation` : "never";
    const head =
      index === 0 ? "export type RelationFor<N extends NamespaceName> = " : `${indent}: `;
    lines.push(`${head}N extends ${JSON.stringify(shape.namespace)}`);
    lines.push(`${indent}  ? ${resolved}`);
  }
  lines.push(`${"  ".repeat(shapes.length)}: never;`);
  return lines.join("\n");
};

const renderRelationConstant = (shape: NamespaceRelations): string => {
  const values = shape.relations.map((relation) => JSON.stringify(relation)).join(", ");
  return `export const ${constantName(shape.namespace)}: readonly ${shape.namespace}Relation[] = [${values}];`;
};

const constantName = (namespace: string): string =>
  `${namespace.replaceAll(/([a-z0-9])([A-Z])/g, "$1_$2").toUpperCase()}_RELATIONS`;

const union = (relations: readonly string[]): string =>
  relations.map((relation) => JSON.stringify(relation)).join(" | ");
