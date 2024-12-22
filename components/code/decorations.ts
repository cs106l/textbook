/*
 * This file contains a set of utilities for working with decorated code,
 * that is, code which has been annotated with additional, non-textual
 * information such as highlights, markers, etc.
 *
 * Individual decorations are represented as ranges in the source code.
 * Note that decorations, like markdown, are not allowed to overlap.
 *
 * This file contains three parts:
 *  1) Tracking decorations
 *      Handles updating decoration positions in response to code changes
 *  2) Generating initial decorations
 *      Generates initial decorations from a configuration and a code string
 *  3) Tokenizing decorated code
 *      Splits a decorated code string into a list of tokens for, e.g. styling.
 */

type Decoration<TKind> = {
  kind: TKind;
  start: number;
  end: number;
};

type DecoratedCode<TKind> = {
  code: string;
  decorations: Decoration<TKind>[];
};

/* ========================================================================= */
/* Tracking decoration state                                                 */
/* ========================================================================= */

type DecorationHook<TKind> = {
  code: DecoratedCode<TKind>;
  onChange: (code: string) => void;
};

function useDecorations<TKind>(
  initial: DecoratedCode<TKind>
): DecorationHook<TKind> {
  throw new Error("Not implemented");
}

/* ========================================================================= */
/* Generating initial decorations                                            */
/* ========================================================================= */

type DecorationMatcher<TKind> = {
  kind: TKind;
  pattern: RegExp;
  extract: (match: RegExpMatchArray) => string;
};

function getDecorations<TKind>(
  code: string,
  matchers: DecorationMatcher<TKind>[]
): DecoratedCode<TKind> {
  throw new Error("Not implemented");
}

/* ========================================================================= */
/* Tokenizing decorated code                                                 */
/* ========================================================================= */

type DecoratedToken<TKind> = {
  kind: TKind | null;
  text: string;
};

function tokenizeDecorations<TKind>(
  code: DecoratedCode<TKind>
): DecoratedToken<TKind>[] {
  throw new Error("Not implemented");
}
