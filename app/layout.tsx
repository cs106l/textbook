import { CssBaseline, ThemeProvider } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import theme from "./theme";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <head />
      <body style={{ backgroundColor: "var(--palette-common-background)" }}>
        <InitColorSchemeScript attribute="class" />
        <AppRouterCacheProvider>
          <CssBaseline />
          <ThemeProvider theme={theme}>{children}</ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
