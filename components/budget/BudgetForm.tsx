/**
 * Note 1: BudgetForm is a controlled editor for the expense-driven planner.
 * The parent page owns the draft state so the pie chart and Sankey diagram can
 * update instantly as the user edits rows instead of waiting for a separate
 * "generate" submit step.
 */
"use client";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import {
  CATEGORY_LABELS,
  BudgetDraft,
  createBudgetExpense,
  hasBudgetRowContent,
} from "@/lib/budget-planner";
import { BudgetExpense, CategoryType } from "@/lib/types";

interface Props {
  value: BudgetDraft;
  saving: boolean;
  saveError: string | null;
  isEditing: boolean;
  onChange: (next: BudgetDraft) => void;
  onSave: () => void;
  onStartFresh: () => void;
}

const CATEGORY_OPTIONS: CategoryType[] = ["Need", "Want", "Saving"];

export function BudgetForm({
  value,
  saving,
  saveError,
  isEditing,
  onChange,
  onSave,
  onStartFresh,
}: Props) {
  function updateDraft<K extends keyof BudgetDraft>(
    field: K,
    next: BudgetDraft[K],
  ) {
    onChange({ ...value, [field]: next });
  }

  function updateExpenseRow(
    expenseId: string,
    field: keyof BudgetExpense,
    next: string | number,
  ) {
    onChange({
      ...value,
      expenses: value.expenses.map((expense) =>
        expense.expenseId === expenseId
          ? {
              ...expense,
              [field]: next,
            }
          : expense,
      ),
    });
  }

  function addExpenseRow() {
    onChange({
      ...value,
      expenses: [...value.expenses, createBudgetExpense()],
    });
  }

  function removeExpenseRow(expenseId: string) {
    const nextExpenses = value.expenses.filter(
      (expense) => expense.expenseId !== expenseId,
    );

    onChange({
      ...value,
      expenses: nextExpenses.length ? nextExpenses : [createBudgetExpense()],
    });
  }

  const hasInvalidRows = value.expenses.some(
    (expense) =>
      hasBudgetRowContent(expense) &&
      (!expense.name.trim() || Number(expense.amount) <= 0),
  );
  const validExpenseCount = value.expenses.filter(
    (expense) => expense.name.trim() && Number(expense.amount) > 0,
  ).length;
  const canSave =
    value.name.trim().length > 0 &&
    Number(value.monthlyIncome) > 0 &&
    validExpenseCount > 0 &&
    !hasInvalidRows;

  return (
    <Stack spacing={2.5}>
      <TextField
        label="Budget name"
        value={value.name}
        onChange={(event) => updateDraft("name", event.target.value)}
        size="small"
        fullWidth
      />
      <TextField
        label="Monthly income"
        type="number"
        value={value.monthlyIncome}
        onChange={(event) =>
          updateDraft("monthlyIncome", Number(event.target.value || 0))
        }
        size="small"
        fullWidth
        slotProps={{
          input: {
            startAdornment: <InputAdornment position="start">$</InputAdornment>,
          },
        }}
      />

      <Box>
        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
          Expense rows
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Add a Sankey group only when multiple expenses should branch from the
          same rollup, for example a `Car` group with `Gas` and `Car note`
          expenses underneath it.
        </Typography>
      </Box>

      <Box sx={{ overflowX: "auto" }}>
        <Table size="small" sx={{ minWidth: 680 }}>
          <TableHead>
            <TableRow>
              <TableCell>Expense</TableCell>
              <TableCell width={140}>Amount</TableCell>
              <TableCell width={150}>Category</TableCell>
              <TableCell>Sankey group</TableCell>
              <TableCell align="right" width={56}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {value.expenses.map((expense, index) => {
              const rowHasError =
                hasBudgetRowContent(expense) &&
                (!expense.name.trim() || Number(expense.amount) <= 0);

              return (
                <TableRow key={expense.expenseId} hover>
                  <TableCell>
                    <TextField
                      placeholder={`Expense ${index + 1}`}
                      value={expense.name}
                      onChange={(event) =>
                        updateExpenseRow(
                          expense.expenseId,
                          "name",
                          event.target.value,
                        )
                      }
                      error={rowHasError && !expense.name.trim()}
                      helperText={
                        rowHasError && !expense.name.trim()
                          ? "Name is required when a row has a value."
                          : " "
                      }
                      size="small"
                      fullWidth
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      placeholder="0"
                      type="number"
                      value={expense.amount === 0 ? "" : String(expense.amount)}
                      onChange={(event) =>
                        updateExpenseRow(
                          expense.expenseId,
                          "amount",
                          Number(event.target.value || 0),
                        )
                      }
                      error={rowHasError && Number(expense.amount) <= 0}
                      size="small"
                      fullWidth
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">$</InputAdornment>
                          ),
                        },
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      select
                      value={expense.category}
                      onChange={(event) =>
                        updateExpenseRow(
                          expense.expenseId,
                          "category",
                          event.target.value,
                        )
                      }
                      size="small"
                      fullWidth
                    >
                      {CATEGORY_OPTIONS.map((category) => (
                        <MenuItem key={category} value={category}>
                          {CATEGORY_LABELS[category]}
                        </MenuItem>
                      ))}
                    </TextField>
                  </TableCell>
                  <TableCell>
                    <TextField
                      placeholder="Optional group"
                      value={expense.group ?? ""}
                      onChange={(event) =>
                        updateExpenseRow(
                          expense.expenseId,
                          "group",
                          event.target.value,
                        )
                      }
                      size="small"
                      fullWidth
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={() => removeExpenseRow(expense.expenseId)}
                      size="small"
                      aria-label={`delete-expense-${index}`}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>

      {saveError ? <Alert severity="error">{saveError}</Alert> : null}

      <Box
        display="flex"
        flexWrap="wrap"
        justifyContent="space-between"
        alignItems="center"
        gap={1.5}
      >
        <Box display="flex" gap={1}>
          <Button startIcon={<AddIcon />} onClick={addExpenseRow} size="small">
            Add expense
          </Button>
          <Button onClick={onStartFresh} size="small">
            Start fresh
          </Button>
        </Box>
        <Box textAlign="right">
          <Typography
            variant="caption"
            display="block"
            color={hasInvalidRows ? "error.main" : "text.secondary"}
          >
            {validExpenseCount} ready expense
            {validExpenseCount === 1 ? "" : "s"}
            {hasInvalidRows ? " - fix incomplete rows before saving" : ""}
          </Typography>
          {/* Note 2: Save stays disabled until the persisted budget would be
              internally consistent. The preview can tolerate temporary draft
              rows, but storage should not quietly create unnamed or zero-value
              expenses that would confuse the saved-budget list later. */}
          <Button
            variant="contained"
            onClick={onSave}
            disabled={!canSave || saving}
            sx={{ mt: 0.75 }}
          >
            {saving ? "Saving..." : isEditing ? "Update budget" : "Save budget"}
          </Button>
        </Box>
      </Box>
    </Stack>
  );
}
