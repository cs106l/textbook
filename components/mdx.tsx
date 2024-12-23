import {
  Divider,
  Link,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableRow,
  Typography,
  TypographyProps,
} from "@mui/material";
import React from "react";

import { MDXProvider } from "@mdx-js/react";
import { MDXRemote, MDXRemoteProps } from "next-mdx-remote/rsc";
import FootnoteSection from "./footnotes";

import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import CodeBlock from "./code";

export type MDXComponents = React.ComponentProps<
  typeof MDXProvider
>["components"];

export type SerializeOptions = NonNullable<MDXRemoteProps["options"]>;

export type MDXProps = Pick<MDXRemoteProps, "source">;

export default function MDX({ source }: MDXProps) {
  return (
    <MDXRemote source={source} components={components} options={options} />
  );
}

function typography(props?: TypographyProps) {
  return function CustomTypography({
    children,
    ...rest
  }: {
    children: React.ReactNode;
  }) {
    return (
      <Typography {...rest} {...props}>
        {children}
      </Typography>
    );
  };
}

function heading(props?: TypographyProps) {
  const icon = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/icons/link.svg`;
  return typography({
    marginBottom: "1rem",
    paddingTop: "1rem",
    sx: {
      position: "relative",
      scrollMarginTop: "4rem",
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

export const components: Readonly<MDXComponents> = {
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

  table: (props) => <Table sx={{ mb: 2 }} size="small" {...props} />,
  thead: TableHead,
  tbody: TableBody,
  tfoot: TableFooter,
  tr: TableRow,
  th: TableCell,
  td: TableCell,

  a: ({ children, ...rest }) => {
    const fn = rest["data-footnote-ref"];
    return (
      <Link {...rest}>
        {fn && "["}
        {children}
        {fn && "]"}
      </Link>
    );
  },
};

export const options: Readonly<SerializeOptions> = {
  mdxOptions: {
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [
      rehypeKatex,
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: "wrap" }],
    ],
  },
  parseFrontmatter: true,
};
