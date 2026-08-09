"use client";

import { apiFetch } from "@/lib/api/apiFetch";
import { formatCurrency, formatCurrencyWhole } from "@/lib/utils/format";

import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import SavingsIcon from "@mui/icons-material/Savings";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import WarningIcon from "@mui/icons-material/Warning";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { AllocationBar } from "@/components/budget/AllocationBar";
import { BudgetForm } from "@/components/budget/BudgetForm";
import { BudgetSummary } from "@/components/budget/BudgetSummary";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import { isAuthenticated } from "@/lib/auth/cognitoClient";
import {
  buildBudgetInsights,
  createDefaultBudgetDraft,
  BudgetDraft,
  hasBudgetRowContent,
  normalizeBudgetForEditor,
  normalizeBudgetForStorage,
  sortSavedBudgets,
} from "@/lib/utils/budget-planner";
import { SavedBudget } from "@/lib/types/types";
import { SERVER_THEME_TOKENS } from "@/lib/theme/server-theme-tokens";
import {
  clearBudgetDraft,
  getBudgetDraft,
  setBudgetDraft,
} from "@/lib/utils/storage";
import dynamic from "next/dynamic";

const SankeyChart = dynamic(
  () =>
    import("@/components/charts/SankeyChart").then(
      (module) => module.SankeyChart,
    ),
  {
    ssr: false,
    loading: () => <Skeleton variant="rectangular" height={520} />,
  },
);

const PAGE_TITLE_ID = "budget-page-title";
const PAGE_DESCRIPTION_ID = "budget-page-description";

function StatCard({
  label,
  value,
  subtitle,
  color,
  borderColor,
  icon,
  isLoading,
}: {
  label: string;
  value: string;
  subtitle?: string;
  color?: string;
  borderColor?: string;
  icon?: React.ReactNode;
  isLoading: boolean;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        px: { xs: 2, sm: 2.5 },
        py: { xs: 1.5, sm: 2 },
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          bgcolor: borderColor ?? "divider",
          borderTopLeftRadius: 12,
          borderBottomLeftRadius: 12,
        },
      }}
    >
      <Stack direction="row" alignItems="flex-start" spacing={1}>
        {icon && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: 1.5,
              bgcolor: borderColor ? alpha(borderColor, 0.12) : "action.hover",
              color: borderColor ?? "text.secondary",
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        )}
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ lineHeight: 1.2 }}
          >
            {label}
          </Typography>
          {isLoading ? (
            <Skeleton width={80} height={28} />
          ) : (
            <>
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{ lineHeight: 1.2, color }}
              >
                {value}
              </Typography>
              {subtitle && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ lineHeight: 1.2 }}
                >
                  {subtitle}
                </Typography>
              )}
            </>
          )}
        </Box>
      </Stack>
    </Paper>
  );
}

