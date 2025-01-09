/**
 * Contains the logic for showing/hiding a focus region in a code block,
 * and reacting to user changes in the code block
 */

import { diffArrays } from "diff";
import React from "react";

export type UnfocusableCode = {
  hasFocus: false;
  code: string;
};

export type FocusableCode = {
  hasFocus: true;
  lines: string[];
  start: number;
  length: number;
};

export type FocusAwareCode = UnfocusableCode | FocusableCode;

/**
 * Computes the new focus region after a change in the code.
 * Given a previous focus and the new code, this function determines the new
 * `start` and `end` indices of the focused region.
 *
 * @param anchor The existing anchor.
 * @param lines The new code lines.
 * @returns A new focused code.
 */
function preserveAnchor(anchor: FocusableCode, lines: string[]): FocusableCode {
  const changes = diffArrays(anchor.lines, lines);

  let pos = 0;
  let start = anchor.start;
  let length = anchor.length;

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
        // Deleted region starts left of the region
        // It may overlap the region also!
        const sd = Math.min(start - pos, tokenCount);
        const ld = Math.min(pos + tokenCount - start, length);
        if (sd > 0) start -= sd;
        if (ld > 0) length -= ld;
      } else if (pos < start + length) {
        // Deleted region starts inside of the region
        length -= Math.min(start + length - pos, tokenCount);
      }
    } else {
      // No change
      pos += tokenCount;
    }
  }

  return { hasFocus: true, lines, start, length };
}

export default function useFocus(
  initialCode: string,
  anchor: string
): {
  focus: FocusAwareCode;
  onChange: (newCode: string, isFocused: boolean) => void;
} {
  const initialFocus = React.useMemo<FocusAwareCode>(() => {
    const lines = initialCode.split(/\r?\n/);
    const start = lines.indexOf(anchor);
    const end = lines.lastIndexOf(anchor);

    if (start === -1 && end === -1)
      return { hasFocus: false, code: initialCode };
    if (start === end) return { hasFocus: false, code: initialCode };

    // Focus covers entire code block, same as if focus wasn't there
    if (start === 0 && end === lines.length - 1)
      return {
        hasFocus: false,
        code: lines.slice(1, lines.length - 1).join("\n"),
      };

    const before = lines.slice(0, start);
    const between = lines.slice(start + 1, end);
    const after = lines.slice(end + 1);

    return {
      hasFocus: true,
      lines: [...before, ...between, ...after],
      start: before.length,
      length: between.length,
    };
  }, [initialCode, anchor]);

  const [focus, setFocus] = React.useState<FocusAwareCode>(initialFocus);
  const onChange = React.useCallback(
    (code: string, isFocused: boolean) => {
      if (!focus.hasFocus) return setFocus({ hasFocus: false, code });

      const lines = code.split(/\r?\n/);
      if (isFocused) {
        const before = focus.lines.slice(0, focus.start);
        const after = focus.lines.slice(focus.start + focus.length);
        return setFocus({
          hasFocus: true,
          lines: [...before, ...lines, ...after],
          start: focus.start,
          length: lines.length,
        });
      }

      setFocus(preserveAnchor(focus, lines));
    },
    [focus]
  );

  return { focus, onChange };
}
