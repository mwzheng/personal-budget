/**
 * Note 1: BudgetForm is a controlled editor for the expense-driven planner.
 * The parent page owns the draft state so the pie chart and Sankey diagram can
 * update instantly as the user edits rows instead of waiting for a separate
 * "generate" submit step.
 */
"use client";

import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { ActionIconButton } from "@/components/ui/ActionIconButton";
import { StatusAlert } from "@/components/ui/StatusAlert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import {
  CATEGORY_LABELS,
  BudgetDraft,
  createBudgetExpense,
  hasBudgetRowContent,
  parseSankeyPathSegments,
} from "@/lib/utils/budget-planner";
import { BudgetExpense, CategoryType } from "@/lib/types/types";

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
const FORM_ACTION_BUTTON_SX = {
  minWidth: 132,
  height: 36,
};
const SECONDARY_FORM_ACTION_BUTTON_SX = {
  ...FORM_ACTION_BUTTON_SX,
  borderColor: "divider",
  color: "text.primary",
  "&:hover": {
    borderColor: "text.disabled",
    backgroundColor: "action.hover",
  },
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
          Use the Sankey Path field only when an expense should sit inside one
          or more flow branches. Separate layers with `&gt;`, for example
          `Subscriptions &gt; AI Tools`.
        </Typography>
      </Box>

      <Box sx={{ overflowX: { xs: "auto", lg: "visible" } }}>
        <Table
          size="small"
          sx={{
            width: "100%",
            tableLayout: "fixed",
            // Note 2: Tightening cell padding keeps the fixed-layout table readable
            // on smaller screens without forcing the editor into horizontal overflow.
            "& .MuiTableCell-root": {
              padding: "6px 8px",
              verticalAlign: "middle",
            },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell width="32%">Expense</TableCell>
              <TableCell width="18%">Amount</TableCell>
              <TableCell width="14%">Category</TableCell>
              <TableCell width="24%">Sankey Path</TableCell>
              <TableCell align="right" width="12%">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {value.expenses.map((expense, index) => {
              const parsedSegments = parseSankeyPathSegments(
                expense.group,
                expense.name,
              );
              const rowHasError =
                hasBudgetRowContent(expense) &&
                (!expense.name.trim() || Number(expense.amount) <= 0);

              return (
                <TableRow
                  key={expense.expenseId}
                  hover
                  sx={{ "& > *": { verticalAlign: "middle", py: 1 } }}
                >
                  <TableCell>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
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
                        margin="dense"
                        size="small"
                        fullWidth
                      />
                      {rowHasError && !expense.name.trim() && (
                        <Tooltip title="Name is required when a row has a value.">
                          <ErrorOutlineIcon
                            sx={{
                              fontSize: 20,
                              color: "error.main",
                              flexShrink: 0,
                            }}
                          />
                        </Tooltip>
                      )}
                    </Box>
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
                      margin="dense"
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
                      margin="dense"
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
                      placeholder="Optional Path"
                      value={expense.group ?? ""}
                      onChange={(event) =>
                        updateExpenseRow(
                          expense.expenseId,
                          "group",
                          event.target.value,
                        )
                      }
                      margin="dense"
                      size="small"
                      fullWidth
                      inputProps={{
                        title: parsedSegments.length
                          ? parsedSegments.join(" > ")
                          : (expense.group ?? ""),
                      }}
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
                      alignItems="center"
                      spacing={0.75}
                    >
                      <ActionIconButton
                        onClick={() => moveExpenseRow(expense.expenseId, -1)}
                        tooltip="Move up"
                        ariaLabel={`Move expense ${index + 1} up`}
                        disabled={index === 0}
                      >
                        <KeyboardArrowUpRoundedIcon fontSize="small" />
                      </ActionIconButton>
                      <ActionIconButton
                        onClick={() => moveExpenseRow(expense.expenseId, 1)}
                        tooltip="Move down"
                        ariaLabel={`Move expense ${index + 1} down`}
                        disabled={index === value.expenses.length - 1}
                      >
                        <KeyboardArrowDownRoundedIcon fontSize="small" />
                      </ActionIconButton>
                      <ActionIconButton
                        onClick={() => removeExpenseRow(expense.expenseId)}
                        tooltip="Delete"
                        ariaLabel={`Delete expense ${index + 1}`}
                        tone="danger"
                      >
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </ActionIconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>

      {saveError ? <StatusAlert message={saveError} /> : null}

      <Stack spacing={1.25}>
        <Typography
          variant="caption"
          color={hasInvalidRows ? "error.main" : "text.secondary"}
        >
          {validExpenseCount} ready expense{validExpenseCount === 1 ? "" : "s"}
          {hasInvalidRows ? " - fix incomplete rows before saving" : ""}
        </Typography>

        {/* Note 4: The form actions intentionally share one row on larger
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
              startIcon={<RestartAltIcon />}
              onClick={onStartFresh}
              size="small"
              variant="outlined"
              color="inherit"
              sx={SECONDARY_FORM_ACTION_BUTTON_SX}
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
