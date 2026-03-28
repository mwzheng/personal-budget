"use client";

/**
 * Note 1: This wrapper keeps small icon actions visually consistent across
 * lists and tables while making the tooltip text and aria-label easy to keep in
 * sync when text buttons are replaced by icons.
 */
import type { ReactNode } from "react";
import IconButton, { type IconButtonProps } from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { alpha, type SxProps, type Theme } from "@mui/material/styles";

type ActionIconButtonTone = "default" | "danger";

const BASE_ACTION_ICON_BUTTON_SX: SxProps<Theme> = {
  width: 32,
  height: 32,
  borderRadius: 1.25,
  border: "1px solid",
  backgroundColor: "background.paper",
};

const DEFAULT_ACTION_ICON_BUTTON_SX: SxProps<Theme> = (theme) => ({
  borderColor: theme.palette.divider,
  color: theme.palette.text.secondary,
  transition: theme.transitions.create([
    "background-color",
    "border-color",
    "color",
  ]),
  "&:hover": {
    borderColor: theme.palette.action.active,
    backgroundColor: theme.palette.action.hover,
    color: theme.palette.text.primary,
  },
  "&.Mui-focusVisible": {
    boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.18)}`,
  },
  "&.Mui-disabled": {
    borderColor: theme.palette.action.disabledBackground,
    color: theme.palette.action.disabled,
    backgroundColor: theme.palette.action.hover,
  },
});

const DANGER_ACTION_ICON_BUTTON_SX: SxProps<Theme> = (theme) => ({
  borderColor: alpha(theme.palette.error.main, 0.32),
  color: theme.palette.error.main,
  transition: theme.transitions.create([
    "background-color",
    "border-color",
    "color",
  ]),
  "&:hover": {
    borderColor: theme.palette.error.main,
    backgroundColor: alpha(theme.palette.error.main, 0.08),
    color: theme.palette.error.dark,
  },
  "&.Mui-focusVisible": {
    boxShadow: `0 0 0 2px ${alpha(theme.palette.error.main, 0.18)}`,
  },
  "&.Mui-disabled": {
    borderColor: theme.palette.action.disabledBackground,
    color: theme.palette.action.disabled,
    backgroundColor: theme.palette.action.hover,
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
