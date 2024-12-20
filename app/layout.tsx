import {
  Box,
  Container,
  CssBaseline,
  Stack,
  ThemeProvider,
  Typography,
} from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import theme from "./theme";
import ChapterTree from "@/components/chapters";

import CppIcon from "./icon.svg";
import Image from "next/image";
import Lightswitch from "@/components/lightswitch";

const NavHeight = "4rem";

function Header() {
  return (
    <Box
      component="header"
      position="sticky"
      height={NavHeight}
      top={0}
      zIndex={9999}
      borderBottom="1px solid var(--palette-divider)"
      sx={{
        backgroundColor: "var(--palette-common-background)",
      }}
    >
      <Container
        maxWidth="xl"
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          height: 1,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Image src={CppIcon} alt="" height={32} width={32} />
          <Typography fontSize="1.125rem" fontWeight="600">
            Learn C++
          </Typography>
        </Stack>
        <Lightswitch />
      </Container>
    </Box>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <head />
      <body>
        <InitColorSchemeScript attribute="class" />
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline enableColorScheme />
            <Header />
            <Container maxWidth="xl">
              <Box display="flex" flexDirection="row">
                <Box
                  width={300}
                  height={`calc(100vh - ${NavHeight})`}
                  display={{ xs: "none", md: "block" }}
                  top={NavHeight}
                  position="sticky"
                  padding={2}
                >
                  <ChapterTree />
                </Box>
                <Box flexGrow={1} paddingY={2}>
                  <Container maxWidth="md">{children}</Container>
                </Box>
              </Box>
            </Container>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
