"use client";

import { useColorScheme } from "@mui/material/styles";
import { DARK_THEME_TOKENS, LIGHT_THEME_TOKENS } from "./server-theme-tokens";

/** Concrete colors are required by chart color calculations and PNG output. */
export function useChartTheme() {
  const { mode, systemMode } = useColorScheme();
  return (mode === "system" ? systemMode : mode) === "dark"
    ? DARK_THEME_TOKENS
    : LIGHT_THEME_TOKENS;
}
