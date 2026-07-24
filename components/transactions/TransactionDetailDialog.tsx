"use client";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid2";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { useEffect, useState, type ReactNode } from "react";

import { ActionIconButton } from "@/components/ui/ActionIconButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Transaction } from "@/lib/types/types";
import {
  formatTransactionAmount,
  formatTransactionLongDate,
} from "@/lib/utils/transaction-calendar";
import {
  TRANSACTION_CATEGORY_CHIP_COLORS,
  TRANSACTION_CATEGORY_HEX_COLORS,
} from "@/lib/utils/categoryColors";

const EMPTY_VALUE_SX = {
  color: "text.secondary",
  fontStyle: "italic",
} as const;

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
    <Box>
      <Typography variant="caption" color="text.secondary" fontWeight={500}>
        {label}
      </Typography>
      <Box mt={0.5}>{children}</Box>
    </Box>
  );
}

export function TransactionDetailDialog({
  open,
  transaction,
  onClose,
  onEdit,
  onDelete,
}: Props) {
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletePending, setDeletePending] = useState(false);

  useEffect(() => {
    if (!open) setConfirmDeleteOpen(false);
  }, [open]);

  async function handleConfirmDelete() {
    if (!transaction) return;

    setDeletePending(true);
    try {
      const deleted = await onDelete(transaction.id);
      if (deleted) {
        setConfirmDeleteOpen(false);
        onClose();
      }
    } finally {
      setDeletePending(false);
    }
  }

  const categoryColor = transaction
    ? TRANSACTION_CATEGORY_HEX_COLORS[transaction.category]
    : undefined;

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle
          display="flex"
          alignItems="center"
          justifyContent="space-between"
        >
          <IconButton
            onClick={onClose}
            size="small"
            aria-label="Close transaction details"
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
          {transaction && (
            <Chip
              label={transaction.category}
              size="small"
              color={TRANSACTION_CATEGORY_CHIP_COLORS[transaction.category]}
            />
          )}
        </DialogTitle>
        <DialogContent>
          {transaction && (
            <Box>
              <Typography variant="h5" fontWeight={600} lineHeight={1.3}>
                {transaction.name}
              </Typography>
              <Typography
                variant="h2"
                fontWeight={700}
                sx={{ color: categoryColor, lineHeight: 1.1, mt: 1 }}
              >
                {formatTransactionAmount(transaction.amount)}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                mt={0.5}
                fontWeight={500}
              >
                {formatTransactionLongDate(transaction.date)}
              </Typography>
              <Divider sx={{ my: 3 }} />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DetailRow label="Payment method">
                    <Typography
                      color={
                        transaction.paymentMethod
                          ? "text.primary"
                          : "text.secondary"
                      }
                      sx={
                        transaction.paymentMethod ? undefined : EMPTY_VALUE_SX
                      }
                    >
                      {transaction.paymentMethod || "Not recorded"}
                    </Typography>
                  </DetailRow>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
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
                      <Typography sx={EMPTY_VALUE_SX}>No tags added</Typography>
                    )}
                  </DetailRow>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <DetailRow label="Notes">
                    <Typography
                      color={
                        transaction.notes ? "text.primary" : "text.secondary"
                      }
                      sx={{
                        whiteSpace: "pre-wrap",
                        ...(transaction.notes ? undefined : EMPTY_VALUE_SX),
                      }}
                    >
                      {transaction.notes || "No notes added"}
                    </Typography>
                  </DetailRow>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <ActionIconButton
            tooltip="Delete transaction"
            tone="danger"
            disabled={!transaction}
            onClick={() => setConfirmDeleteOpen(true)}
          >
            <DeleteOutlineRoundedIcon fontSize="small" />
          </ActionIconButton>
          <ActionIconButton
            tooltip="Edit transaction"
            disabled={!transaction}
            onClick={() => {
              if (transaction) onEdit(transaction);
            }}
          >
            <EditOutlinedIcon fontSize="small" />
          </ActionIconButton>
        </DialogActions>
      </Dialog>
      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete transaction"
        message="Delete this transaction permanently? This action cannot be undone."
        confirmLabel="Delete"
        destructive
        loading={deletePending}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
