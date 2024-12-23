"use client";

import { Box, Button, ButtonProps, Stack } from "@mui/material";
import React, { useCallback, useMemo } from "react";
import Editor from "react-simple-code-editor";

import hljs from "highlight.js";
import { monospace } from "@/app/theme";
import {
  DecorationMatcher,
  reduceDecorations,
  Reducer,
  useDecorations,
} from "./code/decorations";

type Tag = "hide" | "marker" | "highlight";

const matchers: DecorationMatcher<Tag>[] = [
  {
    pattern: /^(#)(.*\n?)/m,
    extract: (match) => ({
      token: match[2],
      data: "hide",
      transform(child) {
        child.start -= match[1].length;
      },
    }),
  },
  {
    pattern: /`\[\]`/,
    extract: (_, index) => ({
      token: `L${index + 1}`,
      data: "marker",
    }),
  },
  {
    pattern: /(`\[)(.*)\]`/s,
    extract: (match) => ({
      token: match[2],
      data: "highlight",
      transform(child) {
        child.start -= match[1].length;
      },
    }),
  },
];

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

  const { decorated, onChange } = useDecorations<Tag>({
    initialCode: initialContent,
    matchers,
  });

  console.log(decorated);

  const [focused, setFocused] = React.useState(true);
  const hasFocus = useMemo(
    () => decorated.decorations.some((d) => d.data === "hide"),
    [decorated]
  );

  const awareReduce = useCallback(
    (reducer: Reducer<Tag>) => {
      return reduceDecorations(decorated, (token, data) => {
        if (hasFocus && focused && data === "hide") return "";
        return reducer(token, data);
      });
    },
    [decorated, focused]
  );

  const code = useMemo<string>(
    () => awareReduce((token) => token),
    [awareReduce]
  );

  const highlighter = React.useCallback(
    () =>
      awareReduce((token, data) => {
        if (!data) {
          if (!options.language) return sanitizeHtml(token);
          return hljs.highlight(token, { language: options.language }).value;
        }

        if (data === "marker")
          return `<span class="marker"><code>${token}</code></span>`;
        if (data === "highlight")
          return `<span class="highlight">${token}</span>`;
        if (data === "hide") return `<span class="hide">${token}</span>`;
        return token;
      }),
    [awareReduce, options.language]
  );

  const [copied, setCopied] = React.useState(false);
  const copyTimeout = React.useRef<NodeJS.Timeout | undefined>(undefined);
  const copyCode = React.useCallback(() => {
    navigator.clipboard.writeText(
      awareReduce((token, data) => (data === "marker" ? "" : token))
    );
    setCopied(true);
    clearTimeout(copyTimeout.current);
    copyTimeout.current = setTimeout(() => setCopied(false), 2000);
  }, [awareReduce]);

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
          onValueChange={onChange}
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
        {hasFocus && (
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

function sanitizeHtml(html: string): string {
  return html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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
  // if (children.endsWith("\n")) children = children.slice(0, -1);
  return {
    options: getOptions(className),
    initialContent: children,
  };
}
