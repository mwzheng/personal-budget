"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { parseISO } from "date-fns";
import { useEffect, useState } from "react";
import type { Transaction } from "@/lib/types/types";
import { TRANSACTION_CATEGORY_HEX_COLORS } from "@/lib/utils/categoryColors";
import { TRANSACTION_CATEGORY_OPTIONS } from "@/lib/utils/transaction-categories";
import {
  buildTransactionFormSubmission,
  transactionToFormValues,
  type TransactionFormValues,
} from "@/lib/utils/transaction-form";

const PAYMENT_METHOD_OPTIONS = ["Credit Card", "Cash", "Bank"] as const;

interface FormErrors {
  date?: string;
  name?: string;
  amount?: string;
  category?: string;
}

function getDefaultValues(initialDate?: string | null): TransactionFormValues {
  const parsedDate = initialDate ? parseISO(initialDate) : new Date();
  const date = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

  return {
    date,
    name: "",
    amount: "",
    category: "Need",
    paymentMethod: "Credit Card",
    tagsInput: "",
    tags: [],
    notes: "",
  };
}

function validate(values: TransactionFormValues): FormErrors {
  const errors: FormErrors = {};
  if (!values.date) errors.date = "Date is required";
  if (!values.name.trim()) errors.name = "Name is required";
  const amt = parseFloat(values.amount);
  if (!values.amount || isNaN(amt) || amt <= 0)
    errors.amount = "Enter a positive amount";
  if (!values.category) errors.category = "Category is required";
  return errors;
}

interface Props {
  open: boolean;
  transaction?: Transaction;
  duplicateTransaction?: Transaction;
  initialDate?: string | null;
  onSave: (transaction: Transaction) => void;
  onClose: () => void;
}

export function TransactionForm({
  open,
  transaction,
  duplicateTransaction,
  initialDate,
  onSave,
  onClose,
}: Props) {
  const [values, setValues] = useState<TransactionFormValues>(() =>
    getDefaultValues(initialDate),
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (open) {
      const prefillTransaction = transaction ?? duplicateTransaction;
      setValues(
        prefillTransaction
          ? transactionToFormValues(prefillTransaction)
          : getDefaultValues(initialDate),
      );
      setErrors({});
      setSubmitted(false);
    }
  }, [duplicateTransaction, initialDate, open, transaction]);

  useEffect(() => {
    if (submitted) setErrors(validate(values));
  }, [submitted, values]);

  function set<K extends keyof TransactionFormValues>(
    key: K,
    value: TransactionFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleAddTag() {
    const tag = values.tagsInput.trim();
    if (tag && !values.tags.includes(tag)) {
      set("tags", [...values.tags, tag]);
    }
    set("tagsInput", "");
  }

  function handleTagKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag();
    }
  }

  function handleDeleteTag(tag: string) {
    set(
      "tags",
      values.tags.filter((t) => t !== tag),
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    const errs = validate(values);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const saved = buildTransactionFormSubmission(values, {
      editTransaction: transaction,
    });
    onSave(saved);
  }

  const isEdit = Boolean(transaction);
  const isDuplicate = !isEdit && Boolean(duplicateTransaction);
  const title = isEdit
    ? "Edit Transaction"
    : isDuplicate
      ? "Duplicate Transaction"
      : "Add Transaction";
  const submitLabel = isEdit
    ? "Save Changes"
    : isDuplicate
      ? "Create Duplicate"
      : "Add Transaction";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle margin="auto">{title}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <DatePicker
              label="Date *"
              value={values.date}
              onChange={(d) => set("date", d)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: Boolean(errors.date),
                  helperText: errors.date,
                },
              }}
            />
            <TextField
              label="Name *"
              fullWidth
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              error={Boolean(errors.name)}
              helperText={errors.name}
            />
            <TextField
              label="Amount *"
              fullWidth
              type="number"
              inputProps={{ min: 0, step: "0.01" }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">$</InputAdornment>
                ),
              }}
              value={values.amount}
              onChange={(e) => set("amount", e.target.value)}
              error={Boolean(errors.amount)}
              helperText={errors.amount}
            />
            <Divider />
            <Stack direction="row" spacing={2}>
              <FormControl fullWidth error={Boolean(errors.category)}>
                <InputLabel>Category *</InputLabel>
                <Select
                  label="Category *"
                  value={values.category}
                  onChange={(e) => set("category", e.target.value)}
                >
                  {TRANSACTION_CATEGORY_OPTIONS.map((c) => (
                    <MenuItem key={c} value={c}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        gap={1}
                      >
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            backgroundColor: TRANSACTION_CATEGORY_HEX_COLORS[c],
                            flexShrink: 0,
                          }}
                        />
                        {c}
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
                {errors.category && (
                  <FormHelperText>{errors.category}</FormHelperText>
                )}
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  label="Payment Method"
                  value={values.paymentMethod}
                  onChange={(e) => set("paymentMethod", e.target.value)}
                >
                  {PAYMENT_METHOD_OPTIONS.map((m) => (
                    <MenuItem key={m} value={m}>
                      {m}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            <Divider />
            <Stack spacing={1}>
              <TextField
                label="Add Tag"
                fullWidth
                size="small"
                value={values.tagsInput}
                onChange={(e) => set("tagsInput", e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={handleAddTag}
                placeholder="Type and press Enter"
              />
              {values.tags.length > 0 && (
                <Stack direction="row" flexWrap="wrap" gap={0.5}>
                  {values.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      onDelete={() => handleDeleteTag(tag)}
                    />
                  ))}
                </Stack>
              )}
            </Stack>
            <Divider />
            <TextField
              label="Notes"
              fullWidth
              multiline
              rows={3}
              value={values.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="contained" type="submit">
            {submitLabel}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
