"use client";

import { IconButton, SvgIcon, useColorScheme } from "@mui/material";

import LightIcon from "@heroicons/react/24/solid/MoonIcon";
import DarkIcon from "@heroicons/react/24/solid/SunIcon";

export default function Lightswitch() {
  const { mode, setMode } = useColorScheme();

  return (
    <IconButton onClick={() => setMode(mode === "dark" ? "light" : "dark")}>
      <SvgIcon
        sx={{ color: "var(--palette-common-onBackground)" }}
        fontSize="small"
      >
        {mode === "dark" ? <DarkIcon /> : <LightIcon />}
      </SvgIcon>
    </IconButton>
  );
}
