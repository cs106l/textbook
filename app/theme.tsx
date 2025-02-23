"use client";

import { alpha, createTheme } from "@mui/material/styles";
import { TypographyStyleOptions } from "@mui/material/styles/createTypography";
import NextLink, { LinkProps as NextLinkProps } from "next/link";

import { Fira_Code, Space_Grotesk } from "next/font/google";
import React from "react";
import { grey } from "@mui/material/colors";

export const font = Space_Grotesk({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin-ext"],
});

export const monospace = Fira_Code({
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
    header: string;
    memory: string;
  }

  interface PaletteOptions {
    memory: string;
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
          header: alpha("#ffffff", 0.8),
          memory: "#f6f7f680",
        },
        divider: "#e0e0e0",
        memory: grey[400],
      },
    },
    dark: {
      palette: {
        background: {
          code: "#1d1f21",
          header: alpha("#000000", 0.8),
          memory: "#1d1f2180",
        },
        divider: "#424242",
        memory: grey[800],
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
    allVariants: {
      letterSpacing: "0.025em",
      lineHeight: "1.75",
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: (theme) => ({
        html: {
          overflowY: "scroll",
        },
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
          whiteSpace: "pre-wrap",
        },
        "a > code": {
          color: "unset"
        },
        blockquote: {
          borderLeft: "3px solid var(--palette-divider)",
          margin: 0,
          paddingLeft: "24px",
          color: "var(--palette-text-secondary)",
          "& > *:last-child": { marginBottom: 0 },
          marginBottom: theme.spacing(2),
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
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          paddingLeft: "6px",
          paddingRight: "6px",
          paddingBottom: 0,
          paddingTop: 0,
          minWidth: "unset",
          transition: "none",
          fontWeight: "normal",

          borderColor: "var(--palette-grey-400)",
          "*:where(.dark) &": {
            borderColor: "var(--palette-grey-600)",
          },
        },
      },
      variants: [
        {
          props: { variant: "outlined" },
          style: {
            backgroundColor: "var(--palette-background-code)",
          },
        },
      ],
    },
    MuiRadio: {
      defaultProps: {
        disableRipple: true,
        disableTouchRipple: true,
        size: "small",
      },
    },
    MuiCheckbox: {
      defaultProps: {
        disableRipple: true,
        disableTouchRipple: true,
        size: "small",
      },
    },
  },
});

export default theme;
