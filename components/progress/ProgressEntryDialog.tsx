"use client";

import type { ReactNode } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Note 1: ProgressEntryDialog keeps the dialog shell reusable while leaving the
 * form submission buttons inside each form component. That avoids duplicating
 * dialog boilerplate without forcing every form into the same action layout.
 */
export function ProgressEntryDialog({ open, title, onClose, children }: Props) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>{children}</DialogContent>
    </Dialog>
  );
}
