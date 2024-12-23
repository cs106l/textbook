/*
 * This file contains a set of utilities for working with decorated code,
 * that is, code which has been annotated with additional, non-textual
 * information such as highlights, markers, etc.
 *
 * Individual decorations are represented as ranges in the source code.
 * Note that decorations, like DOM nodes, may contain one another but
 * are not allowed to overlap.
 *
 * This file contains three parts:
 *  1) Tracking decorations
 *      Handles updating decoration positions in response to code changes
 *  2) Generating initial decorations
 *      Generates initial decorations from a configuration and a code string
 *  3) Reducing decorated code
 *      Applies a reduction function to each token in decorated code.
 */

import { diffChars } from "diff";
import React from "react";

export type Decoration<TData> = {
  data: TData;
  start: number; // Inclusive
  length: number;
};

export type DecoratedCode<TData> = {
  code: string;
  decorations: Decoration<TData>[];
};

/* ========================================================================= */
/* Tracking decoration state                                                 */
/* ========================================================================= */

type DecorationHookOptions<TData> = {
  initialCode: string;
  matchers: DecorationMatcher<TData>[];
};

type DecorationHook<TData> = {
  decorated: DecoratedCode<TData>;
  onChange: (newCode: string) => void;
};

export function useDecorations<TData>({
  initialCode,
  matchers,
}: DecorationHookOptions<TData>): DecorationHook<TData> {
  const [decorated, setDecorated] = React.useState(
    getDecorations(initialCode, matchers)
  );

  const onChange = React.useCallback(
    (newCode: string) => {
      const changes = diffChars(decorated.code, newCode);
      for (const decoration of decorated.decorations) {
        let pos = 0;
        let start = decoration.start;
        let length = decoration.length;

        for (const change of changes) {
          if (pos >= start + length) break;
          const tokenCount = change.value.length;
          if (change.added) {
            // Addition
            if (pos <= start) start += tokenCount;
            else if (pos < start + length) length += tokenCount;
            pos += tokenCount;
          } else if (change.removed) {
            // Deletion
            if (pos < start) {
              // Deleted region starts left of the decoration
              // It may overlap the decoration also!
              const sd = Math.min(start - pos, tokenCount);
              const ld = Math.min(pos + tokenCount - start, length);
              if (sd > 0) start -= sd;
              if (ld > 0) length -= ld;
            } else if (pos < start + length) {
              // Deleted region starts inside of the decoration
              length -= Math.min(start + length - pos, tokenCount);
            }
          } else {
            // No change
            pos += tokenCount;
          }
        }

        decoration.start = start;
        decoration.length = length;
      }

      setDecorated({
        code: newCode,
        decorations: conformDecorations(decorated.decorations),
      });
    },
    [decorated]
  );

  return { decorated, onChange };
}

/**
 * For simplicity, after updates if any decorations badly overlap,
 * we will remove the later one.
 *
 * This function also sorts decorations by start position and
 * removes empty decorations.
 *
 * @param decorations An array of decorations, updated in place.
 */
function conformDecorations(decorations: Decoration<any>[]): Decoration<any>[] {
  decorations = decorations.filter((d) => d.length > 0);
  decorations.sort((a, b) => a.start - b.start);
  for (let i = 0; i < decorations.length; i++) {
    const a = decorations[i];
    for (let j = i + 1; j < decorations.length; j++) {
      const b = decorations[j];
      if (badOverlap(a, b)) {
        decorations.splice(j, 1);
        j--;
      }
    }
  }
  return decorations;
}

/* ========================================================================= */
/* Generating initial decorations                                            */
/* ========================================================================= */

export type DecorationMatcher<TData> = {
  /** The regex to match decorations. Every match will be replaced. */
  pattern: RegExp;
  /**
   * Gets a match object from a regex match.
   * @param match The regex match object.
   * @param index The zero-based index of the match in the list of matches of this type.
   * @returns A match object.
   */
  extract: (match: RegExpExecArray, index: number) => DecorationMatch<TData>;
};

export type DecorationMatch<TData> = {
  /**
   * The replacement for this match. This defines the extents of the decoration
   * (any text returned here will be included in the decoration).
   */
  token: string;

  /** Additional data to associate with this decoration. */
  data: TData;

  /**
   * Transforms a decoration contained by this one.
   * @param child A child decoration that is contained by this one.
   * @returns `false` if the child should be removed.
   *
   * This method resolves the indexes of decorations that contain eachother.
   * After transformation, the child must remain a child of this match and
   * must not overlap any other decoration (the matcher will verify this).
   */
  transform?: (child: Decoration<TData>) => boolean | void;
};

