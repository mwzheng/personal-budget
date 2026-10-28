"use client";

/**
 * Note 1: This wrapper keeps small icon actions visually consistent across
 * lists and tables while making the tooltip text and aria-label easy to keep in
 * sync when text buttons are replaced by icons.
 */
import type { ReactNode } from "react";
import IconButton, { type IconButtonProps } from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { type SxProps, type Theme } from "@mui/material/styles";
import { SERVER_THEME_TOKENS } from "@/lib/theme/server-theme-tokens";

type ActionIconButtonTone = "default" | "danger";

const BASE_ACTION_ICON_BUTTON_SX: SxProps<Theme> = {
  width: 32,
  height: 32,
  borderRadius: "4px",
  border: "1px solid",
  backgroundColor: "background.paper",
};

const DEFAULT_ACTION_ICON_BUTTON_SX: SxProps<Theme> = (theme) => ({
  borderColor: "var(--mui-palette-divider)",
  color: "var(--mui-palette-text-secondary)",
  transition: theme.transitions.create([
    "background-color",
    "border-color",
    "color",
  ]),
  "&:hover": {
    borderColor: "var(--mui-palette-action-active)",
    backgroundColor: "var(--mui-palette-action-hover)",
    color: "var(--mui-palette-text-primary)",
  },
  "&.Mui-focusVisible": {
    boxShadow: "0 0 0 2px rgba(var(--mui-palette-error-mainChannel) / 0.18)",
  },
  "&.Mui-disabled": {
    borderColor: "var(--mui-palette-action-disabledBackground)",
    color: "var(--mui-palette-action-disabled)",
    backgroundColor: "var(--mui-palette-action-hover)",
  },
});

const DANGER_ACTION_ICON_BUTTON_SX: SxProps<Theme> = (theme) => ({
  borderColor: "rgba(var(--mui-palette-error-mainChannel) / 0.32)",
  color: "var(--mui-palette-error-main)",
  transition: theme.transitions.create([
    "background-color",
    "border-color",
    "color",
  ]),
  "&:hover": {
    borderColor: "var(--mui-palette-error-main)",
    backgroundColor: "rgba(var(--mui-palette-error-mainChannel) / 0.08)",
    color: "var(--mui-palette-error-main)",
  },
  "&.Mui-focusVisible": {
    boxShadow: SERVER_THEME_TOKENS.focus.ring,
  },
  "&.Mui-disabled": {
    borderColor: "var(--mui-palette-action-disabledBackground)",
    color: "var(--mui-palette-action-disabled)",
    backgroundColor: "var(--mui-palette-action-hover)",
  },
});

interface ActionIconButtonProps extends Omit<
  IconButtonProps,
  "aria-label" | "children" | "color" | "size"
> {
  tooltip: string;
  ariaLabel?: string;
  tone?: ActionIconButtonTone;
  children: ReactNode;
}

export function ActionIconButton({
  tooltip,
  ariaLabel,
  tone = "default",
  sx,
  children,
  ...iconButtonProps
}: ActionIconButtonProps) {
  const sxList = Array.isArray(sx) ? sx : sx ? [sx] : [];

  return (
    <Tooltip title={tooltip}>
      <span style={{ display: "inline-flex" }}>
        <IconButton
          {...iconButtonProps}
          size="small"
          aria-label={ariaLabel ?? tooltip}
          sx={[
            BASE_ACTION_ICON_BUTTON_SX,
            tone === "danger"
              ? DANGER_ACTION_ICON_BUTTON_SX
              : DEFAULT_ACTION_ICON_BUTTON_SX,
            ...sxList,
          ]}
        >
          {children}
        </IconButton>
      </span>
    </Tooltip>
  );
}
