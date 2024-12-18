"use client";

import { Box, Button, ButtonProps, Stack } from "@mui/material";
import React from "react";
import Editor from "react-simple-code-editor";

import "highlight.js/styles/github.css";
import hljs from "highlight.js";
import { monospace } from "@/app/theme";

export type CodeBlockProps = {
  children: React.ReactNode;
};

export default function CodeBlock({ children }: CodeBlockProps) {
  const { options, initialCode } = extractCode(children);
  const [code, setCode] = React.useState(initialCode);

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
          onValueChange={setCode}
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

type CodeOptions = {
  language?: string;
  runnable?: boolean;
};

type Code = {
  options: CodeOptions;
  initialCode: string;
};

function getOptions(rawString?: string): CodeOptions {
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

function extractCode(node: React.ReactNode): Code {
  const invalid = new Error("Invalid <code /> structure");

  if (!React.isValidElement(node) || node.type !== "code") throw invalid;

  let { children, className } = node.props as {
    children: string;
    className?: string;
  };

  if (typeof children !== "string") throw invalid;
  if (children.endsWith("\n")) children = children.slice(0, -1);
  return { options: getOptions(className), initialCode: children };
}
