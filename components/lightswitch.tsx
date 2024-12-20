"use client";

import { IconButton, SvgIcon, useColorScheme, useTheme } from "@mui/material";

import LightIcon from "@heroicons/react/24/solid/MoonIcon";
import DarkIcon from "@heroicons/react/24/solid/SunIcon";

export default function Lightswitch() {
  const { mode, setMode } = useColorScheme();
  const theme = useTheme();

  return (
    <IconButton onClick={() => setMode(mode === "dark" ? "light" : "dark")}>
      <SvgIcon
        sx={{
          color: "var(--palette-common-onBackground)",
          ...theme.applyStyles("light", {
            "& .dark": { display: "none" },
          }),
          ...theme.applyStyles("dark", {
            "& .light": { display: "none" },
          }),
        }}
        fontSize="small"
      >
        <DarkIcon className="dark" />
        <LightIcon className="light" />
      </SvgIcon>
    </IconButton>
  );
}
