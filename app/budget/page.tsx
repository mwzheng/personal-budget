"use client";

import { apiFetch } from "@/lib/api/apiFetch";
import { formatCurrency, formatCurrencyWhole } from "@/lib/utils/format";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { AllocationBar } from "@/components/budget/AllocationBar";
import { BudgetForm } from "@/components/budget/BudgetForm";
import { BudgetList } from "@/components/budget/BudgetList";
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
  isLoading,
}: {
  label: string;
  value: string;
  subtitle?: string;
  color?: string;
  borderColor?: string;
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

  function loadBudget(budget: SavedBudget) {
    setDraft({
      ...normalizeBudgetForEditor(budget),
      budgetId: undefined,
    });
    setEditingBudgetId(null);
    setSaveError(null);
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
      sx={{ py: { xs: 3, md: 4 } }}
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
          gridTemplateColumns: {
            xs: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
          },
          mb: 3,
        }}
      >
        <StatCard
          label="Monthly Income"
          value={formatCurrencyWhole(insights.monthlyIncome)}
          subtitle={`${formatCurrencyWhole(insights.monthlyIncome * 12)} yearly`}
          borderColor={SERVER_THEME_TOKENS.palette.primary}
          isLoading={isLoading}
        />
        <StatCard
          label="Planned Expenses"
          value={formatCurrencyWhole(insights.totalExpenses)}
          subtitle={`${expensesPct}% of income`}
          borderColor={SERVER_THEME_TOKENS.text.secondary}
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
          isLoading={isLoading}
        />
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <SectionCard title="Expenses">
            {isLoading ? (
              <Skeleton variant="rectangular" height={260} />
            ) : (
              <BudgetForm
                value={draft}
                saving={saving}
                saveError={saveError}
                isEditing={Boolean(editingBudgetId)}
                onChange={setDraft}
                onSave={saveBudget}
                onStartFresh={startFresh}
              />
            )}
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            <SectionCard title="Expense Breakdown">
              <BudgetSummary insights={insights} isLoading={isLoading} />
            </SectionCard>

            <SectionCard
              title="Saved Budgets"
              action={
                editingBudgetId ? (
                  <Chip
                    label="Editing Saved Budget"
                    size="small"
                    color="info"
                  />
                ) : undefined
              }
            >
              {isLoading && (
                <Stack spacing={1} sx={{ mb: 2 }}>
                  <Skeleton variant="text" width="70%" />
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="80%" />
                  <Skeleton variant="text" width="50%" />
                </Stack>
              )}
              <BudgetList
                reloadKey={budgetsReloadKey}
                onLoad={loadBudget}
                onEdit={editBudget}
                onBudgetsLoaded={handleBudgetsLoaded}
                onLoadingChange={setIsLoading}
              />
            </SectionCard>
          </Stack>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
        <SectionCard title="Budget Flow">
          {isLoading ? (
            <Skeleton variant="rectangular" height={520} />
          ) : (
            <SankeyChart data={insights.sankeyData} />
          )}
        </SectionCard>
      </Box>
    </Container>
  );
}
