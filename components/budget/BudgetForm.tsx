/**
 * Note 1: BudgetForm is a controlled editor for the expense-driven planner.
 * The parent page owns the draft state so the pie chart and Sankey diagram can
 * update instantly as the user edits rows instead of waiting for a separate
 * "generate" submit step.
 */
"use client";

import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";
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
const ROW_ACTION_BUTTON_SX = {
  width: 34,
  height: 34,
  borderRadius: 1.25,
  border: "1px solid",
  borderColor: "divider",
  backgroundColor: "background.paper",
};
const FORM_ACTION_BUTTON_SX = {
  minWidth: 132,
};

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

  function moveExpenseRow(expenseId: string, direction: -1 | 1) {
    const currentIndex = value.expenses.findIndex(
      (expense) => expense.expenseId === expenseId,
    );
    const nextIndex = currentIndex + direction;

    if (
      currentIndex < 0 ||
      nextIndex < 0 ||
      nextIndex >= value.expenses.length
    ) {
      return;
    }

    const nextExpenses = [...value.expenses];
    const [movedExpense] = nextExpenses.splice(currentIndex, 1);
    nextExpenses.splice(nextIndex, 0, movedExpense);

    onChange({
      ...value,
      expenses: nextExpenses,
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
        label="Budget Name"
        value={value.name}
        onChange={(event) => updateDraft("name", event.target.value)}
        size="small"
        fullWidth
      />
      <TextField
        label="Monthly Income"
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
          Expense Rows
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Add a Sankey group only when multiple expenses should branch from the
          same rollup, for example a `Car` group with `Gas` and `Car note`
          expenses underneath it.
        </Typography>
      </Box>

      <Box sx={{ overflowX: "auto" }}>
        <Table size="small" sx={{ minWidth: 820 }}>
          <TableHead>
            <TableRow>
              <TableCell width="34%">Expense</TableCell>
              <TableCell width={140}>Amount</TableCell>
              <TableCell width={150}>Category</TableCell>
              <TableCell width="28%">Sankey Group</TableCell>
              <TableCell align="right" width={156}>
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
                <TableRow
                  key={expense.expenseId}
                  hover
                  sx={{ "& > *": { verticalAlign: "top", py: 1 } }}
                >
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
                      placeholder="Optional Group"
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
                    {/* Note 3: Row controls stay icon-sized and visually matched so
                        reordering reads as part of the same affordance as delete,
                        instead of looking like three unrelated controls jammed into
                        the final column. */}
                    <Stack
                      direction="row"
                      justifyContent="flex-end"
                      spacing={0.75}
                    >
                      <IconButton
                        onClick={() => moveExpenseRow(expense.expenseId, -1)}
                        size="small"
                        aria-label={`move-expense-up-${index}`}
                        disabled={index === 0}
                        sx={ROW_ACTION_BUTTON_SX}
                      >
                        <KeyboardArrowUpRoundedIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        onClick={() => moveExpenseRow(expense.expenseId, 1)}
                        size="small"
                        aria-label={`move-expense-down-${index}`}
                        disabled={index === value.expenses.length - 1}
                        sx={ROW_ACTION_BUTTON_SX}
                      >
                        <KeyboardArrowDownRoundedIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        onClick={() => removeExpenseRow(expense.expenseId)}
                        size="small"
                        aria-label={`delete-expense-${index}`}
                        sx={ROW_ACTION_BUTTON_SX}
                        color="error"
                      >
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>

      {saveError ? <Alert severity="error">{saveError}</Alert> : null}

      <Stack spacing={1.25}>
        <Typography
          variant="caption"
          color={hasInvalidRows ? "error.main" : "text.secondary"}
        >
          {validExpenseCount} ready expense{validExpenseCount === 1 ? "" : "s"}
          {hasInvalidRows ? " - fix incomplete rows before saving" : ""}
        </Typography>

        {/* Note 2: The form actions intentionally share one row on larger
            screens so "Add Expense", "Start Fresh", and the save action read as
            one workflow instead of three disconnected controls. */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          flexWrap="wrap"
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          gap={1}
        >
          <Stack direction={{ xs: "column", sm: "row" }} gap={1}>
            <Button
              startIcon={<AddIcon />}
              onClick={addExpenseRow}
              size="small"
              variant="outlined"
              sx={FORM_ACTION_BUTTON_SX}
            >
              Add Expense
            </Button>
            <Button
              onClick={onStartFresh}
              size="small"
              variant="outlined"
              sx={FORM_ACTION_BUTTON_SX}
            >
              Start Fresh
            </Button>
          </Stack>
          <Button
            variant="contained"
            onClick={onSave}
            disabled={!canSave || saving}
            size="small"
            sx={FORM_ACTION_BUTTON_SX}
          >
            {saving ? "Saving..." : isEditing ? "Update Budget" : "Save Budget"}
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
}
