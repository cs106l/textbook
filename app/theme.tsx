"use client";

import { createTheme } from "@mui/material/styles";
import { TypographyStyleOptions } from "@mui/material/styles/createTypography";

function heading(fontSize: number): TypographyStyleOptions {
  return {
    fontSize: `${fontSize}rem`,
    fontWeight: "bold",
  };
}

const theme = createTheme({
  colorSchemes: { light: true, dark: true },
  cssVariables: {
    cssVarPrefix: "",
    colorSchemeSelector: "class",
  },
  typography: {
    h1: heading(2),
    h2: heading(1.5),
    h3: heading(1.25),
    h4: heading(1),
    h5: heading(0.875),
    h6: heading(0.85),
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "var(--palette-common-background)",
          color: "var(--palette-common-onBackground)",
        },
      },
    },
  },
});

export default theme;