export function getDecorations<TData>(
  code: string,
  matchers: DecorationMatcher<TData>[]
): DecoratedCode<TData> {
  const decorations: Decoration<TData>[] = [];

  for (const matcher of matchers) {
    let match: RegExpExecArray | null;
    let index = 0;

    while ((match = matcher.pattern.exec(code))) {
      const { token, data, transform } = matcher.extract(match, index++);
      const deco = { data, start: match.index, length: match[0].length };

      // Check for bad overlap between decorations
      confirmOverlap(deco, decorations, match[0]);

      // Update positions of existing decorations
      const diff = match[0].length - token.length;
      const deletedIndices = new Set<number>();

      for (let i = 0; i < decorations.length; i++) {
        const other = decorations[i];
        if (contains(other, deco)) other.length -= diff;
        else if (contains(deco, other)) {
          if (!transform)
            throw new Error(
              [
                `Lower precedence decorator ${JSON.stringify(
                  deco.data
                )} may not contain a higher precedence one ${JSON.stringify(
                  other.data
                )}.`,
                "",
                match[0],
                "",
                "To enable this behaviour, provide a `transform` function in the decoration matcher",
                " that can determine how to ",
              ].join("\n")
            );

          const keep = transform(other);
          if (keep === false) deletedIndices.add(i);
          else {
            // After transformation, a child must remain a child
            // and must not overlap any other decoration
            if (!contains(deco, other))
              throw new Error(
                `After transformation, child ${JSON.stringify(
                  other.data
                )} of node ${JSON.stringify(deco.data)} must remain a child.`
              );

            confirmOverlap(other, decorations, match[0]);
          }
        } else if (other.start > deco.start) other.start -= diff;
      }

      // Remove children that were deleted during transformation
      for (const index of [...deletedIndices].sort((a, b) => b - a)) {
        decorations.splice(index, 1);
      }

      code =
        code.slice(0, deco.start) +
        token +
        code.slice(deco.start + deco.length);

      deco.length -= diff;
      decorations.push(deco);
    }
  }

  decorations.sort((a, b) => a.start - b.start);
  return { code, decorations };
}

function contains(a: Decoration<any>, b: Decoration<any>) {
  return a.start <= b.start && a.start + a.length >= b.start + b.length;
}

function overlaps(a: Decoration<any>, b: Decoration<any>) {
  return a.start < b.start + b.length && a.start + a.length > b.start;
}

function badOverlap(a: Decoration<any>, b: Decoration<any>) {
  return !contains(a, b) && !contains(b, a) && overlaps(a, b);
}

function confirmOverlap(
  deco: Decoration<any>,
  decorations: Decoration<any>[],
  context?: string
) {
  for (const other of decorations) {
    if (badOverlap(deco, other))
      throw new Error(
        [
          `Overlapping decorations detected:`,
          "",
          JSON.stringify(deco.data),
          JSON.stringify(other.data),
          ...(context ? ["", context, ""] : []),
          "Decorations may contain eachother, but must not overlap at their boundaries.",
        ].join("\n")
      );
  }
}

/* ========================================================================= */
/* Reducing decorated code                                                   */
/* ========================================================================= */

type IndexRef = {
  index: number;
};

export type Reducer<TData> = (token: string, data?: TData) => string;

export function reduceDecorations<TData>(
  code: DecoratedCode<TData>,
  reducer: Reducer<TData>
) {
  return aggregateDecorations(code, { index: 0 }, reducer);
}

function aggregateDecorations<TData>(
  code: DecoratedCode<TData>,
  current: IndexRef,
  reducer: Reducer<TData>,
  dec?: Decoration<TData>
): string {
  const start = dec ? dec.start : 0;
  const end = start + (dec ? dec.length : code.code.length);

  let index = start;
  let contents = "";

  while (current.index < code.decorations.length) {
    const decoration = code.decorations[current.index];
    if (decoration.start >= end) break;
    current.index++;

    if (decoration.start > index) {
      const token = code.code.slice(index, decoration.start);
      contents += reducer(token);
    }

    contents += aggregateDecorations(code, current, reducer, decoration);
    index = decoration.start + decoration.length;
  }

  if (index < end) {
    const token = code.code.slice(index, end);
    contents += reducer(token);
  }

  if (dec) return reducer(contents, dec.data);
  return contents;
}
