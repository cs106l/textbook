"use client";

import { Box, Button, ButtonProps, Stack } from "@mui/material";
import React, { useMemo } from "react";
import Editor from "react-simple-code-editor";

import hljs from "highlight.js";
import { monospace } from "@/app/theme";
import { ReducerContext, StyleParser } from "./styles";
import useFocus from "./focus";

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

/* ========================================================================= */
/* Styling code blocks (highlighting, line markers)                          */
/* ========================================================================= */

const Styles = new StyleParser([
  {
    kind: "marker",
    markdown: (text) => text.replace(/`\[\]`/g, "\u200C  \u200C"),
    rule: { kind: "exact", value: "\u200C  \u200C" },
    render: (_, ctx: { index?: number }) => {
      if (!ctx.index) ctx.index = 1;
      return `<span class="marker"><code>L${ctx.index!++}</code></span>`;
    },
  },
  {
    kind: "highlight",
    markdown: (text) =>
      text.replaceAll("`[", "\u200B").replaceAll("]`", "\u200D"),
    rule: { kind: "delimeted", start: "\u200B", end: "\u200D" },
    render: (text) => `<span class="highlight">${text}</span>`,
  },
]);

function highlight(
  code: string,
  options: {
    language?: string;
    br?: boolean;
    div?: React.HTMLAttributes<HTMLDivElement>;
    context?: ReducerContext;
  }
): React.ReactNode {
  const { language, br, div: divProps, context } = options;
  const tree = Styles.parse(code);

  let html = tree.render((text) => {
    if (!language) return sanitizeHtml(text);
    return hljs.highlight(text, { language }).value;
  }, context);

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
/* CodeBlock                                                                 */
/* ========================================================================= */

export type CodeBlockProps = {
  children: React.ReactNode;
};

export default function CodeBlock({ children }: CodeBlockProps) {
  const { options, initialCode } = useMemo(() => {
    const content = extractContent(children);
    return { ...content, initialCode: Styles.markdown(content.initialContent) };
  }, [children]);

  const { focus, onChange } = useFocus(initialCode, "---");
  const [focused, setFocused] = React.useState(true);

  const code = useMemo<string>(() => {
    if (!focus.hasFocus) return focus.code;
    if (focused)
      return focus.lines
        .slice(focus.start, focus.start + focus.length)
        .join("\n");
    return focus.lines.join("\n");
  }, [focus, focused]);

  const highlighter = React.useCallback(
    (code: string) => {
      if (!focus.hasFocus || focused)
        return highlight(code, { language: options.language, br: true });

      const before = focus.lines.slice(0, focus.start);
      const between = focus.lines.slice(
        focus.start,
        focus.start + focus.length
      );
      const after = focus.lines.slice(focus.start + focus.length);

      // Handle missing newlines
      if (between.length) before.push("");
      if (after.length) between.push("");

      /* Note: To get parity between react-simple-editor textarea and pre,
       * we must terminate the last highlight div with a <br /> tag.
       * Otherwise, inserting a newline at the end of the textarea
       * won't match up with the pre element
       */
      const context: ReducerContext = {};

      return (
        <>
          {before.length > 0 &&
            highlight(before.join("\n"), {
              br: between.length === 0 && after.length === 0,
              language: options.language,
              div: {
                className: "anchor-dim",
              },
              context,
            })}
          {between.length > 0 &&
            highlight(between.join("\n"), {
              br: after.length === 0,
              language: options.language,
              context,
            })}
          {after.length > 0 &&
            highlight(after.join("\n"), {
              br: true,
              language: options.language,
              div: {
                className: "anchor-dim",
              },
              context,
            })}
        </>
      );
    },
    [options, focus, focused]
  );

  const [copied, setCopied] = React.useState(false);
  const copyTimeout = React.useRef<NodeJS.Timeout | undefined>(undefined);
  const copyCode = React.useCallback(() => {
    const tree = Styles.parse(code);
    navigator.clipboard.writeText(tree.clean());
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
        {focus.hasFocus && (
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
