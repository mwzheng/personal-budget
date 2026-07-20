"use client";

import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

import MoreVertOutlinedIcon from "@mui/icons-material/MoreVertOutlined";
import { ActionIconButton } from "@/components/ui/ActionIconButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import { StatusAlert } from "@/components/ui/StatusAlert";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useState } from "react";

import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";
import { apiFetch } from "@/lib/api/apiFetch";
import {
  downloadBudgetCsv,
  downloadBudgetJson,
} from "@/lib/utils/budgetExport";
import {
  normalizeBudgetForEditor,
  sortSavedBudgets,
} from "@/lib/utils/budget-planner";
import { formatCurrencyWhole } from "@/lib/utils/format";
import { SavedBudget } from "@/lib/types/types";

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return "";
  const now = Date.now();
  const then = Date.parse(dateStr);
  if (Number.isNaN(then)) return "";
  const diffMs = now - then;
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays < 1) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

interface Props {
  onLoad?: (budget: SavedBudget) => void;
  onEdit?: (budget: SavedBudget) => void;
  onBudgetsLoaded?: (budgets: SavedBudget[]) => void;
  onLoadingChange?: (loading: boolean) => void;
  reloadKey?: number;
  compact?: boolean;
}

export function BudgetList({
  onLoad,
  onEdit,
  onBudgetsLoaded,
  onLoadingChange,
  reloadKey,
  compact,
}: Props) {
  const [budgets, setBudgets] = useState<SavedBudget[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const {
    candidate: deleteCandidate,
    requestDelete,
    confirmDelete,
    cancelDelete,
    isDeleting,
  } = useDeleteConfirmation<{ id: string; name: string }>({
    onConfirm: async (item) => {
      try {
        const response = await apiFetch(`/api/budgets/${item.id}`, {
          method: "DELETE",
        });
        const text = await response.text();
        const data = text ? JSON.parse(text) : null;

        if (!response.ok) {
          throw new Error(
            data?.error?.message ?? data?.error ?? "Delete failed",
          );
        }

        setBudgets((current) => {
          const nextBudgets = current.filter(
            (budget) => budget.budgetId !== item.id,
          );
          onBudgetsLoaded?.(nextBudgets);
          return nextBudgets;
        });
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Failed to delete budget.",
        );
      }
    },
  });

  const loadBudgets = useCallback(async () => {
    setLoading(true);
    setError(null);
    onLoadingChange?.(true);

    try {
      const response = await apiFetch("/api/budgets");
      const text = await response.text();
      const data = text ? JSON.parse(text) : null;

      if (!response.ok) {
        throw new Error(
          data?.error?.message ?? data?.error ?? response.statusText,
        );
      }

      const nextBudgets = Array.isArray(data) ? data : (data?.budgets ?? []);
      const sortedBudgets = sortSavedBudgets(
        Array.isArray(nextBudgets) ? (nextBudgets as SavedBudget[]) : [],
      );

      setBudgets(sortedBudgets);
      onBudgetsLoaded?.(sortedBudgets);
    } catch (caughtError) {
      setBudgets([]);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to load saved budgets.",
      );
    } finally {
      setLoading(false);
      onLoadingChange?.(false);
    }
  }, [onBudgetsLoaded, onLoadingChange]);

  useEffect(() => {
    void loadBudgets();
  }, [loadBudgets, reloadKey]);

  // Export menu state
  const [exportAnchor, setExportAnchor] = useState<HTMLElement | null>(null);
  const [currentExportBudget, setCurrentExportBudget] =
    useState<SavedBudget | null>(null);

  function openExportMenu(
    event: React.MouseEvent<HTMLElement>,
    budget: SavedBudget,
  ) {
    setExportAnchor(event.currentTarget);
    setCurrentExportBudget(budget);
  }

  function handleExport(format: "json" | "csv") {
    const budget = currentExportBudget ?? undefined;
    if (!budget) return;

    setExportAnchor(null);
    setCurrentExportBudget(null);
    if (format === "json") {
      downloadBudgetJson(budget);
    } else {
      downloadBudgetCsv(budget);
    }
  }

  const exportOpen = Boolean(exportAnchor);

  const showExpanded = !compact || expanded;
  const displayBudgets = showExpanded ? budgets : budgets.slice(0, 6);

  return (
    <div>
      {error ? (
        <StatusAlert message={error} onClose={() => setError(null)} />
      ) : null}

      {loading ? (
        compact ? (
          <Stack
            direction="row"
            spacing={1}
            sx={{ overflowX: "auto", pb: 0.5 }}
          >
            {Array.from({ length: 3 }, (_, i) => (
              <Box
                key={`chip-skeleton-${i}`}
                sx={{
                  width: 120,
                  height: 36,
                  borderRadius: 2,
                  bgcolor: "action.hover",
                  flexShrink: 0,
                }}
              />
            ))}
          </Stack>
        ) : (
          <Grid container spacing={2}>
            {Array.from({ length: 3 }, (_, i) => (
              <Grid item key={`card-skeleton-${i}`} xs={12} sm={6} md={4}>
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Box
                      sx={{
                        width: "60%",
                        height: 20,
                        bgcolor: "action.hover",
                        borderRadius: 1,
                        mb: 1.5,
                      }}
                    />
                    <Box
                      sx={{
                        width: "80%",
                        height: 14,
                        bgcolor: "action.hover",
                        borderRadius: 1,
                        mb: 1,
                      }}
                    />
                    <Box
                      sx={{
                        width: "40%",
                        height: 14,
                        bgcolor: "action.hover",
                        borderRadius: 1,
                      }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )
      ) : null}

      {!loading && budgets.length === 0 ? (
        compact ? null : (
          <EmptyState
            icon={<AccountBalanceWalletOutlinedIcon />}
            message="Save a budget to reuse the same expense plan later."
            variant="body2"
          />
        )
      ) : null}

      {!loading && budgets.length > 0 && compact && !expanded ? (
        <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 0.5 }}>
          {displayBudgets.map((budget) => {
            const relativeTime = formatRelativeTime(
              budget.updatedAt ?? budget.createdAt,
            );
            return (
              <Box
                key={budget.budgetId ?? budget.name}
                component="button"
                type="button"
                onClick={() => onLoad?.(budget)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                  color: "text.primary",
                  cursor: "pointer",
                  flexShrink: 0,
                  transition: "all 0.15s ease-in-out",
                  "&:hover": {
                    borderColor: "primary.dark",
                    bgcolor: "action.hover",
                  },
                }}
              >
                <Typography variant="caption" fontWeight={600} noWrap>
                  {budget.name}
                </Typography>
                {relativeTime && (
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {relativeTime}
                  </Typography>
                )}
              </Box>
            );
          })}
          {budgets.length > 6 && (
            <Box
              component="button"
              type="button"
              onClick={() => setExpanded(true)}
              sx={{
                display: "flex",
                alignItems: "center",
                px: 1.5,
                py: 0.75,
                borderRadius: 2,
                border: "1px dashed",
                borderColor: "divider",
                bgcolor: "transparent",
                color: "text.secondary",
                cursor: "pointer",
                flexShrink: 0,
                transition: "all 0.15s ease-in-out",
                "&:hover": {
                  borderColor: "primary.main",
                  color: "primary.main",
                },
              }}
            >
              <Typography variant="caption" fontWeight={600}>
                View All ({budgets.length})
              </Typography>
            </Box>
          )}
        </Stack>
      ) : null}

      {!loading && displayBudgets.length > 0 && showExpanded ? (
        <Grid container spacing={2}>
          {displayBudgets.map((budget) => {
            const normalized = normalizeBudgetForEditor(budget);
            const expenseCount = normalized.expenses.filter(
              (expense) => expense.name.trim() && expense.amount > 0,
            ).length;
            const relativeTime = formatRelativeTime(
              budget.updatedAt ?? budget.createdAt,
            );

            return (
              <Grid
                key={budget.budgetId ?? budget.name}
                item
                xs={12}
                sm={6}
                md={4}
              >
                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      borderColor: "primary.dark",
                      boxShadow: 2,
                    },
                  }}
                >
                  <CardActionArea
                    onClick={() => onLoad?.(budget)}
                    aria-label={`Load budget ${budget.name}`}
                    sx={{
                      flexGrow: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "stretch",
                      p: 2,
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      fontWeight={600}
                      sx={{ lineHeight: 1.3, mb: 1 }}
                    >
                      {budget.name}
                    </Typography>

                    <Stack spacing={0.5} sx={{ mt: "auto" }}>
                      <Typography variant="body2" fontWeight={700}>
                        {formatCurrencyWhole(normalized.monthlyIncome)}{" "}
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          component="span"
                        >
                          income
                        </Typography>
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {expenseCount} expense
                        {expenseCount === 1 ? "" : "s"}
                        {relativeTime ? ` · ${relativeTime}` : ""}
                      </Typography>
                    </Stack>
                  </CardActionArea>

                  <Divider />

                  <Box
                    sx={{
                      display: "flex",
                      gap: 0.5,
                      justifyContent: "flex-end",
                      px: 2,
                      py: 1,
                    }}
                    onClick={(event) => event.stopPropagation()}
                  >
                    {onEdit ? (
                      <ActionIconButton
                        tooltip="Edit"
                        ariaLabel={`Edit budget ${budget.name}`}
                        onClick={() => {
                          onEdit?.(budget);
                        }}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </ActionIconButton>
                    ) : null}

                    <Tooltip title="Export" placement="top" arrow>
                      <IconButton
                        size="small"
                        aria-label={`Export budget ${budget.name}`}
                        onClick={(event) => openExportMenu(event, budget)}
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: 1.25,
                          border: "1px solid",
                          borderColor: "divider",
                          color: "text.secondary",
                          backgroundColor: "background.paper",
                          "&:hover": {
                            borderColor: "action.active",
                            backgroundColor: "action.hover",
                            color: "text.primary",
                          },
                        }}
                      >
                        <MoreVertOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <ActionIconButton
                      tooltip="Delete"
                      ariaLabel={`Delete budget ${budget.name}`}
                      tone="danger"
                      onClick={() =>
                        requestDelete({
                          id: budget.budgetId ?? "",
                          name: budget.name,
                        })
                      }
                    >
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </ActionIconButton>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      ) : null}

      <Menu
        anchorEl={exportAnchor}
        open={exportOpen}
        onClose={() => setExportAnchor(null)}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <MenuItem onClick={() => handleExport("json")}>
          JSON (importable)
        </MenuItem>
        <MenuItem onClick={() => handleExport("csv")}>
          CSV (view in spreadsheet)
        </MenuItem>
      </Menu>

      <ConfirmDialog
        open={Boolean(deleteCandidate)}
        title="Delete Budget"
        message={`Are you sure you want to delete "${deleteCandidate?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={isDeleting}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
