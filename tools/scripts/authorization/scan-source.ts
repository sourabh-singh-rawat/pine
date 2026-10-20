import { createScanner, LanguageVariant, SyntaxKind } from "typescript/unstable/ast";

export type ScannedToken = {
  readonly kind: SyntaxKind;
  readonly text: string;
};

export const tokenize = (text: string): ScannedToken[] => {
  const scanner = createScanner(true, LanguageVariant.Standard, text);
  const tokens: ScannedToken[] = [];
  const push = (kind: SyntaxKind): void => {
    const value = scanner.getTokenValue();
    tokens.push({ kind, text: value.length > 0 ? value : scanner.getTokenText() });
  };
  const consumeTemplate = (): void => {
    while (true) {
      const kind = scanner.scan();
      if (kind === SyntaxKind.EndOfFile) {
        push(kind);
        return;
      }
      if (kind === SyntaxKind.OpenBraceToken) {
        push(kind);
        consumeBalanced(SyntaxKind.OpenBraceToken, SyntaxKind.CloseBraceToken);
        continue;
      }
      if (kind === SyntaxKind.TemplateHead) {
        push(kind);
        consumeTemplate();
        continue;
      }
      if (kind === SyntaxKind.CloseBraceToken) {
        const continued = scanner.reScanTemplateToken(false);
        push(continued);
        if (continued !== SyntaxKind.TemplateMiddle) {
          return;
        }
        continue;
      }
      push(kind);
    }
  };
  const consumeBalanced = (open: SyntaxKind, close: SyntaxKind): void => {
    let depth = 1;
    while (depth > 0) {
      const kind = scanner.scan();
      push(kind);
      if (kind === SyntaxKind.EndOfFile) {
        return;
      }
      if (kind === open) {
        depth += 1;
      } else if (kind === close) {
        depth -= 1;
      } else if (kind === SyntaxKind.TemplateHead) {
        consumeTemplate();
      }
    }
  };
  while (true) {
    const kind = scanner.scan();
    push(kind);
    if (kind === SyntaxKind.EndOfFile) {
      return tokens;
    }
    if (kind === SyntaxKind.TemplateHead) {
      consumeTemplate();
    }
  }
};
