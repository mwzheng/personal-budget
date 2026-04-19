"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { StatusAlert } from "@/components/ui/StatusAlert";
import { useEffect, useState, type ReactNode } from "react";

import type { Transaction } from "@/lib/types/types";
import {
  formatTransactionAmount,
  formatTransactionLongDate,
} from "@/lib/utils/transaction-calendar";
import { TRANSACTION_CATEGORY_CHIP_COLORS } from "@/lib/utils/categoryColors";

interface DetailRowProps {
  label: string;
  children: ReactNode;
}

interface Props {
  open: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => Promise<boolean> | boolean;
}

function DetailRow({ label, children }: DetailRowProps) {
  return (
    <Stack spacing={0.75}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Box>{children}</Box>
    </Stack>
  );
}

/**
 * Note 1: The dialog shows a stable read-only snapshot of a transaction so
 * users can verify the exact record they clicked before branching into edit or
 * delete actions. Keeping confirmation in the same dialog preserves that context.
 */
export function TransactionDetailDialog({
  open,
  transaction,
  onClose,
  onEdit,
  onDelete,
}: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletePending, setDeletePending] = useState(false);

  useEffect(() => {
    if (!open) return;

    setConfirmDelete(false);
    setDeletePending(false);
  }, [open, transaction]);

  async function handleDelete() {
    if (!transaction) return;

    setDeletePending(true);

    try {
      const deleted = await onDelete(transaction.id);

      if (deleted) {
        setConfirmDelete(false);
        onClose();
      }
    } finally {
      setDeletePending(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {transaction
          ? `Transaction Details: ${transaction.name}`
          : "Transaction Details"}
      </DialogTitle>
      <DialogContent dividers>
        {transaction ? (
          <Stack spacing={2.5}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              alignItems={{ xs: "flex-start", sm: "center" }}
              flexWrap="wrap"
            >
              <Chip
                label={transaction.category}
                size="small"
                color={TRANSACTION_CATEGORY_CHIP_COLORS[transaction.category]}
              />
              <Typography variant="h5" fontWeight={700}>
                {formatTransactionAmount(transaction.amount)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatTransactionLongDate(transaction.date)}
              </Typography>
            </Stack>

            <Divider />

            <Stack spacing={2}>
              <DetailRow label="Transaction name">
                <Typography>{transaction.name}</Typography>
              </DetailRow>

              <DetailRow label="Payment method">
                <Typography
                  color={
                    transaction.paymentMethod
                      ? "text.primary"
                      : "text.secondary"
                  }
                >
                  {transaction.paymentMethod || "Not recorded"}
                </Typography>
              </DetailRow>

              <DetailRow label="Tags">
                {transaction.tags.length > 0 ? (
                  <Box display="flex" flexWrap="wrap" gap={0.75}>
                    {transaction.tags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography color="text.secondary">No tags added</Typography>
                )}
              </DetailRow>

              <DetailRow label="Notes">
                <Typography
                  color={transaction.notes ? "text.primary" : "text.secondary"}
                  sx={{ whiteSpace: "pre-wrap" }}
                >
                  {transaction.notes || "No notes added"}
                </Typography>
              </DetailRow>
            </Stack>

            {confirmDelete && (
              <StatusAlert
                message="Delete this transaction permanently? This action cannot be undone."
                severity="warning"
              />
            )}
          </Stack>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, flexWrap: "wrap", gap: 1 }}>
        <Button onClick={onClose} aria-label="Close transaction details dialog">
          Close
        </Button>

        {confirmDelete ? (
          <>
            <Button
              onClick={() => setConfirmDelete(false)}
              disabled={deletePending}
              aria-label="Cancel deleting this transaction"
            >
              Cancel delete
            </Button>
            <Button
              color="error"
              variant="contained"
              onClick={handleDelete}
              disabled={deletePending}
              aria-label={`Confirm deleting transaction ${transaction?.name ?? ""}`}
            >
              {deletePending ? "Deleting..." : "Confirm delete"}
            </Button>
          </>
        ) : (
          <>
            <Button
              color="error"
              onClick={() => setConfirmDelete(true)}
              disabled={!transaction}
              aria-label={`Delete transaction ${transaction?.name ?? ""}`}
            >
              Delete transaction
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                if (transaction) {
                  onEdit(transaction);
                }
              }}
              disabled={!transaction}
              aria-label={`Edit transaction ${transaction?.name ?? ""}`}
            >
              Edit transaction
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
