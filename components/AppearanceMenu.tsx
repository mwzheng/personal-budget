"use client";

import { useColorScheme } from "@mui/material/styles";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import {
  resolveEffectiveAppearanceMode,
  toggleAppearanceMode,
} from "@/lib/theme/appearance-storage";

export function AppearanceMenu({ mobile = false }: { mobile?: boolean }) {
  const { mode, systemMode, setMode } = useColorScheme();
  const effectiveMode = resolveEffectiveAppearanceMode(mode, systemMode);
  const nextMode = toggleAppearanceMode(mode, systemMode);
  const label = `Switch to ${nextMode} mode`;

  return (
    <Tooltip title={label} placement={mobile ? "right" : "bottom"}>
      <IconButton
        color="inherit"
        aria-label={label}
        onClick={() => setMode(nextMode)}
        sx={{
          color: "text.secondary",
          minHeight: 44,
          minWidth: 44,
          ...(mobile ? { my: 1 } : {}),
        }}
      >
        {effectiveMode === "light" ? (
          <LightModeRoundedIcon />
        ) : (
          <DarkModeRoundedIcon />
        )}
      </IconButton>
    </Tooltip>
  );
}
