// Note 1: TransactionForm uses the "controlled form" pattern -- every input
// value is stored in React state (`values`) and updated via a `set()` helper.
// This gives the component full control over validation and allows it to reset
// cleanly when the dialog is closed and re-opened.
"use client";

import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format, parseISO } from "date-fns";
import { useEffect, useState } from "react";
import type { Transaction } from "@/lib/types/types";
import { generateId } from "@/lib/utils/generateId";

const CATEGORY_OPTIONS = ["Need", "Want", "Saving"] as const;
// Note 2b: Payment method is now a fixed set of options so users pick from a
// dropdown rather than free-typing. "Credit Card" is listed first as the default.
const PAYMENT_METHOD_OPTIONS = ["Credit Card", "Cash", "Bank"] as const;

// Note 2: `FormValues` separates the form's internal representation from the
// `Transaction` type. For example, `amount` is a `string` in the form (so the
// user can type freely) but a `number` in the Transaction model. `tagsInput` is
// an ephemeral buffer that does not exist in Transaction at all.
interface FormValues {
  date: Date | null;
  name: string;
  amount: string;
  category: string;
  paymentMethod: string;
  tagsInput: string;
  tags: string[];
  notes: string;
}

interface FormErrors {
  date?: string;
  name?: string;
  amount?: string;
  category?: string;
}

// Note 3b: `getDefaultValues` is a factory function (not a plain constant) so
// that `date` always reflects the *current* day when the modal opens, rather
// than being frozen to the module-load timestamp. Category defaults to "Need"
// and payment method defaults to "Credit Card" per UX requirements.
function getDefaultValues(initialDate?: string | null): FormValues {
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

// Note 3: `transactionToFormValues` is an adapter function that converts a
// `Transaction` (server/storage shape) into the local `FormValues` shape.
// `parseISO` turns the "YYYY-MM-DD" date string into a JS Date object that
// MUI DatePicker needs.
function transactionToFormValues(t: Transaction): FormValues {
  return {
    date: parseISO(t.date),
    name: t.name,
    amount: String(t.amount),
    category: t.category,
    paymentMethod: t.paymentMethod ?? "",
    tagsInput: "",
    tags: [...t.tags],
    notes: t.notes ?? "",
  };
}

function validate(values: FormValues): FormErrors {
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
  /** If provided, the dialog is in edit mode; otherwise it's in add mode. */
  transaction?: Transaction;
  initialDate?: string | null;
  onSave: (transaction: Transaction) => void;
  onClose: () => void;
}

export function TransactionForm({
  open,
  transaction,
  initialDate,
  onSave,
  onClose,
}: Props) {
  const [values, setValues] = useState<FormValues>(() =>
    getDefaultValues(initialDate),
  );
  const [errors, setErrors] = useState<FormErrors>({});
  // Note 4: `submitted` tracks whether the user has attempted to submit once.
  // Before the first submit, errors are not shown (avoids overwhelming the user
  // with errors on an empty form). After the first submit, errors update live
  // as the user types via the `set()` helper.
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(
        transaction
          ? transactionToFormValues(transaction)
          : getDefaultValues(initialDate),
      );
      setErrors({});
      setSubmitted(false);
    }
  }, [initialDate, open, transaction]);

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => {
      const next = { ...prev, [key]: value };
      if (submitted) setErrors(validate(next));
      return next;
    });
  }

  function handleAddTag() {
    const tag = values.tagsInput.trim();
    // Note 5: `!values.tags.includes(tag)` prevents duplicate tags. The tag
    // input is cleared regardless so the user gets immediate feedback that the
    // tag was processed.
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

  function handleSubmit() {
    setSubmitted(true);
    const errs = validate(values);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const saved: Transaction = {
      // Note 6: `generateId()` produces a UUIDv4 for new transactions.
      // For edits, the original `id` is preserved so the record can be found
      // in localStorage or DynamoDB for update/delete operations.
      id: transaction?.id ?? generateId(),
      name: values.name.trim(),
      amount: parseFloat(values.amount),
      category: values.category as Transaction["category"],
      date: format(values.date!, "yyyy-MM-dd"),
      notes: values.notes.trim(),
      paymentMethod: values.paymentMethod,
      tags: values.tags,
    };
    onSave(saved);
  }

  const isEdit = Boolean(transaction);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEdit ? "Edit Transaction" : "Add Transaction"}
      </DialogTitle>
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

          <FormControl fullWidth error={Boolean(errors.category)}>
            <InputLabel>Category *</InputLabel>
            <Select
              label="Category *"
              value={values.category}
              onChange={(e) => set("category", e.target.value)}
            >
              {CATEGORY_OPTIONS.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
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

          <div>
            <TextField
              label="Add Tag"
              fullWidth
              value={values.tagsInput}
              onChange={(e) => set("tagsInput", e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={handleAddTag}
              helperText="Press Enter or comma to add a tag"
              placeholder="e.g. Gas, Food"
            />
            {values.tags.length > 0 && (
              <Stack direction="row" flexWrap="wrap" gap={0.5} mt={1}>
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
          </div>

          <TextField
            label="Notes"
            fullWidth
            multiline
            rows={2}
            value={values.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>
          {isEdit ? "Save Changes" : "Add Transaction"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
