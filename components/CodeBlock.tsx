"use client";

import { Box, Button, ButtonProps, Stack } from "@mui/material";
import React, { useMemo } from "react";
import Editor from "react-simple-code-editor";

import "highlight.js/styles/github.css";
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
      if (!options.language) return code;
      const highlight = hljs.highlight(code, { language: options.language });
      const html = `${highlight.value}<br/>`;
      return <div dangerouslySetInnerHTML={{ __html: html }} />;
    },
    [options]
  );

  const [copied, setCopied] = React.useState(false);
  const copyTimeout = React.useRef<NodeJS.Timeout | undefined>(undefined);
  const copyCode = React.useCallback(() => {
    navigator.clipboard.writeText(code);
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
      }}
    >
      {/* This box actually contains the editor.
          It allows scrolling when the code block contents exceed width.
          Note: scrolling must be disabled when editable, otherwise
          textarea will be messed up. */}
      <Box
        sx={{
          paddingY: 1,
          paddingX: 2,
          overflowX: "scroll",
          scrollbarWidth: "none",
          height: 1,
          width: 1,
        }}
      >
        <Editor
          value={code}
          onValueChange={(code) => onChange(code, focused)}
          readOnly={!options.runnable}
          highlight={highlighter}
          placeholder="Type some code..."
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
        ...theme.applyStyles("dark", {
          color: "var(--palette-grey-400)",
          borderColor: "var(--palette-grey-700)",
        }),
      })}
      {...props}
    />
  );
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
    // TODO: determine anchors from initial code
    return { hasAnchor: false, code: initialCode };
  }, [initialCode]);

  const [anchor, setAnchor] = React.useState<Anchor>(initialAnchor);
  const onChange = React.useCallback(
    (code: string, isFocused: boolean) => {
      if (!anchor.hasAnchor) {
        return setAnchor({ hasAnchor: false, code });
      }

      const lines = code.split("\n");
      if (isFocused) {
        const before = lines.slice(0, anchor.start);
        const after = lines.slice(anchor.end);
        return setAnchor({
          hasAnchor: true,
          lines: [...before, ...lines, ...after],
          start: anchor.start,
          end: anchor.start + lines.length,
        });
      }

      // eslint-disable-next-line
      const changes = diffArrays(anchor.lines, lines);

      // TODO: diffing logic
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
    children: string;
    className?: string;
  };

  if (typeof props.children !== "string") throw invalid;
  if (props.children.endsWith("\n"))
    props.children = props.children.slice(0, -1);
  return {
    options: getOptions(props.className),
    initialContent: props.children,
  };
}
