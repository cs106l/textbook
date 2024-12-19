import {
  Divider,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableRow,
  Typography,
  TypographyProps,
} from "@mui/material";
import type { MDXComponents } from "mdx/types";
import React from "react";
import CodeBlock from "./components/CodeBlock";
import FootnoteSection from "./components/FootnoteSection";

function typography(props?: TypographyProps) {
  return ({ children, ...rest }: { children: React.ReactNode }) => (
    <Typography {...rest} {...props}>
      {children}
    </Typography>
  );
}

function heading(props?: TypographyProps) {
  const icon = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/icons/link.svg`;
  return typography({
    marginBottom: "1rem",
    paddingTop: "1rem",
    sx: {
      position: "relative",
      "& > a": {
        textDecoration: "none",
        color: "inherit",
      },
      "& > a:before": {
        opacity: 0,
        transition: "opacity 0.1s",
        width: "16px",
        height: "16px",
        content: '""',
        mask: `url("${icon}") no-repeat 50% 50%`,
        backgroundColor: "var(--palette-text-primary)",
        position: "absolute",
        left: "-24px",
        top: "50%",
      },
      "&:hover a:before": {
        opacity: 1,
      },
    },
    ...props,
  });
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    h1: heading({ variant: "h1" }),
    h2: heading({ variant: "h2" }),
    h3: heading({ variant: "h3" }),
    h4: heading({ variant: "h4" }),
    h5: heading({ variant: "h5" }),
    h6: heading({ variant: "h6" }),
    p: typography({ variant: "body1", marginBottom: "1rem" }),
    pre: CodeBlock,
    hr: () => <Divider sx={{ mb: 2 }} />,
    section: (props) =>
      props["data-footnotes"] ? (
        <FootnoteSection {...props} />
      ) : (
        <section {...props} />
      ),

    table: (props) => (
      <Table sx={{ marginBottom: 2 }} size="small" {...props} />
    ),
    thead: TableHead,
    tbody: TableBody,
    tfoot: TableFooter,
    tr: TableRow,
    th: TableCell,
    td: TableCell,
  };
}
