"use client";

import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  colorSchemes: { light: true, dark: true },
  cssVariables: {
    cssVarPrefix: "",
    colorSchemeSelector: "class",
  },
});

export default theme;
