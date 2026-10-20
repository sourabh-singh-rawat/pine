import { SyntaxKind, tokenIsIdentifierOrKeyword } from "typescript/unstable/ast";
import { tokenize, type ScannedToken } from "./scan-source.ts";

export type PermissionCatalog = {
  readonly namespace: string;
  readonly permits: readonly string[];
};

const HIDDEN_PERMITS: readonly { readonly namespace: string; readonly permit: string }[] = [
  { namespace: "Tenant", permit: "administer" },
];

export const readNamespaceCatalogs = (source: string): PermissionCatalog[] =>
  readPermits(tokenize(source));

export const readResourceNames = (source: string): string[] => readResources(tokenize(source));

const readPermits = (tokens: readonly ScannedToken[]): PermissionCatalog[] => {
  const catalogs: PermissionCatalog[] = [];
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
    const permits = classPermits(name.text, tokens, open, close);
    if (permits) {
      if (seenNamespaces.has(name.text)) {
        throw new Error(`Duplicate namespace class ${name.text}`);
      }
      seenNamespaces.add(name.text);
      const visible = permits.filter((permit) => !isHidden(name.text, permit));
      if (visible.length > 0) {
        catalogs.push({ namespace: name.text, permits: visible });
      }
    }
    index = close + 1;
  }
  return catalogs;
};

const classPermits = (
  namespace: string,
  tokens: readonly ScannedToken[],
  open: number,
  close: number,
): readonly string[] | null => {
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
      token.kind === SyntaxKind.Identifier &&
      token.text === "permits" &&
      tokens[index + 1]?.kind === SyntaxKind.EqualsToken &&
      tokens[index + 2]?.kind === SyntaxKind.OpenBraceToken
    ) {
      return readPermitObject(namespace, tokens, index + 2).permits;
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
  return null;
};

const readPermitObject = (
  namespace: string,
  tokens: readonly ScannedToken[],
  open: number,
): { readonly permits: string[]; readonly end: number } => {
  const permits: string[] = [];
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
      throw new Error(`${namespace}.permits cannot use template literals`);
    }
    if (token.kind === SyntaxKind.OpenBraceToken) {
      brace += 1;
      index += 1;
      continue;
    }
    if (token.kind === SyntaxKind.CloseBraceToken) {
      brace -= 1;
      if (brace === 0) {
        return { permits, end: index };
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
        throw new Error(`${namespace}.permits cannot use computed names`);
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
      if (token.kind === SyntaxKind.CommaToken) {
        index += 1;
        continue;
      }
      if (token.kind === SyntaxKind.DotDotDotToken) {
        throw new Error(`${namespace}.permits cannot use spread`);
      }
      if (!tokenIsIdentifierOrKeyword(token.kind) && token.kind !== SyntaxKind.StringLiteral) {
        throw new Error(
          `${namespace}.permits entries must be named properties (found ${token.text} kind ${token.kind})`,
        );
      }
      if (tokens[index + 1]?.kind !== SyntaxKind.ColonToken) {
        throw new Error(`${namespace}.permits entries must be named properties`);
      }
      if (seen.has(token.text)) {
        throw new Error(`Duplicate permit ${namespace}.${token.text}`);
      }
      seen.add(token.text);
      permits.push(token.text);
      mode = "value";
      index += 2;
      continue;
    }
    if (atProperties && mode === "value" && token.kind === SyntaxKind.CommaToken) {
      mode = "key";
    }
    index += 1;
  }
  throw new Error(`${namespace}.permits is missing a closing brace`);
};

const readResources = (tokens: readonly ScannedToken[]): string[] => {
  let resources: string[] | null = null;
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token?.kind !== SyntaxKind.Identifier || token.text !== "RESOURCES") {
      continue;
    }
    let equals = index + 1;
    while (equals < tokens.length && tokens[equals]?.kind !== SyntaxKind.EqualsToken) {
      equals += 1;
    }
    if (tokens[equals + 1]?.kind !== SyntaxKind.OpenBracketToken) {
      continue;
    }
    if (resources) {
      throw new Error("RESOURCES is declared more than once");
    }
    const values: string[] = [];
    let cursor = equals + 2;
    while (cursor < tokens.length && tokens[cursor]?.kind !== SyntaxKind.CloseBracketToken) {
      const entry = tokens[cursor];
      if (entry?.kind === SyntaxKind.StringLiteral) {
        values.push(entry.text);
      } else if (entry?.kind !== SyntaxKind.CommaToken) {
        throw new Error("RESOURCES entries must be string literals");
      }
      cursor += 1;
    }
    resources = values;
  }
  if (!resources) {
    throw new Error("RESOURCES was not found in AllResources.ts");
  }
  return resources;
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

const isHidden = (namespace: string, permit: string): boolean =>
  HIDDEN_PERMITS.some((hidden) => hidden.namespace === namespace && hidden.permit === permit);
