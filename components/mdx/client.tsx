"use client";

/* ========================================================================= */
/* Client-side rendering                                                     */
/* ========================================================================= */

/* Ordinarily, next-mdx-remote does not allow us to render precompiled MDX on the client
 * when using the app router. This fixes that by reimplementing the MDXRemote component
 * as a client component.
 *
 * This is somewhat of a hack, and this might need to be changed if the source for
 * how mdx is compiled changes. See below for the equivalent MDXRemote component:
 *
 * https://github.com/hashicorp/next-mdx-remote/blob/main/src/index.tsx
 */

export type MDXClientProps = CompiledMDX & BoxProps & { noMargin?: boolean };

import * as runtime from "react/jsx-runtime";
import * as devRuntime from "react/jsx-dev-runtime";
import * as mdx from "@mdx-js/react";
import { CompiledMDX, components } from ".";
import React from "react";
import { Box, BoxProps } from "@mui/material";
import { mergeSx } from "merge-sx";

export function MDXClient(props: MDXClientProps) {
  const { scope, frontmatter, compiledSource, ...rest } = props;
  const Content: React.ElementType = React.useMemo(() => {
    // if we're ready to render, we can assemble the component tree and let React do its thing
    // first we set up the scope which has to include the mdx custom
    // create element function as well as any components we're using
    const fullScope = Object.assign(
      {
        opts: {
          ...mdx,
          ...(process.env.NODE_ENV === "development" ? devRuntime : runtime),
        },
      },
      { frontmatter },
      scope
    );
    const keys = Object.keys(fullScope);
    const values = Object.values(fullScope);

    // now we eval the source code using a function constructor
    // in order for this to work we need to have React, the mdx createElement,
    // and all our components in scope for the function, which is the case here
    // we pass the names (via keys) in as the function's args, and execute the
    // function with the actual values.
    const hydrateFn = Reflect.construct(
      Function,
      keys.concat(`${compiledSource}`)
    );

    return hydrateFn.apply(hydrateFn, values).default;
  }, [scope, frontmatter, compiledSource]);

  const { sx, noMargin, ...boxProps } = rest;
  return (
    <Box
      sx={mergeSx(noMargin && { "& > *:last-child": { marginBottom: 0 } }, sx)}
      {...boxProps}
    >
      <mdx.MDXProvider components={components}>{<Content />}</mdx.MDXProvider>
    </Box>
  );
}
