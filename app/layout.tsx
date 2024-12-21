import {
  Box,
  BoxProps,
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

import "./global.scss";

const NavOffset = "6rem";

function Header() {
  return (
    <Box
      component="header"
      position="sticky"
      height="4rem"
      top={0}
      zIndex={9999}
      borderBottom="1px solid var(--palette-divider)"
      sx={{
        backgroundColor: "var(--palette-background-header)",
        backdropFilter: "saturate(180%) blur(5px)",
      }}
      marginBottom={`calc(${NavOffset} - 4rem)`}
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

function StickyBlock(props: BoxProps) {
  return (
    <Box
      width={300}
      height={`calc(100vh - ${NavOffset})`}
      top={NavOffset}
      position="sticky"
      {...props}
    />
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
              <Box display={{ xs: "unset", md: "flex" }} flexDirection="row">
                <StickyBlock display={{ xs: "none", md: "block" }}>
                  <ChapterTree />
                </StickyBlock>
                <Box flexGrow={1}>
                  <Container maxWidth="md">{children}</Container>
                </Box>
                <StickyBlock display={{ xs: "none", lg: "block" }}>
                  {/* This is a placeholder for an eventual page TOC. */}
                </StickyBlock>
              </Box>
            </Container>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
