import { SyntaxKind, tokenIsIdentifierOrKeyword } from "typescript/unstable/ast";
import { tokenize, type ScannedToken } from "./scan-source.ts";

export type NamespaceRelations = {
  readonly namespace: string;
  readonly relations: readonly string[];
};

export const readNamespaceRelations = (source: string): NamespaceRelations[] =>
  readClasses(tokenize(source));

const readClasses = (tokens: readonly ScannedToken[]): NamespaceRelations[] => {
  const shapes: NamespaceRelations[] = [];
  const seenNamespaces = new Set<string>();
  let index = 0;
  while (index < tokens.length) {
    const token = tokens[index];
    if (token?.kind !== SyntaxKind.ClassKeyword) {
      index += 1;
      continue;
    }
    const name = tokens[index + 1];
    if (name?.kind !== SyntaxKind.Identifier) {
      throw new Error("Class is missing a name");
    }
    const open = indexOfKind(tokens, SyntaxKind.OpenBraceToken, index + 2);
    if (open < 0) {
      throw new Error(`${name.text} is missing a class body`);
    }
    const close = matchingBrace(tokens, open);
    if (seenNamespaces.has(name.text)) {
      throw new Error(`Duplicate namespace class ${name.text}`);
    }
    seenNamespaces.add(name.text);
    shapes.push({
      namespace: name.text,
      relations: classRelations(name.text, tokens, open, close) ?? [],
    });
    index = close + 1;
  }
  return shapes;
};

const classRelations = (
  namespace: string,
  tokens: readonly ScannedToken[],
  open: number,
  close: number,
): readonly string[] | null => {
  let relations: readonly string[] | null = null;
  let brace = 1;
  let paren = 0;
  let bracket = 0;
  let index = open + 1;
  while (index < close) {
    const token = tokens[index];
    if (!token) {
      break;
    }
    if (
      brace === 1 &&
      paren === 0 &&
      bracket === 0 &&
      tokenIsIdentifierOrKeyword(token.kind) &&
      token.text === "related" &&
      tokens[index + 1]?.kind === SyntaxKind.ColonToken &&
      tokens[index + 2]?.kind === SyntaxKind.OpenBraceToken
    ) {
      if (relations) {
        throw new Error(`${namespace} declares related more than once`);
      }
      const read = readRelatedType(namespace, tokens, index + 2);
      relations = read.relations;
      index = read.end + 1;
      continue;
    }
    if (token.kind === SyntaxKind.OpenBraceToken) {
      brace += 1;
    } else if (token.kind === SyntaxKind.CloseBraceToken) {
      brace -= 1;
    } else if (token.kind === SyntaxKind.OpenParenToken) {
      paren += 1;
    } else if (token.kind === SyntaxKind.CloseParenToken) {
      paren -= 1;
    } else if (token.kind === SyntaxKind.OpenBracketToken) {
      bracket += 1;
    } else if (token.kind === SyntaxKind.CloseBracketToken) {
      bracket -= 1;
    }
    index += 1;
  }
  return relations;
};

const readRelatedType = (
  namespace: string,
  tokens: readonly ScannedToken[],
  open: number,
): { readonly relations: string[]; readonly end: number } => {
  const relations: string[] = [];
  const seen = new Set<string>();
  let brace = 1;
  let paren = 0;
  let bracket = 0;
  let mode: "key" | "value" = "key";
  let index = open + 1;
  while (index < tokens.length) {
    const token = tokens[index];
    if (!token) {
      break;
    }
    if (isTemplate(token.kind)) {
      throw new Error(`${namespace}.related cannot use template literals`);
    }
    if (token.kind === SyntaxKind.OpenBraceToken) {
      brace += 1;
      index += 1;
      continue;
    }
    if (token.kind === SyntaxKind.CloseBraceToken) {
      brace -= 1;
      if (brace === 0) {
        return { relations, end: index };
      }
      index += 1;
      continue;
    }
    if (token.kind === SyntaxKind.OpenParenToken) {
      paren += 1;
      index += 1;
      continue;
    }
    if (token.kind === SyntaxKind.CloseParenToken) {
      paren -= 1;
      index += 1;
      continue;
    }
    if (token.kind === SyntaxKind.OpenBracketToken) {
      if (mode === "key" && brace === 1 && paren === 0 && bracket === 0) {
        throw new Error(`${namespace}.related cannot use computed names`);
      }
      bracket += 1;
      index += 1;
      continue;
    }
    if (token.kind === SyntaxKind.CloseBracketToken) {
      bracket -= 1;
      index += 1;
      continue;
    }
    const atProperties = brace === 1 && paren === 0 && bracket === 0;
    if (atProperties && mode === "key") {
      if (token.kind === SyntaxKind.CommaToken || token.kind === SyntaxKind.SemicolonToken) {
        index += 1;
        continue;
      }
      if (token.kind === SyntaxKind.DotDotDotToken) {
        throw new Error(`${namespace}.related cannot use spread`);
      }
      const name = propertyName(token);
      if (name === null) {
        throw new Error(
          `${namespace}.related entries must be named properties (found ${token.text} kind ${token.kind})`,
        );
      }
      if (tokens[index + 1]?.kind !== SyntaxKind.ColonToken) {
        throw new Error(`${namespace}.related entries must be named properties`);
      }
      if (seen.has(name)) {
        throw new Error(`Duplicate relation ${namespace}.${name}`);
      }
      seen.add(name);
      relations.push(name);
      mode = "value";
      index += 2;
      continue;
    }
    if (
      atProperties &&
      mode === "value" &&
      (token.kind === SyntaxKind.CommaToken || token.kind === SyntaxKind.SemicolonToken)
    ) {
      mode = "key";
    }
    index += 1;
  }
  throw new Error(`${namespace}.related is missing a closing brace`);
};

const propertyName = (token: ScannedToken): string | null => {
  if (tokenIsIdentifierOrKeyword(token.kind) || token.kind === SyntaxKind.StringLiteral) {
    return token.text;
  }
  return null;
};

const indexOfKind = (tokens: readonly ScannedToken[], kind: SyntaxKind, from: number): number => {
  for (let index = from; index < tokens.length; index += 1) {
    if (tokens[index]?.kind === kind) {
      return index;
    }
  }
  return -1;
};

const matchingBrace = (tokens: readonly ScannedToken[], open: number): number => {
  let depth = 0;
  for (let index = open; index < tokens.length; index += 1) {
    const kind = tokens[index]?.kind;
    if (kind === SyntaxKind.OpenBraceToken) {
      depth += 1;
    } else if (kind === SyntaxKind.CloseBraceToken) {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }
  throw new Error("Class body is missing a closing brace");
};

const isTemplate = (kind: SyntaxKind): boolean =>
  kind === SyntaxKind.NoSubstitutionTemplateLiteral ||
  kind === SyntaxKind.TemplateHead ||
  kind === SyntaxKind.TemplateMiddle ||
  kind === SyntaxKind.TemplateTail;
