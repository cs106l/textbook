"use client";

import { Box, Button, ButtonProps, Stack } from "@mui/material";
import React, { useMemo } from "react";
import Editor from "react-simple-code-editor";

import "./highlight.scss";
import hljs from "highlight.js";
import { monospace } from "@/app/theme";
import { diffArrays } from "diff";

/* ========================================================================= */
/* CodeBlock                                                                 */
/* ========================================================================= */

export type CodeBlockProps = {
  children: React.ReactNode;
};

export default function CodeBlock({ children }: CodeBlockProps) {
  const { options, initialContent } = useMemo(
    () => extractContent(children),
    [children]
  );

  const { anchor, onChange } = useAnchor(initialContent);
  const [focused, setFocused] = React.useState(true);

  const code = useMemo<string>(() => {
    if (!anchor.hasAnchor) return anchor.code;
    if (focused) return anchor.lines.slice(anchor.start, anchor.end).join("\n");
    return anchor.lines.join("\n");
  }, [anchor, focused]);

  const highlighter = React.useCallback(
    (code: string) => {
      if (!anchor.hasAnchor || focused)
        return highlight(code, { language: options.language, br: true });

      const before = anchor.lines.slice(0, anchor.start);
      const between = anchor.lines.slice(anchor.start, anchor.end);
      const after = anchor.lines.slice(anchor.end);

      // Handle missing newlines
      if (between.length) before.push("");
      if (after.length) between.push("");

      /* Note: To get parity between react-simple-editor textarea and pre,
       * we must terminate the last highlight div with a <br /> tag.
       * Otherwise, inserting a newline at the end of the textarea
       * won't match up with the pre element
       */

      return (
        <>
          {before.length > 0 &&
            highlight(before.join("\n"), {
              br: between.length === 0 && after.length === 0,
              language: options.language,
              div: {
                className: "anchor-dim",
              },
            })}
          {between.length > 0 &&
            highlight(between.join("\n"), {
              br: after.length === 0,
              language: options.language,
            })}
          {after.length > 0 &&
            highlight(after.join("\n"), {
              br: true,
              language: options.language,
              div: {
                className: "anchor-dim",
              },
            })}
        </>
      );
    },
    [options, anchor, focused]
  );

  const [copied, setCopied] = React.useState(false);
  const copyTimeout = React.useRef<NodeJS.Timeout | undefined>(undefined);
  const copyCode = React.useCallback(() => {
    navigator.clipboard.writeText(code.replace("`[]`", ""));
    setCopied(true);
    clearTimeout(copyTimeout.current);
    copyTimeout.current = setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <Box
      sx={{
        marginBottom: 2,
        fontFamily: monospace.style.fontFamily,
        fontSize: ".875em",
        backgroundColor: "var(--palette-background-code)",
        borderRadius: "var(--shape-borderRadius)",

        position: "relative",

        "& pre, textarea": {
          whiteSpace: "pre !important",
        },

        "& textarea": {
          outline: "none",
        },

        "&:hover .actions": {
          opacity: 1,
        },

        "& .anchor-dim": {
          opacity: 0.5,
        },
      }}
    >
      {/* This box actually contains the editor.
          It allows scrolling when the code block contents exceed width. */}
      <Box
        sx={{
          paddingY: 1,
          paddingX: 2,
          overflowX: "scroll",
          scrollbarWidth: "none",
          height: 1,
          width: 1,
        }}
        ref={(el?: HTMLElement) => {
          // Set tabindex to -1 if code is not runnable
          if (!el) return;
          const textarea = el.querySelector("textarea");
          if (textarea) textarea.tabIndex = options.runnable ? 0 : -1;
        }}
      >
        <Editor
          className="codeblock"
          value={code}
          onValueChange={(code) => onChange(code, focused)}
          readOnly={!options.runnable}
          highlight={highlighter}
          placeholder={options.runnable ? "Type some code..." : undefined}
          style={{
            overflow: "visible",
            float: "left",
            minHeight: "100%",
            minWidth: "100%",
          }}
        />
      </Box>
      <Stack
        direction="row-reverse"
        spacing={0.75}
        className="actions"
        position="absolute"
        top={0}
        left={0}
        right={0}
        m={1}
        sx={{ opacity: 0, transition: "opacity 0.1s", pointerEvents: "none" }}
      >
        <ChipButton onClick={copyCode}>
          {copied ? "Copied!" : "Copy"}
        </ChipButton>
        {anchor.hasAnchor && (
          <ChipButton onClick={() => setFocused((focused) => !focused)}>
            {focused ? "Show" : "Hide"}
          </ChipButton>
        )}
      </Stack>
    </Box>
  );
}

function ChipButton(props: ButtonProps) {
  return (
    <Button
      variant="outlined"
      size="small"
      color="inherit"
      sx={(theme) => ({
        pointerEvents: "auto",
        fontSize: "0.75em",
        px: "4px",
        py: 0,
        minWidth: "unset",
        textTransform: "unset",
        color: "var(--palette-grey-600)",
        borderColor: "var(--palette-grey-300)",
        backgroundColor: "var(--palette-background-code)",
        ...theme.applyStyles("dark", {
          color: "var(--palette-grey-400)",
          borderColor: "var(--palette-grey-700)",
        }),
      })}
      {...props}
    />
  );
}

function highlight(
  code: string,
  options: {
    language?: string;
    br?: boolean;
    div?: React.HTMLAttributes<HTMLDivElement>;
  }
): React.ReactNode {
  if (!options.language) return sanitizeHtml(code);

  const { language, br, div: divProps } = options;

  /* This code here handles inserting callouts, e.g. L1, to the code */
  let calloutNum = 1;
  let html = code
    .split(/(`\[\]`)/)
    .flatMap((s) => (s === "`[]`" ? [null] : s ? [s] : []))
    .map((token) => {
      if (token === null)
        return `<span class="marker"><code>L${calloutNum++}</code></span>`;
      return hljs.highlight(token, { language }).value;
    })
    .join("");

  if (br) html += "<br/>";
  return <div dangerouslySetInnerHTML={{ __html: html }} {...divProps} />;
}

function sanitizeHtml(html: string): string {
  return html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ========================================================================= */
/* Anchoring Code                                                            */
/* ========================================================================= */

type AnchorlessCode = {
  hasAnchor: false;
  code: string;
};

type AnchoredCode = {
  hasAnchor: true;
  lines: string[];
  start: number;
  end: number;
};

type Anchor = AnchorlessCode | AnchoredCode;

/**
 * Computes the new anchor after a change in the code.
 * Given a previous anchor and the new code, this function determines the new
 * `start` and `end` indices of the anchored region.
 *
 * @param anchor The existing anchor.
 * @param lines The new code lines.
 * @returns A new anchored code.
 */
function preserveAnchor(anchor: AnchoredCode, lines: string[]): AnchoredCode {
  const changes = diffArrays(anchor.lines, lines);

  let originalPos = 0; // Position in the original text
  let modifiedPos = 0; // Position in the modified text
  let newStart = anchor.start;
  let newEnd = anchor.end;

  for (const change of changes) {
    const length = change.value.length;

    if (change.added) {
      // Adjust indices if additions occur before or within the range
      if (modifiedPos <= newStart) {
        newStart += length;
        newEnd += length;
      } else if (modifiedPos <= newEnd) {
        newEnd += length;
      }
      modifiedPos += length;
    } else if (change.removed) {
      // Adjust indices if removals overlap the range
      if (originalPos < anchor.start && originalPos + length > anchor.start) {
        newStart = originalPos;
      }
      if (originalPos < anchor.end && originalPos + length > anchor.end) {
        newEnd = originalPos;
      }
      originalPos += length;
    } else {
      // Unchanged text: Move both pointers and adjust indices
      if (originalPos <= anchor.start && originalPos + length > anchor.start) {
        newStart = modifiedPos + (anchor.start - originalPos);
      }
      if (originalPos <= anchor.end && originalPos + length > anchor.end) {
        newEnd = modifiedPos + (anchor.end - originalPos);
      }
      originalPos += length;
      modifiedPos += length;
    }
  }

  return { hasAnchor: true, lines, start: newStart, end: newEnd };
}

function useAnchor(initialCode: string): {
  anchor: Anchor;
  onChange: (newCode: string, isFocused: boolean) => void;
} {
  // 1. Extract anchor (or not) from initial code
  // 2. If code has no anchor, return anchorless result
  //     - code: stateful string
  //     - onChange: update code
  // 3. If code has anchor, return anchored result
  //    - lines: split code by line
  //    - start: line number of start anchor
  //    - end: line number of end anchor + 1
  //    - onChange: update code, do diff

  const initialAnchor = React.useMemo<Anchor>(() => {
    const lines = initialCode.split("\n");
    const start = lines.indexOf("!!!");
    const end = lines.lastIndexOf("!!!");

    if (start === -1 && end === -1) {
      return { hasAnchor: false, code: initialCode };
    }

    if (start === end) {
      return { hasAnchor: false, code: initialCode };
    }

    // Anchor covers entire code block, same as if anchor wasn't there
    if (start === 0 && end === lines.length - 1) {
      return {
        hasAnchor: false,
        code: lines.slice(1, lines.length - 1).join("\n"),
      };
    }

    const before = lines.slice(0, start);
    const between = lines.slice(start + 1, end);
    const after = lines.slice(end + 1);

    return {
      hasAnchor: true,
      lines: [...before, ...between, ...after],
      start: before.length,
      end: before.length + between.length,
    };
  }, [initialCode]);

  const [anchor, setAnchor] = React.useState<Anchor>(initialAnchor);
  const onChange = React.useCallback(
    (code: string, isFocused: boolean) => {
      if (!anchor.hasAnchor) {
        return setAnchor({ hasAnchor: false, code });
      }

      const lines = code.split("\n");

      if (isFocused) {
        const before = anchor.lines.slice(0, anchor.start);
        const after = anchor.lines.slice(anchor.end);
        return setAnchor({
          hasAnchor: true,
          lines: [...before, ...lines, ...after],
          start: anchor.start,
          end: anchor.start + lines.length,
        });
      }

      setAnchor(preserveAnchor(anchor, lines));
    },
    [anchor]
  );

  return { anchor, onChange };
}

/* ========================================================================= */
/* Extracting <pre /> content from markdown                                  */
/* ========================================================================= */

type PreOptions = {
  language?: string;
  runnable?: boolean;
};

type PreContent = {
  options: PreOptions;
  initialContent: string;
};

function getOptions(rawString?: string): PreOptions {
  if (!rawString) return {};

  const removePrefix = "language-";
  if (rawString.startsWith(removePrefix))
    rawString = rawString.slice(removePrefix.length);

  const options = rawString.split(",");
  return {
    language: options[0],
    runnable: options.includes("runnable"),
  };
}

function extractContent(node: React.ReactNode): PreContent {
  const invalid = new Error("Invalid <code /> structure");

  if (!React.isValidElement(node) || node.type !== "code") throw invalid;

  const props = node.props as {
    children?: string;
    className?: string;
  };

  let children = props.children;
  const className = props.className;

  if (typeof children !== "string") throw invalid;
  if (children.endsWith("\n")) children = children.slice(0, -1);
  return {
    options: getOptions(className),
    initialContent: children,
  };
}
