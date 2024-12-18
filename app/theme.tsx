"use client";

import { createTheme } from "@mui/material/styles";
import { TypographyStyleOptions } from "@mui/material/styles/createTypography";

import { IBM_Plex_Mono, Inter } from "next/font/google";

export const font = Inter({
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

const theme = createTheme({
  colorSchemes: {
    light: {
      palette: {
        background: {
          code: "#f6f7f6",
        },
      },
    },
    dark: {
      palette: {
        background: {
          code: "#1d1f21",
        },
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
      }),
    },
  },
});

export default theme;
