import { Typography, TypographyProps } from "@mui/material";
import type { MDXComponents } from "mdx/types";
import React from "react";

function typography(props?: TypographyProps) {
  return ({ children }: { children: React.ReactNode }) => (
    <Typography {...props}>{children}</Typography>
  );
}

function heading(props?: TypographyProps) {
  return typography({ marginBottom: "1rem", paddingTop: "1rem", ...props });
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
  };
}
