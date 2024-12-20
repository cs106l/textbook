"use client";

import { createTheme } from "@mui/material/styles";
import { TypographyStyleOptions } from "@mui/material/styles/createTypography";
import NextLink, { LinkProps as NextLinkProps } from "next/link";

import { IBM_Plex_Mono, Roboto } from "next/font/google";
import React from "react";

export const font = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin-ext"],
});

export const monospace = IBM_Plex_Mono({
  weight: ["400"],
  subsets: ["latin-ext"],
});

function heading(fontSize: number): TypographyStyleOptions {
  return {
    fontSize: `${fontSize}rem`,
    fontWeight: "bold",
  };
}

declare module "@mui/material/styles" {
  interface TypeBackground {
    code: string;
  }
}

const LinkBehaviour = React.forwardRef(function LinkBehaviour(
  props: NextLinkProps,
  ref: React.Ref<HTMLAnchorElement>
) {
  return <NextLink ref={ref} {...props} />;
});

const theme = createTheme({
  colorSchemes: {
    light: {
      palette: {
        background: {
          code: "#f6f7f6",
        },
        divider: "#e0e0e0",
      },
    },
    dark: {
      palette: {
        background: {
          code: "#1d1f21",
        },
        divider: "#424242",
      },
    },
  },
  cssVariables: {
    cssVarPrefix: "",
    colorSchemeSelector: "class",
  },
  typography: {
    fontFamily: font.style.fontFamily,
    h1: heading(2),
    h2: heading(1.5),
    h3: heading(1.25),
    h4: heading(1),
    h5: heading(0.875),
    h6: heading(0.85),
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: (theme) => ({
        body: {
          backgroundColor: "var(--palette-common-background)",
          color: "var(--palette-common-onBackground)",
          overscrollBehavior: "none",
        },
        code: {
          fontFamily: monospace.style.fontFamily,
          fontSize: ".875em",
          backgroundColor: "var(--palette-background-code)",
          borderRadius: "var(--shape-borderRadius)",
          padding: "1px 3px 1px 3px",
          color: "var(--palette-grey-700)",
          outline: "1px solid var(--palette-grey-300)",
          ...theme.applyStyles("dark", {
            color: "var(--palette-grey-400)",
            outlineColor: "var(--palette-grey-800)",
          }),
        },
        blockquote: {
          borderLeft: "3px solid var(--palette-divider)",
          margin: 0,
          paddingLeft: "24px",
          color: "var(--palette-text-secondary)",
        },
      }),
    },

    MuiLink: {
      defaultProps: {
        component: LinkBehaviour,
      },
    },

    MuiTable: {
      styleOverrides: {
        root: {
          width: "unset",
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          border: 0,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { border: "1px solid var(--palette-divider)" },
      },
    },
  },
});

export default theme;
