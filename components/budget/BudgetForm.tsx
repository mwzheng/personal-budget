/**
 * Note 1: BudgetForm is a controlled editor for the expense-driven planner.
 * The parent page owns the draft state so the pie chart and flow diagram can
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
import UndoIcon from "@mui/icons-material/Undo";
import { ActionIconButton } from "@/components/ui/ActionIconButton";
import { StatusAlert } from "@/components/ui/StatusAlert";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import InputAdornment from "@mui/material/InputAdornment";
import LinearProgress from "@mui/material/LinearProgress";
import Menu from "@mui/material/Menu";
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
import { alpha } from "@mui/material/styles";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  BudgetDraft,
  createBudgetExpense,
  hasBudgetRowContent,
  parseSankeyPathSegments,
} from "@/lib/utils/budget-planner";
import { BudgetExpense, CategoryType } from "@/lib/types/types";
import { formatCurrency, formatCurrencyWhole } from "@/lib/utils/format";

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
const HELP_TITLE_ID = "flow-path-help-title";
const HELP_DESC_ID = "flow-path-help-description";

const DEFAULT_FLOW_SUGGESTIONS = [
  "Housing",
  "Housing > Rent",
  "Housing > Utilities",
  "Food",
  "Food > Groceries",
  "Food > Dining Out",
  "Transport",
  "Transport > Gas",
  "Transport > Public Transit",
  "Transport > Car Payment",
  "Utilities",
  "Utilities > Electric",
  "Utilities > Internet",
  "Utilities > Phone",
  "Entertainment",
  "Entertainment > Streaming",
  "Entertainment > Games",
  "Healthcare",
  "Healthcare > Insurance",
  "Healthcare > Medications",
  "Education",
  "Subscriptions",
  "Subscriptions > AI Tools",
  "Subscriptions > Software",
  "Personal",
  "Personal > Clothing",
  "Personal > Gym",
  "Insurance",
  "Insurance > Life",
  "Insurance > Home",
  "Debt",
  "Debt > Student Loans",
  "Debt > Credit Card",
  "Savings",
  "Savings > Emergency Fund",
  "Savings > Retirement",
  "Savings > Investment",
];

interface DeletedExpense {
  expense: BudgetExpense;
  index: number;
}

export function BudgetForm({
  value,
  saving,
  saveError,
  isEditing,
  onChange,
  onSave,
  onStartFresh,
}: Props) {
  const [helpOpen, setHelpOpen] = useState(false);
  const [rawAmounts, setRawAmounts] = useState<Record<string, string>>({});
  const [collapsedCategories, setCollapsedCategories] = useState<
    Record<string, boolean>
  >({});
  const [addMenuAnchor, setAddMenuAnchor] = useState<HTMLElement | null>(null);
  const [deletedExpense, setDeletedExpense] = useState<DeletedExpense | null>(
    null,
  );
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearUndoTimeout = useCallback(() => {
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearUndoTimeout();
  }, [clearUndoTimeout]);

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

  function addExpenseRow(category?: CategoryType) {
    setAddMenuAnchor(null);
    onChange({
      ...value,
      expenses: [
        ...value.expenses,
        createBudgetExpense({ category: category ?? "Need" }),
      ],
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
    const index = value.expenses.findIndex((e) => e.expenseId === expenseId);
    if (index < 0) return;

    const expense = value.expenses[index];
    setDeletedExpense({ expense, index });

    clearUndoTimeout();
    undoTimeoutRef.current = setTimeout(() => {
      setDeletedExpense(null);
      undoTimeoutRef.current = null;
    }, 5000);

    const nextExpenses = value.expenses.filter(
      (e) => e.expenseId !== expenseId,
    );

    onChange({
      ...value,
      expenses: nextExpenses.length ? nextExpenses : [createBudgetExpense()],
    });
  }

  function undoDelete() {
    if (!deletedExpense) return;
    clearUndoTimeout();

    const { expense, index } = deletedExpense;
    const nextExpenses = [...value.expenses];
    const insertAt = Math.min(index, nextExpenses.length);
    nextExpenses.splice(insertAt, 0, expense);

    onChange({
      ...value,
      expenses: nextExpenses,
    });
    setDeletedExpense(null);
  }

  function toggleCategory(category: CategoryType) {
    setCollapsedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
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

  const categoryColor = (category: CategoryType) => CATEGORY_COLORS[category];

  const groupedExpenses = CATEGORY_ORDER.map((category) => {
    const expenses = value.expenses.filter((e) => e.category === category);
    const total = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const pct =
      value.monthlyIncome > 0
        ? Math.min((total / Number(value.monthlyIncome)) * 100, 999)
        : 0;
    return { category, expenses, total, pct };
  });

  const isEmpty =
    value.expenses.length <= 1 &&
    !value.expenses.some(hasBudgetRowContent) &&
    !value.name.trim();

  const flowPathSuggestions = useMemo(() => {
    const existingPaths = new Set<string>();
    for (const expense of value.expenses) {
      const group = expense.group?.trim();
      if (group) {
        existingPaths.add(group);
      }
    }
    const defaults = DEFAULT_FLOW_SUGGESTIONS.filter(
      (s) => !existingPaths.has(s),
    );
    return [...Array.from(existingPaths), ...defaults].sort();
  }, [value.expenses]);

  return (
    <Stack spacing={2.5}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", sm: "flex-end" }}
      >
        <TextField
          label="Budget Name"
          value={value.name}
          onChange={(event) => updateDraft("name", event.target.value)}
          size="small"
          sx={{ flex: { xs: 1, sm: 1.5 } }}
          slotProps={{
            inputLabel: {
              sx: {
                color: "text.primary",
                "&.Mui-focused": { color: "primary.main" },
              },
            },
          }}
        />
        <TextField
          label="Monthly Income"
          type="number"
          value={value.monthlyIncome}
          onChange={(event) =>
            updateDraft("monthlyIncome", Number(event.target.value || 0))
          }
          size="small"
          sx={{ flex: 1 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">$</InputAdornment>
              ),
            },
            inputLabel: {
              sx: {
                color: "text.primary",
                "&.Mui-focused": { color: "primary.main" },
              },
            },
          }}
        />
      </Stack>

      <Divider />

      {isEmpty && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: "center", py: 1 }}
        >
          Start by naming your budget and adding your first expense below.
        </Typography>
      )}

      {groupedExpenses.map(({ category, expenses, total, pct }) => (
        <Box key={category}>
          <Box
            component="button"
            type="button"
            onClick={() => toggleCategory(category)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              width: "100%",
              py: 1,
              px: 0,
              border: "none",
              bgcolor: "transparent",
              cursor: "pointer",
              color: "text.primary",
              transition: "all 0.15s ease-in-out",
              "&:hover": { opacity: 0.85 },
            }}
          >
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                bgcolor: categoryColor(category),
                flexShrink: 0,
              }}
            />
            <Typography variant="subtitle2" fontWeight={600}>
              {CATEGORY_LABELS[category]}
            </Typography>
            {expenses.length > 0 && (
              <>
                <Typography variant="caption" color="text.secondary">
                  {formatCurrencyWhole(total)} ({pct.toFixed(0)}%)
                </Typography>
                <Box sx={{ flex: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(pct, 100)}
                    sx={{
                      height: 4,
                      borderRadius: 2,
                      bgcolor: alpha(categoryColor(category), 0.12),
                      "& .MuiLinearProgress-bar": {
                        bgcolor: categoryColor(category),
                        borderRadius: 2,
                      },
                    }}
                  />
                </Box>
              </>
            )}
            {expenses.length === 0 && (
              <Typography variant="caption" color="text.secondary">
                No expenses
              </Typography>
            )}
            <KeyboardArrowDownRoundedIcon
              sx={{
                fontSize: 18,
                color: "text.secondary",
                transform: collapsedCategories[category]
                  ? "rotate(-90deg)"
                  : "rotate(0deg)",
                transition: "transform 0.2s ease-in-out",
              }}
            />
          </Box>

          <Collapse in={!collapsedCategories[category]}>
            {expenses.length > 0 ? (
              <Box sx={{ overflowX: { xs: "auto", lg: "visible" } }}>
                <Table
                  size="small"
                  sx={{
                    width: "100%",
                    tableLayout: "fixed",
                    "& .MuiTableCell-root": {
                      padding: "6px 8px",
                      verticalAlign: "middle",
                    },
                  }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell
                        align="center"
                        width="26%"
                        sx={{
                          textTransform: "none",
                          letterSpacing: 0,
                          fontWeight: 600,
                        }}
                      >
                        Expense
                      </TableCell>
                      <TableCell
                        align="center"
                        width="17%"
                        sx={{
                          textTransform: "none",
                          letterSpacing: 0,
                          fontWeight: 600,
                        }}
                      >
                        Amount
                      </TableCell>
                      <TableCell
                        align="center"
                        width="15%"
                        sx={{
                          textTransform: "none",
                          letterSpacing: 0,
                          fontWeight: 600,
                        }}
                      >
                        Yearly
                      </TableCell>
                      <TableCell
                        align="center"
                        width="25%"
                        sx={{
                          textTransform: "none",
                          letterSpacing: 0,
                          fontWeight: 600,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 0.75,
                          }}
                        >
                          <span>Flow Path</span>
                          <Box
                            component="button"
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setHelpOpen(true);
                            }}
                            aria-label="How Flow Path works"
                            title="How Flow Path works"
                            sx={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: 18,
                              height: 18,
                              borderRadius: "50%",
                              border: "1px solid",
                              borderColor: "text.disabled",
                              bgcolor: "transparent",
                              color: "text.disabled",
                              fontSize: 11,
                              lineHeight: 1,
                              cursor: "pointer",
                              p: 0,
                              transition: "all 0.15s ease-in-out",
                              "&:hover": {
                                borderColor: "primary.main",
                                color: "primary.main",
                                bgcolor: "action.hover",
                              },
                            }}
                          >
                            ?
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell
                        align="center"
                        width="17%"
                        sx={{
                          textTransform: "none",
                          letterSpacing: 0,
                          fontWeight: 600,
                        }}
                      >
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {expenses.map((expense) => {
                      const globalIndex = value.expenses.findIndex(
                        (e) => e.expenseId === expense.expenseId,
                      );
                      const parsedSegments = parseSankeyPathSegments(
                        expense.group,
                        expense.name,
                      );
                      const percentage =
                        value.monthlyIncome > 0
                          ? Math.min(
                              (Number(expense.amount) /
                                Number(value.monthlyIncome)) *
                                100,
                              999,
                            )
                          : 0;
                      const rowHasError =
                        hasBudgetRowContent(expense) &&
                        (!expense.name.trim() || Number(expense.amount) <= 0);

                      return (
                        <TableRow
                          key={expense.expenseId}
                          hover
                          sx={{
                            "& > *": { verticalAlign: "middle", py: 1 },
                            borderLeft: `3px solid ${categoryColor(category)}`,
                          }}
                        >
                          <TableCell>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.75,
                              }}
                            >
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <TextField
                                  placeholder={`Expense ${globalIndex + 1}`}
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
                              </Box>
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
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                              }}
                            >
                              <TextField
                                placeholder="0"
                                type="number"
                                value={
                                  rawAmounts[expense.expenseId] ??
                                  (expense.amount === 0
                                    ? ""
                                    : String(expense.amount))
                                }
                                onChange={(event) => {
                                  const raw = event.target.value;
                                  setRawAmounts((prev) => ({
                                    ...prev,
                                    [expense.expenseId]: raw,
                                  }));
                                  updateExpenseRow(
                                    expense.expenseId,
                                    "amount",
                                    raw === "" || raw === "-" ? 0 : Number(raw),
                                  );
                                }}
                                error={
                                  rowHasError && Number(expense.amount) <= 0
                                }
                                margin="dense"
                                size="small"
                                sx={{ minWidth: 0, flex: 1 }}
                                slotProps={{
                                  htmlInput: { sx: { textAlign: "right" } },
                                  input: {
                                    startAdornment: (
                                      <InputAdornment position="start">
                                        $
                                      </InputAdornment>
                                    ),
                                  },
                                }}
                              />
                              {percentage > 0 && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{
                                    whiteSpace: "nowrap",
                                    flexShrink: 0,
                                    fontSize: 11,
                                  }}
                                >
                                  {percentage.toFixed(1)}%
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                textAlign: "center",
                                fontWeight: 500,
                                fontVariantNumeric: "tabular-nums",
                              }}
                            >
                              {formatCurrency(Number(expense.amount) * 12)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Stack spacing={0.5}>
                              <Autocomplete
                                freeSolo
                                options={flowPathSuggestions}
                                inputValue={expense.group ?? ""}
                                onInputChange={(_event, newValue) =>
                                  updateExpenseRow(
                                    expense.expenseId,
                                    "group",
                                    newValue,
                                  )
                                }
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    placeholder="e.g. Housing > Rent"
                                    margin="dense"
                                    size="small"
                                  />
                                )}
                                renderTags={(value, getTagProps) =>
                                  value.map((option, index) => (
                                    <Chip
                                      {...getTagProps({ index })}
                                      key={option}
                                      label={option}
                                      size="small"
                                      sx={{ height: 20 }}
                                    />
                                  ))
                                }
                                size="small"
                                sx={{ flex: 1 }}
                              />
                            </Stack>
                          </TableCell>
                          <TableCell align="right">
                            <Stack
                              direction="row"
                              justifyContent="flex-end"
                              alignItems="center"
                              spacing={0.5}
                            >
                              <Tooltip
                                title={globalIndex === 0 ? "" : "Move up"}
                              >
                                <span style={{ display: "inline-flex" }}>
                                  <Box
                                    component="button"
                                    type="button"
                                    onClick={() =>
                                      moveExpenseRow(expense.expenseId, -1)
                                    }
                                    disabled={globalIndex === 0}
                                    aria-label={`Move expense ${globalIndex + 1} up`}
                                    sx={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      width: 28,
                                      height: 28,
                                      borderRadius: 1,
                                      border: "none",
                                      bgcolor: "transparent",
                                      color:
                                        globalIndex === 0
                                          ? "action.disabled"
                                          : "text.secondary",
                                      cursor:
                                        globalIndex === 0
                                          ? "default"
                                          : "pointer",
                                      p: 0,
                                      transition: "all 0.15s ease-in-out",
                                      "&:hover:not(:disabled)": {
                                        bgcolor: "action.hover",
                                        color: "text.primary",
                                      },
                                    }}
                                  >
                                    <KeyboardArrowUpRoundedIcon
                                      sx={{ fontSize: 18 }}
                                    />
                                  </Box>
                                </span>
                              </Tooltip>
                              <Tooltip
                                title={
                                  globalIndex === value.expenses.length - 1
                                    ? ""
                                    : "Move down"
                                }
                              >
                                <span style={{ display: "inline-flex" }}>
                                  <Box
                                    component="button"
                                    type="button"
                                    onClick={() =>
                                      moveExpenseRow(expense.expenseId, 1)
                                    }
                                    disabled={
                                      globalIndex === value.expenses.length - 1
                                    }
                                    aria-label={`Move expense ${globalIndex + 1} down`}
                                    sx={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      width: 28,
                                      height: 28,
                                      borderRadius: 1,
                                      border: "none",
                                      bgcolor: "transparent",
                                      color:
                                        globalIndex ===
                                        value.expenses.length - 1
                                          ? "action.disabled"
                                          : "text.secondary",
                                      cursor:
                                        globalIndex ===
                                        value.expenses.length - 1
                                          ? "default"
                                          : "pointer",
                                      p: 0,
                                      transition: "all 0.15s ease-in-out",
                                      "&:hover:not(:disabled)": {
                                        bgcolor: "action.hover",
                                        color: "text.primary",
                                      },
                                    }}
                                  >
                                    <KeyboardArrowDownRoundedIcon
                                      sx={{ fontSize: 18 }}
                                    />
                                  </Box>
                                </span>
                              </Tooltip>
                              <ActionIconButton
                                onClick={() =>
                                  removeExpenseRow(expense.expenseId)
                                }
                                tooltip="Delete"
                                ariaLabel={`Delete ${expense.name || `expense ${globalIndex + 1}`}`}
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
            ) : (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", py: 1, pl: 4 }}
              >
                No {CATEGORY_LABELS[category].toLowerCase()} yet.
              </Typography>
            )}
          </Collapse>
        </Box>
      ))}

      <Box>
        <Button
          startIcon={<AddIcon />}
          onClick={(e) => setAddMenuAnchor(e.currentTarget)}
          size="small"
          variant="outlined"
          sx={{ minWidth: 120, height: 32 }}
        >
          Add
        </Button>
        <Menu
          anchorEl={addMenuAnchor}
          open={Boolean(addMenuAnchor)}
          onClose={() => setAddMenuAnchor(null)}
          transformOrigin={{ horizontal: "left", vertical: "top" }}
          anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
        >
          {CATEGORY_OPTIONS.map((category) => (
            <MenuItem key={category} onClick={() => addExpenseRow(category)}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: categoryColor(category),
                  }}
                />
                {CATEGORY_LABELS[category]}
              </Box>
            </MenuItem>
          ))}
        </Menu>
      </Box>

      {saveError ? <StatusAlert message={saveError} /> : null}

      {deletedExpense && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
            py: 1,
            borderRadius: 2,
            bgcolor: alpha("#ffffff", 0.05),
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Expense deleted
          </Typography>
          <Button
            size="small"
            startIcon={<UndoIcon sx={{ fontSize: 16 }} />}
            onClick={undoDelete}
            sx={{ minWidth: 0, textTransform: "none" }}
          >
            Undo
          </Button>
        </Box>
      )}

      <Stack spacing={1.25}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          flexWrap="wrap"
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          gap={1}
        >
          <Stack direction="row" spacing={1} alignItems="center">
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
            <Typography
              variant="caption"
              color={hasInvalidRows ? "error.main" : "text.secondary"}
            >
              {validExpenseCount} expense{validExpenseCount === 1 ? "" : "s"}{" "}
              ready
              {hasInvalidRows ? " - fix errors" : ""}
            </Typography>
          </Stack>
          <Button
            variant="contained"
            onClick={onSave}
            disabled={!canSave || saving}
            size="small"
            sx={{ minWidth: 140, height: 36 }}
          >
            {saving ? "Saving..." : isEditing ? "Update Budget" : "Save Budget"}
          </Button>
        </Stack>
      </Stack>

      <Dialog
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        maxWidth="sm"
        fullWidth
        aria-labelledby={HELP_TITLE_ID}
        aria-describedby={HELP_DESC_ID}
      >
        <DialogTitle id={HELP_TITLE_ID}>Flow Diagram Instructions</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Typography
              id={HELP_DESC_ID}
              variant="body2"
              color="text.secondary"
            >
              The flow diagram moves from <strong>Net Income</strong> into
              optional path layers and then into individual expense leaves. Use
              the <strong>Flow Path</strong> field to organize expenses into
              branches.
            </Typography>

            <Typography variant="subtitle2" fontWeight={700}>
              How to write a Flow Path
            </Typography>

            <Box component="ul" sx={{ pl: 2.5, m: 0 }}>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                Separate nested layers with{" "}
                <Box component="span" sx={{ fontFamily: "monospace" }}>
                  {">"}
                </Box>{" "}
                (greater-than sign).
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                Do not include the expense name in the path; the{" "}
                <strong>Expense</strong> column is the final leaf.
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                Start typing to see suggestions from your existing paths and
                common categories.
              </Typography>
            </Box>

            <Typography variant="subtitle2" fontWeight={700}>
              Examples
            </Typography>

            <Box
              component="pre"
              sx={{
                fontFamily: "monospace",
                backgroundColor: (theme) => theme.palette.action.hover,
                p: 1,
                borderRadius: 1,
                whiteSpace: "pre-wrap",
                mb: 1,
              }}
            >{`Flow Path: Subscriptions > AI Tools
Expense: Copilot
Result: Net Income → Subscriptions → AI Tools → Copilot

Flow Path: Home > Security
Expense: Ring
Result: Net Income → Home → Security → Ring

Flow Path: Utilities
Expense: Internet
Result: Net Income → Utilities → Internet`}</Box>

            <Typography variant="body2" color="text.secondary">
              Tip: Category controls pie-chart colors and summary totals. Paths
              control flow structure only.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHelpOpen(false)}>Got It</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
