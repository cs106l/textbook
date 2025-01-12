import {
  Box,
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
import {
  MDXRemote as MDXRemoteServer,
  MDXRemoteProps as MDXRemoteServerProps,
} from "next-mdx-remote/rsc";
import { serialize as mdxRemoteSerialize } from "next-mdx-remote/serialize";
import { MDXRemote as MDXRemoteClient } from "next-mdx-remote";
import FootnoteSection from "./footnotes";

import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import remarkQuiz from "./quiz/remark";
import Pre from "./pre";

/* ========================================================================= */
/* Styling and MDX Compilation                                               */
/* ========================================================================= */

export type MDXComponents = React.ComponentProps<
  typeof MDXProvider
>["components"];

export type SerializeOptions = NonNullable<MDXRemoteServerProps["options"]>;

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
    ...props,
    sx: {
      ...props?.sx,
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
        display: {
          xs: "none",
          sm: "unset",
        },
      },
      "&:hover a:before": {
        opacity: 1,
      },
    },
  });
}

function ruleHeading(props?: TypographyProps) {
  return heading({
    ...props,
    sx: {
      ...props?.sx,
      paddingBottom: "0.5rem",
      borderBottom: "1px solid var(--palette-divider)",
    },
  });
}

const components: Readonly<MDXComponents> = {
  h1: ruleHeading({ variant: "h1" }),
  h2: ruleHeading({ variant: "h2" }),
  h3: heading({ variant: "h3" }),
  h4: heading({ variant: "h4" }),
  h5: heading({ variant: "h5" }),
  h6: heading({ variant: "h6" }),
  p: typography({ variant: "body1", marginBottom: "1rem" }),
  pre: Pre,
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

type RenderOptions = {
  path?: string;
};

export function getMDXOptions(options: RenderOptions): SerializeOptions {
  return {
    mdxOptions: {
      remarkPlugins: [remarkGfm, remarkMath, [remarkQuiz, options.path]],
      rehypePlugins: [
        rehypeKatex,
        rehypeSlug,
        [rehypeAutolinkHeadings, { behavior: "wrap" }],
      ],
    },
    parseFrontmatter: true,
  };
}

/* ========================================================================= */
/* Server-side rendering                                                     */
/* ========================================================================= */

export type MDXServerProps = Pick<MDXRemoteServerProps, "source"> &
  RenderOptions;

export function MDXServer(props: MDXServerProps) {
  return (
    <MDXRemoteServer
      source={props.source}
      components={components}
      options={getMDXOptions(props)}
    />
  );
}

/* ========================================================================= */
/* Client-side rendering                                                     */
/* ========================================================================= */

export type MDXClientProps = Awaited<ReturnType<typeof mdxRemoteSerialize>> & {
  noMargin?: boolean;
};

export function MDXClient(props: MDXClientProps) {
  return (
    <Box
      sx={{
        ...(props.noMargin && {
          "& > *:last-child": { marginBottom: 0 },
        }),
      }}
    >
      <MDXRemoteClient components={components} {...props} />
    </Box>
  );
}

export function serializeMDX(source: string, options?: RenderOptions) {
  return mdxRemoteSerialize(source, getMDXOptions(options ?? {}));
}
