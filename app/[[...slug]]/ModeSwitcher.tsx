"use client";

import { Box, MenuItem, Select, useColorScheme } from "@mui/material";

export default function ModeSwitcher() {
  const { mode, setMode } = useColorScheme();
  if (!mode) {
    return null;
  }
  return (
    <Box textAlign="center">
      <Select
        value={mode}
        onChange={(event) =>
          setMode(event.target.value as "system" | "light" | "dark")
        }
        sx={{ minWidth: 120 }}
      >
        <MenuItem value="system">System</MenuItem>
        <MenuItem value="light">Light</MenuItem>
        <MenuItem value="dark">Dark</MenuItem>
      </Select>
    </Box>
  );
}
