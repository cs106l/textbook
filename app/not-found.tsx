import { Box, Button, Link, Stack, Typography } from "@mui/material";

export default function NotFound() {
  return (
    <Stack textAlign="center" spacing={2} mt={4}>
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
      <Typography>Oops! The page you're looking for doesn't exist.</Typography>
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