export default function BudgetPage() {
  const [draft, setDraft] = useState<BudgetDraft>(createDefaultBudgetDraft);
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [budgetsReloadKey, setBudgetsReloadKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const hasAutoLoadedLatestBudget = useRef(false);
  const hasDraftChangesRef = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const router = useRouter();

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DISABLE_AUTH === "true") {
      return;
    }

    if (!isAuthenticated()) {
      router.replace("/auth/login");
    }
  }, [router]);

  const insights = useMemo(() => buildBudgetInsights(draft), [draft]);
  const hasDraftChanges =
    Boolean(editingBudgetId) ||
    draft.name.trim().length > 0 ||
    draft.monthlyIncome !== 5000 ||
    draft.expenses.length > 1 ||
    draft.expenses.some(hasBudgetRowContent);

  useEffect(() => {
    hasDraftChangesRef.current = hasDraftChanges;
  }, [hasDraftChanges]);

  // Auto-save draft to localStorage with 500ms debounce
  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      if (hasDraftChanges) {
        setBudgetDraft(draft, editingBudgetId);
      }
    }, 500);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [draft, editingBudgetId, hasDraftChanges]);

  // Restore draft from localStorage on mount (if no server budgets)
  useEffect(() => {
    const savedDraft = getBudgetDraft();
    if (savedDraft && !hasAutoLoadedLatestBudget.current) {
      setDraft(savedDraft.draft);
      setEditingBudgetId(savedDraft.editingBudgetId);
    }
  }, []);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (hasDraftChangesRef.current) {
        event.preventDefault();
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const handleBudgetsLoaded = useCallback((budgets: SavedBudget[]) => {
    if (hasAutoLoadedLatestBudget.current) {
      return;
    }

    hasAutoLoadedLatestBudget.current = true;
    if (hasDraftChangesRef.current) {
      return;
    }

    const latestBudget = sortSavedBudgets(budgets)[0];

    if (!latestBudget) {
      return;
    }

    const normalized = normalizeBudgetForEditor(latestBudget);
    setDraft(normalized);
    setEditingBudgetId(normalized.budgetId ?? null);
    setSaveError(null);
  }, []);

  async function saveBudget() {
    setSaving(true);
    setSaveError(null);

    try {
      const payload = normalizeBudgetForStorage({
        ...draft,
        budgetId: editingBudgetId ?? draft.budgetId,
      });
      const isEditing = Boolean(editingBudgetId);
      const response = await apiFetch(
        isEditing ? `/api/budgets/${editingBudgetId}` : "/api/budgets",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error?.message ?? data?.error ?? response.statusText,
        );
      }

      const persisted = normalizeBudgetForEditor(
        (data?.updated ?? data?.created ?? data) as SavedBudget,
      );

      setDraft(persisted);
      setEditingBudgetId(persisted.budgetId ?? null);
      setBudgetsReloadKey((current) => current + 1);
      clearBudgetDraft();
    } catch (caughtError) {
      setSaveError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to save budget.",
      );
    } finally {
      setSaving(false);
    }
  }

  function editBudget(budget: SavedBudget) {
    const normalized = normalizeBudgetForEditor(budget);
    setDraft(normalized);
    setEditingBudgetId(normalized.budgetId ?? null);
    setSaveError(null);
  }

  function startFresh() {
    setDraft(createDefaultBudgetDraft());
    setEditingBudgetId(null);
    setSaveError(null);
    clearBudgetDraft();
  }

  function handleBudgetDeleted(budgetId: string) {
    if (editingBudgetId === budgetId) {
      startFresh();
    }
  }

  const leftoverColor =
    insights.overspending > 0
      ? "warning.main"
      : insights.leftoverSavings > 0
        ? "success.main"
        : undefined;
  const leftoverBorderColor =
    insights.overspending > 0 || insights.leftoverSavings > 0
      ? SERVER_THEME_TOKENS.palette.secondary
      : undefined;

  const savingsRate =
    insights.monthlyIncome > 0
      ? ((insights.leftoverSavings / insights.monthlyIncome) * 100).toFixed(0)
      : "0";
  const expensesPct =
    insights.monthlyIncome > 0
      ? ((insights.totalExpenses / insights.monthlyIncome) * 100).toFixed(0)
      : "0";

  return (
    <Container
      component="main"
      maxWidth="xl"
      aria-labelledby={PAGE_TITLE_ID}
      aria-describedby={PAGE_DESCRIPTION_ID}
      sx={{ py: { xs: 4, md: 5 } }}
    >
      <PageHeader
        title="Budget Planner"
        description="Plan monthly expenses and visualize your budget with pie charts and flow diagrams."
        headingId={PAGE_TITLE_ID}
        descriptionId={PAGE_DESCRIPTION_ID}
        sx={{ mb: 3 }}
      />

      <Box sx={{ mb: 3 }}>
        <AllocationBar
          categoryTotals={insights.categoryTotals}
          monthlyIncome={insights.monthlyIncome}
          leftoverSavings={insights.leftoverSavings}
          overspending={insights.overspending}
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: "repeat(3, 1fr)",
          mb: 3,
        }}
      >
        <StatCard
          label="Monthly Income"
          value={formatCurrencyWhole(insights.monthlyIncome)}
          subtitle={`${formatCurrencyWhole(insights.monthlyIncome * 12)} yearly`}
          borderColor={SERVER_THEME_TOKENS.palette.primary}
          icon={<AttachMoneyIcon fontSize="small" />}
          isLoading={isLoading}
        />
        <StatCard
          label="Planned Expenses"
          value={formatCurrencyWhole(insights.totalExpenses)}
          subtitle={`${expensesPct}% of income`}
          borderColor={SERVER_THEME_TOKENS.text.secondary}
          icon={<TrendingDownIcon fontSize="small" />}
          isLoading={isLoading}
        />
        <StatCard
          label={
            insights.overspending > 0
              ? "Overspending"
              : insights.leftoverSavings > 0
                ? "Leftover Savings"
                : "Balance"
          }
          value={formatCurrency(
            insights.overspending > 0
              ? insights.overspending
              : insights.leftoverSavings,
          )}
          subtitle={
            insights.overspending <= 0 && insights.leftoverSavings > 0
              ? `${savingsRate}% savings rate`
              : undefined
          }
          color={leftoverColor}
          borderColor={leftoverBorderColor}
          icon={
            insights.overspending > 0 ? (
              <WarningIcon fontSize="small" />
            ) : (
              <SavingsIcon fontSize="small" />
            )
          }
          isLoading={isLoading}
        />
      </Box>

      <Grid container spacing={3} sx={{ alignItems: "stretch" }}>
        <Grid
          item
          xs={12}
          md={8}
          sx={{
            display: { xs: "none", md: "flex" },
            flexDirection: "column",
            minHeight: 480,
          }}
        >
          <SectionCard
            title="Budget Flow"
            sx={{ flex: 1, display: "flex", flexDirection: "column" }}
            contentSx={{ flex: 1, position: "relative", overflow: "hidden" }}
          >
            {isLoading ? (
              <Skeleton variant="rectangular" height={320} />
            ) : (
              <SankeyChart data={insights.sankeyData} />
            )}
          </SectionCard>
        </Grid>

        <Grid
          item
          xs={12}
          md={4}
          sx={{ display: "flex", flexDirection: "column", minHeight: 480 }}
        >
          <SectionCard title="Expense Breakdown" sx={{ flexGrow: 1 }}>
            <BudgetSummary insights={insights} isLoading={isLoading} />
          </SectionCard>
        </Grid>

        <Grid item xs={12}>
          <SectionCard title="Expenses">
            <BudgetForm
              value={draft}
              saving={saving}
              saveError={saveError}
              isEditing={Boolean(editingBudgetId)}
              activeBudgetId={editingBudgetId}
              budgetsReloadKey={budgetsReloadKey}
              onChange={setDraft}
              onSave={saveBudget}
              onStartFresh={startFresh}
              onEditBudget={editBudget}
              onBudgetsLoaded={handleBudgetsLoaded}
              onLoadingChange={setIsLoading}
              onDeleteBudget={handleBudgetDeleted}
            />
          </SectionCard>
        </Grid>
      </Grid>
    </Container>
  );
}
