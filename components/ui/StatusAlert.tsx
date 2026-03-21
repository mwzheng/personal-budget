"use client";

/**
 * Note 1: Thin wrapper around MUI Alert that enforces consistent styling and
 * behavior for feedback messages across the app. All alerts are dismissible,
 * use uniform spacing, and include aria-live for screen reader announcements.
 * Replaces ad-hoc Alert and Box-based error displays throughout the codebase.
 */

import Alert, { type AlertColor } from "@mui/material/Alert";

export interface StatusAlertProps {
  /** The message to display */
  message: string;
  /** Alert severity/color (default: "error") */
  severity?: AlertColor;
  /** Called when the user dismisses the alert. If omitted, alert is not dismissible. */
  onClose?: () => void;
  /** Additional sx overrides */
  sx?: Record<string, unknown>;
}

export function StatusAlert({
  message,
  severity = "error",
  onClose,
  sx,
}: StatusAlertProps) {
  return (
    <Alert
      severity={severity}
      onClose={onClose}
      aria-live="polite"
      sx={{ mb: 2, ...sx }}
    >
      {message}
    </Alert>
  );
}
