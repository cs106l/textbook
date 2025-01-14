import { Box, Button, Link, Stack, Typography } from "@mui/material";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404: This page could not be found",
  description: "Page not found",
};

export default function NotFound() {
  return (
    <Stack textAlign="center" spacing={2} mt={4} flexGrow={1}>
      <Typography
        variant="h1"
        fontSize="4.5rem"
        fontWeight="thin"
        display="inline"
        sx={{ lineHeight: 1 }}
      >
        404
      </Typography>
      <Typography color="textSecondary">Page not found :(</Typography>
      <Typography>
        Oops! The page you&apos;re looking for doesn&apos;t exist.
      </Typography>
      <Box>
        <Button
          component={Link}
          href="/"
          variant="outlined"
          sx={{ color: "unset" }}
        >
          Back to homepage
        </Button>
      </Box>
    </Stack>
  );
}
