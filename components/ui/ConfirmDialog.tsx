"use client";

/**
 * Note 1: Reusable confirmation dialog for destructive or important actions.
 * Replaces one-off delete confirmation dialogs scattered across components
 * (TransactionsTable, BudgetList, TransactionDetailDialog) with a consistent
 * pattern: title, descriptive message, cancel/confirm buttons.
 */

import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

export interface ConfirmDialogProps {
  /** Controls visibility */
  open: boolean;
  /** Dialog title (e.g., "Delete Transaction?") */
  title: string;
  /** Descriptive message explaining the action */
  message: string;
  /** Label for the confirm button (default: "Confirm") */
  confirmLabel?: string;
  /** Label for the cancel button (default: "Cancel") */
  cancelLabel?: string;
  /** Whether this is a destructive action — makes confirm button red (default: true) */
  destructive?: boolean;
  /** Whether the confirm action is in progress */
  loading?: boolean;
  /** Called when the user cancels or clicks outside */
  onClose: () => void;
  /** Called when the user confirms */
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = true,
  loading = false,
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <DialogTitle id="confirm-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="confirm-dialog-description">
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          color={destructive ? "error" : "primary"}
          variant="contained"
          disabled={loading}
          autoFocus
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
